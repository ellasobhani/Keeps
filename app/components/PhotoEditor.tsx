import { useRef, useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  Image as RNImage,
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
  type PanGestureHandlerGestureEvent,
  type PanGestureHandlerStateChangeEvent,
  type PinchGestureHandlerGestureEvent,
  type PinchGestureHandlerStateChangeEvent,
} from "react-native-gesture-handler";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { colors, spacing, radii, typography } from "../theme/tokens";

const EDIT_SIZE = Math.min(Dimensions.get("window").width, Dimensions.get("window").height) - spacing.lg * 2;
const MAX_SCALE = 4;
const MAX_OUTPUT_SIZE = 1080;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

// Given the current (post-rotation) logical width/height of the image at
// `scale`, how far the image can pan before its edge would leave the square
// frame — pan is clamped to this at every step so the frame never shows a gap.
function maxPanOffset(naturalSize: number, scale: number): number {
  const displayed = naturalSize * scale;
  return Math.max(0, (displayed - EDIT_SIZE) / 2);
}

// Full-screen crop/zoom/rotate editor for a single local image. Bakes the
// edit into a new file via expo-image-manipulator rather than storing a
// display transform, so every consumer (grid tiles, feed thumbnails, other
// devices) just renders the resulting image like any other — no transform
// metadata to thread through the schema or plumb into every renderer.
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
  const [pinchScale, setPinchScale] = useState(1);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const pinchBase = useRef(1);
  const panBase = useRef({ x: 0, y: 0 });
  const panRef = useRef(null);
  const pinchRef = useRef(null);

  useEffect(() => {
    if (!visible || !uri) return;
    setNaturalSize(null);
    setLoadError(false);
    setRotationSteps(0);
    setPinchScale(1);
    setTranslateX(0);
    setTranslateY(0);
    pinchBase.current = 1;
    panBase.current = { x: 0, y: 0 };
    RNImage.getSize(
      uri,
      (width, height) => setNaturalSize({ width, height }),
      () => setLoadError(true)
    );
  }, [visible, uri]);

  const rotated = rotationSteps % 2 === 1;
  const logicalW = naturalSize ? (rotated ? naturalSize.height : naturalSize.width) : 0;
  const logicalH = naturalSize ? (rotated ? naturalSize.width : naturalSize.height) : 0;
  const baseScale = naturalSize ? EDIT_SIZE / Math.min(logicalW, logicalH) : 1;
  const displayScale = baseScale * pinchScale;
  // Pre-rotation element size — the Image itself renders at its true aspect
  // ratio and gets spun with a `rotate` transform, rather than being
  // stretched into a swapped box.
  const preW = naturalSize ? naturalSize.width * displayScale : 0;
  const preH = naturalSize ? naturalSize.height * displayScale : 0;

  const onPinchGestureEvent = (event: PinchGestureHandlerGestureEvent) => {
    if (!naturalSize) return;
    const nextScale = clamp(pinchBase.current * event.nativeEvent.scale, 1, MAX_SCALE);
    const nextDisplayScale = baseScale * nextScale;
    const maxX = maxPanOffset(logicalW, nextDisplayScale);
    const maxY = maxPanOffset(logicalH, nextDisplayScale);
    setPinchScale(nextScale);
    setTranslateX((x) => clamp(x, -maxX, maxX));
    setTranslateY((y) => clamp(y, -maxY, maxY));
  };

  const onPinchHandlerStateChange = (event: PinchGestureHandlerStateChangeEvent) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      pinchBase.current = clamp(pinchBase.current * event.nativeEvent.scale, 1, MAX_SCALE);
    }
  };

  const onPanGestureEvent = (event: PanGestureHandlerGestureEvent) => {
    if (!naturalSize) return;
    const maxX = maxPanOffset(logicalW, displayScale);
    const maxY = maxPanOffset(logicalH, displayScale);
    setTranslateX(clamp(panBase.current.x + event.nativeEvent.translationX, -maxX, maxX));
    setTranslateY(clamp(panBase.current.y + event.nativeEvent.translationY, -maxY, maxY));
  };

  const onPanHandlerStateChange = (event: PanGestureHandlerStateChangeEvent) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      const maxX = maxPanOffset(logicalW, displayScale);
      const maxY = maxPanOffset(logicalH, displayScale);
      panBase.current = {
        x: clamp(panBase.current.x + event.nativeEvent.translationX, -maxX, maxX),
        y: clamp(panBase.current.y + event.nativeEvent.translationY, -maxY, maxY),
      };
    }
  };

  const handleRotate = () => {
    setRotationSteps((s) => (s + 1) % 4);
    setPinchScale(1);
    setTranslateX(0);
    setTranslateY(0);
    pinchBase.current = 1;
    panBase.current = { x: 0, y: 0 };
  };

  const handleSave = async () => {
    if (!uri || !naturalSize) return;
    setIsSaving(true);
    try {
      const cropSize = clamp(EDIT_SIZE / displayScale, 1, Math.min(logicalW, logicalH));
      const originX = clamp((logicalW - cropSize) / 2 - translateX / displayScale, 0, logicalW - cropSize);
      const originY = clamp((logicalH - cropSize) / 2 - translateY / displayScale, 0, logicalH - cropSize);

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
                    <View
                      style={{
                        position: "absolute",
                        left: EDIT_SIZE / 2 + translateX - preW / 2,
                        top: EDIT_SIZE / 2 + translateY - preH / 2,
                        width: preW,
                        height: preH,
                        transform: [{ rotate: `${rotationSteps * 90}deg` }],
                      }}
                    >
                      <Image source={{ uri }} style={{ width: preW, height: preH }} contentFit="cover" />
                    </View>
                  </View>
                </PanGestureHandler>
              </PinchGestureHandler>
            )}
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.hint}>Pinch to zoom, drag to reposition</Text>
          <Pressable style={styles.rotateButton} onPress={handleRotate} hitSlop={8}>
            <Ionicons name="sync-outline" size={20} color={colors.textInverse} />
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
    backgroundColor: "#000",
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
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.xs,
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
    color: "rgba(255,255,255,0.6)",
  },
  rotateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  rotateButtonText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.textInverse,
  },
});
