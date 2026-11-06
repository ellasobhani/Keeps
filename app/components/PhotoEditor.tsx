import { useRef, useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  Image as RNImage,
  Animated,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import {
  PanGestureHandler,
  PinchGestureHandler,
  State,
  type PanGestureHandlerStateChangeEvent,
  type PinchGestureHandlerStateChangeEvent,
} from "react-native-gesture-handler";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { colors, spacing, radii, typography, iconGlyphFix } from "../theme/tokens";

const EDIT_SIZE = Math.min(Dimensions.get("window").width, Dimensions.get("window").height) - spacing.lg * 2;
const MAX_SCALE = 4;
const MAX_OUTPUT_SIZE = 1080;
const SPRING = { friction: 7, tension: 80, useNativeDriver: true } as const;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

// Given the current (post-rotation) logical width/height of the image at
// `scale`, how far the image can pan before its edge would leave the square
// frame — pan is clamped to this whenever a gesture settles so the frame
// never shows a gap.
function maxPanOffset(naturalSize: number, scale: number): number {
  const displayed = naturalSize * scale;
  return Math.max(0, (displayed - EDIT_SIZE) / 2);
}

// Full-screen crop/zoom/rotate editor for a single local image. Bakes the
// edit into a new file via expo-image-manipulator rather than storing a
// display transform, so every consumer (grid tiles, feed thumbnails, other
// devices) just renders the resulting image like any other — no transform
// metadata to thread through the schema or plumb into every renderer.
//
// Pinch/pan live entirely in Animated.Values driven by useNativeDriver, not
// React state — an earlier version called setState on every gesture frame,
// which re-rendered (and re-laid-out) the full-screen Image on every touch
// move and was the source of the reported lag/jank. Bounds clamping only
// runs once per gesture, at release (onHandlerStateChange), not per frame:
// a brief overshoot while actively pinching/panning is normal, pleasant
// mobile UX (same rubber-band feel as iOS Photos), and it means the only
// per-gesture JS work is a handful of arithmetic ops, not a render.
export default function PhotoEditor({
  visible,
  uri,
  onCancel,
  onSave,
}: {
  visible: boolean;
  uri: string | null;
  onCancel: () => void;
  onSave: (newUri: string) => void;
}) {
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [rotationSteps, setRotationSteps] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // Each axis/factor is split into a committed "base" (set once, at rest,
  // via setValue) and a live "gesture" value (driven every frame by
  // Animated.event, native-side only) — translateX = panBaseX + panGestureX,
  // scale = pinchBase * pinchGesture. Composing them this way means the
  // continuous per-frame updates never touch the base values or React state.
  const panBaseX = useRef(new Animated.Value(0)).current;
  const panBaseY = useRef(new Animated.Value(0)).current;
  const panGestureX = useRef(new Animated.Value(0)).current;
  const panGestureY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(Animated.add(panBaseX, panGestureX)).current;
  const translateY = useRef(Animated.add(panBaseY, panGestureY)).current;

  const pinchBaseAnim = useRef(new Animated.Value(1)).current;
  const pinchGestureAnim = useRef(new Animated.Value(1)).current;
  const scale = useRef(Animated.multiply(pinchBaseAnim, pinchGestureAnim)).current;

  // Plain-number mirrors of the committed base values — read synchronously
  // by the bounds-clamping check and by handleSave's crop math, neither of
  // which can read an Animated.Value directly.
  const panOffset = useRef({ x: 0, y: 0 });
  const pinchBase = useRef(1);

  const panRef = useRef(null);
  const pinchRef = useRef(null);

  useEffect(() => {
    if (!visible || !uri) return;
    setNaturalSize(null);
    setLoadError(false);
    setRotationSteps(0);
    panBaseX.setValue(0);
    panBaseY.setValue(0);
    panGestureX.setValue(0);
    panGestureY.setValue(0);
    pinchBaseAnim.setValue(1);
    pinchGestureAnim.setValue(1);
    panOffset.current = { x: 0, y: 0 };
    pinchBase.current = 1;
    RNImage.getSize(
      uri,
      (width, height) => setNaturalSize({ width, height }),
      () => setLoadError(true)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, uri]);

  const rotated = rotationSteps % 2 === 1;
  const logicalW = naturalSize ? (rotated ? naturalSize.height : naturalSize.width) : 0;
  const logicalH = naturalSize ? (rotated ? naturalSize.width : naturalSize.height) : 0;
  // min(logicalW, logicalH) is the same value regardless of rotation (it
  // just swaps which axis is which), so this — unlike preW/preH — never
  // needs to change on rotate.
  const baseScale = naturalSize ? EDIT_SIZE / Math.min(logicalW, logicalH) : 1;
  // Pre-rotation element size — the Image renders at its true aspect ratio
  // and gets spun with a `rotate` transform, rather than being stretched
  // into a swapped box. Deliberately excludes pinch scale (unlike the old
  // version) — that's applied as a `transform: scale` instead of by
  // resizing the element, so this stays constant across a pinch gesture.
  const preW = naturalSize ? naturalSize.width * baseScale : 0;
  const preH = naturalSize ? naturalSize.height * baseScale : 0;

  // Re-centers pan whenever the effective scale changes (pinch end, or
  // rotate) — zooming back out can leave a previously-valid pan offset
  // outside the new, smaller bounds.
  const clampPanToBounds = (effectiveScale: number) => {
    const displayScale = baseScale * effectiveScale;
    const maxX = maxPanOffset(logicalW, displayScale);
    const maxY = maxPanOffset(logicalH, displayScale);
    const clampedX = clamp(panOffset.current.x, -maxX, maxX);
    const clampedY = clamp(panOffset.current.y, -maxY, maxY);
    if (clampedX !== panOffset.current.x) {
      panOffset.current.x = clampedX;
      Animated.spring(panBaseX, { ...SPRING, toValue: clampedX }).start();
    }
    if (clampedY !== panOffset.current.y) {
      panOffset.current.y = clampedY;
      Animated.spring(panBaseY, { ...SPRING, toValue: clampedY }).start();
    }
  };

  const onPanGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: panGestureX, translationY: panGestureY } }],
    { useNativeDriver: true }
  );

  const onPanHandlerStateChange = (event: PanGestureHandlerStateChangeEvent) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      const finalX = panOffset.current.x + event.nativeEvent.translationX;
      const finalY = panOffset.current.y + event.nativeEvent.translationY;
      panOffset.current = { x: finalX, y: finalY };
      panBaseX.setValue(finalX);
      panBaseY.setValue(finalY);
      panGestureX.setValue(0);
      panGestureY.setValue(0);
      clampPanToBounds(pinchBase.current);
    }
  };

  const onPinchGestureEvent = Animated.event([{ nativeEvent: { scale: pinchGestureAnim } }], {
    useNativeDriver: true,
  });

  const onPinchHandlerStateChange = (event: PinchGestureHandlerStateChangeEvent) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      const committed = clamp(pinchBase.current * event.nativeEvent.scale, 1, MAX_SCALE);
      pinchBase.current = committed;
      pinchBaseAnim.setValue(committed);
      pinchGestureAnim.setValue(1);
      clampPanToBounds(committed);
    }
  };

  const handleRotate = () => {
    setRotationSteps((s) => (s + 1) % 4);
    panBaseX.setValue(0);
    panBaseY.setValue(0);
    panGestureX.setValue(0);
    panGestureY.setValue(0);
    pinchBaseAnim.setValue(1);
    pinchGestureAnim.setValue(1);
    panOffset.current = { x: 0, y: 0 };
    pinchBase.current = 1;
  };

  const handleSave = async () => {
    if (!uri || !naturalSize) return;
    setIsSaving(true);
    try {
      const displayScale = baseScale * pinchBase.current;
      const cropSize = clamp(EDIT_SIZE / displayScale, 1, Math.min(logicalW, logicalH));
      const originX = clamp((logicalW - cropSize) / 2 - panOffset.current.x / displayScale, 0, logicalW - cropSize);
      const originY = clamp((logicalH - cropSize) / 2 - panOffset.current.y / displayScale, 0, logicalH - cropSize);

      const actions = [];
      if (rotationSteps !== 0) actions.push({ rotate: rotationSteps * 90 });
      actions.push({
        crop: {
          originX: Math.round(originX),
          originY: Math.round(originY),
          width: Math.round(cropSize),
          height: Math.round(cropSize),
        },
      });
      if (cropSize > MAX_OUTPUT_SIZE) {
        actions.push({ resize: { width: MAX_OUTPUT_SIZE, height: MAX_OUTPUT_SIZE } });
      }

      const result = await manipulateAsync(uri, actions, { compress: 0.9, format: SaveFormat.JPEG });
      onSave(result.uri);
    } catch {
      setLoadError(true);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onCancel}>
      <View style={styles.container}>
        <View style={styles.toolbar}>
          <Pressable onPress={onCancel} hitSlop={8}>
            <Text style={styles.toolbarAction}>Cancel</Text>
          </Pressable>
          <Text style={styles.toolbarTitle}>Edit photo</Text>
          <Pressable onPress={handleSave} hitSlop={8} disabled={!naturalSize || isSaving}>
            {isSaving ? (
              <ActivityIndicator color={colors.accent} />
            ) : (
              <Text style={[styles.toolbarAction, styles.toolbarSave]}>Done</Text>
            )}
          </Pressable>
        </View>

        <View style={styles.frameWrap}>
          <View style={[styles.frame, { width: EDIT_SIZE, height: EDIT_SIZE }]}>
            {!naturalSize && !loadError && <ActivityIndicator color={colors.textInverse} />}
            {loadError && <Text style={styles.errorText}>Couldn't load this photo.</Text>}
            {naturalSize && uri && (
              <PinchGestureHandler
                ref={pinchRef}
                simultaneousHandlers={panRef}
                onGestureEvent={onPinchGestureEvent}
                onHandlerStateChange={onPinchHandlerStateChange}
              >
                <PanGestureHandler
                  ref={panRef}
                  simultaneousHandlers={pinchRef}
                  onGestureEvent={onPanGestureEvent}
                  onHandlerStateChange={onPanHandlerStateChange}
                  minPointers={1}
                  maxPointers={2}
                >
                  <View style={StyleSheet.absoluteFill}>
                    <Animated.View
                      style={{
                        position: "absolute",
                        left: (EDIT_SIZE - preW) / 2,
                        top: (EDIT_SIZE - preH) / 2,
                        width: preW,
                        height: preH,
                        transform: [
                          { translateX },
                          { translateY },
                          { rotate: `${rotationSteps * 90}deg` },
                          { scale },
                        ],
                      }}
                    >
                      <Image source={{ uri }} style={{ width: preW, height: preH }} contentFit="cover" />
                    </Animated.View>
                  </View>
                </PanGestureHandler>
              </PinchGestureHandler>
            )}
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.hint}>Pinch to zoom, drag to reposition</Text>
          <Pressable style={styles.rotateButton} onPress={handleRotate} hitSlop={8}>
            <Ionicons name="sync-outline" size={20} color={colors.textInverse} style={iconGlyphFix(20)} />
            <Text style={styles.rotateButtonText}>Rotate</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.editorBackground,
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  toolbarTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.textInverse,
  },
  toolbarAction: {
    fontSize: typography.size.md,
    color: colors.textInverse,
  },
  toolbarSave: {
    fontWeight: typography.weight.bold,
    color: colors.accentMuted,
  },
  frameWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  frame: {
    overflow: "hidden",
    backgroundColor: colors.editorFrame,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    color: colors.textInverse,
    fontSize: typography.size.sm,
  },
  footer: {
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  hint: {
    fontSize: typography.size.xs,
    color: colors.editorHint,
  },
  rotateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    backgroundColor: colors.editorControlBackground,
  },
  rotateButtonText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.textInverse,
  },
});
