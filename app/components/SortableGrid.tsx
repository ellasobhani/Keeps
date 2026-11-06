import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, View, StyleSheet } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

// Plain react-native-gesture-handler + core Animated, deliberately *not*
// react-native-reanimated — RNGH's Gesture API works standalone with normal
// JS-thread callbacks when Reanimated isn't installed, and Reanimated 4's
// split-out react-native-worklets native module isn't part of the Expo Go
// binary yet, which crashed app boot with "Exception in HostFunction" the
// moment either was imported.
const SPRING = { friction: 7, tension: 80, useNativeDriver: true } as const;
// Below this hold time a touch resolves as a tap (onPressItem); at or past it,
// the tile lifts and starts following the finger — mirrors the iOS Photos /
// Instagram composer convention so a normal tap-to-replace/tap-to-view still
// works without fighting the drag gesture for the same touch.
const LONG_PRESS_MS = 280;

function slotPosition(index: number, numColumns: number, itemSize: number, gap: number) {
  const col = index % numColumns;
  const row = Math.floor(index / numColumns);
  return { x: col * (itemSize + gap), y: row * (itemSize + gap) };
}

interface SortableGridProps<T> {
  data: T[];
  keyExtractor: (item: T) => string;
  renderItem: (item: T, index: number, isDragging: boolean) => React.ReactNode;
  // Rendered as a plain sibling on top of (not nested inside) the drag
  // gesture region, e.g. a corner delete badge — keeps it on RN's own touch
  // responder system instead of contending with the pan/tap gesture.
  renderOverlay?: (item: T, index: number) => React.ReactNode;
  onPressItem?: (item: T, index: number) => void;
  onDragEnd: (data: T[]) => void;
  numColumns: number;
  itemSize: number;
  gap: number;
}

export default function SortableGrid<T>({
  data,
  keyExtractor,
  renderItem,
  renderOverlay,
  onPressItem,
  onDragEnd,
  numColumns,
  itemSize,
  gap,
}: SortableGridProps<T>) {
  const [order, setOrder] = useState(() => data.map(keyExtractor));

  // Reset to the parent's order only when the *set* of items changed (add/
  // remove) — a committed drag reorder already matches `data` by the time
  // this runs, so it must not stomp on in-progress local ordering.
  useEffect(() => {
    setOrder((prev) => {
      const keys = data.map(keyExtractor);
      const sameSet = prev.length === keys.length && prev.every((k) => keys.includes(k));
      return sameSet ? prev : keys;
    });
  }, [data, keyExtractor]);

  const itemsByKey = useMemo(() => {
    const map = new Map<string, { item: T; index: number }>();
    data.forEach((item, index) => map.set(keyExtractor(item), { item, index }));
    return map;
  }, [data, keyExtractor]);

  const orderRef = useRef(order);
  orderRef.current = order;

  const rows = Math.ceil(order.length / numColumns);
  const containerWidth = numColumns * itemSize + (numColumns - 1) * gap;
  const containerHeight = rows > 0 ? rows * itemSize + (rows - 1) * gap : 0;

  const commitDragEnd = () => {
    const reordered = orderRef.current
      .map((key) => itemsByKey.get(key))
      .filter((entry): entry is { item: T; index: number } => !!entry)
      .map((entry) => entry.item);
    onDragEnd(reordered);
  };

  return (
    <View style={{ width: containerWidth, height: containerHeight }}>
      {order.map((key) => {
        const entry = itemsByKey.get(key);
        if (!entry) return null;
        return (
          <SortableGridItem
            key={key}
            itemKey={key}
            order={order}
            setOrder={setOrder}
            onDragCommit={commitDragEnd}
            numColumns={numColumns}
            itemSize={itemSize}
            gap={gap}
            maxX={containerWidth - itemSize}
            maxY={containerHeight - itemSize}
            onPress={onPressItem ? () => onPressItem(entry.item, entry.index) : undefined}
            renderContent={(isDragging) => renderItem(entry.item, entry.index, isDragging)}
            renderOverlay={renderOverlay ? () => renderOverlay(entry.item, entry.index) : undefined}
          />
        );
      })}
    </View>
  );
}

function SortableGridItem({
  itemKey,
  order,
  setOrder,
  onDragCommit,
  numColumns,
  itemSize,
  gap,
  maxX,
  maxY,
  onPress,
  renderContent,
  renderOverlay,
}: {
  itemKey: string;
  order: string[];
  setOrder: React.Dispatch<React.SetStateAction<string[]>>;
  onDragCommit: () => void;
  numColumns: number;
  itemSize: number;
  gap: number;
  // Clamp bounds (top-left corner, in grid-local coordinates) so a dragged
  // tile can't be dragged out past the edges of the grid itself.
  maxX: number;
  maxY: number;
  onPress?: () => void;
  renderContent: (isDragging: boolean) => React.ReactNode;
  renderOverlay?: () => React.ReactNode;
}) {
  const orderIndex = order.indexOf(itemKey);
  const slot = slotPosition(orderIndex, numColumns, itemSize, gap);

  const translateX = useRef(new Animated.Value(slot.x)).current;
  const translateY = useRef(new Animated.Value(slot.y)).current;
  const scale = useRef(new Animated.Value(1)).current;
  // Mirrors translateX/Y as plain numbers — Animated.Value has no public
  // synchronous getter, and onUpdate needs the current position every frame
  // to compute which grid cell the finger is over.
  const posX = useRef(slot.x);
  const posY = useRef(slot.y);
  const startX = useRef(slot.x);
  const startY = useRef(slot.y);
  const lastIndex = useRef(orderIndex);
  const isDraggingRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (isDraggingRef.current) return;
    posX.current = slot.x;
    posY.current = slot.y;
    // lastIndex only otherwise updates mid-drag (onUpdate) — if this tile's
    // slot moved because a *different* drag, or a delete/reorder elsewhere,
    // shifted it, lastIndex goes stale. Left uncorrected, the next drag on
    // this tile compares a fresh finger-position index against that stale
    // value and fires a spurious moveTo the instant the touch starts.
    lastIndex.current = orderIndex;
    Animated.spring(translateX, { ...SPRING, toValue: slot.x }).start();
    Animated.spring(translateY, { ...SPRING, toValue: slot.y }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slot.x, slot.y, orderIndex]);

  const moveTo = (newIndex: number) => {
    setOrder((prev) => {
      const from = prev.indexOf(itemKey);
      if (from === -1 || from === newIndex || newIndex < 0 || newIndex >= prev.length) return prev;
      const next = [...prev];
      next.splice(from, 1);
      next.splice(newIndex, 0, itemKey);
      return next;
    });
  };

  const itemCount = order.length;

  const pan = Gesture.Pan()
    .activateAfterLongPress(LONG_PRESS_MS)
    .onStart(() => {
      isDraggingRef.current = true;
      startX.current = posX.current;
      startY.current = posY.current;
      setIsDragging(true);
      Animated.spring(scale, { ...SPRING, toValue: 1.06 }).start();
    })
    .onUpdate((e) => {
      posX.current = Math.min(Math.max(startX.current + e.translationX, 0), maxX);
      posY.current = Math.min(Math.max(startY.current + e.translationY, 0), maxY);
      translateX.setValue(posX.current);
      translateY.setValue(posY.current);

      const col = Math.min(Math.max(Math.round(posX.current / (itemSize + gap)), 0), numColumns - 1);
      const row = Math.max(Math.round(posY.current / (itemSize + gap)), 0);
      const newIndex = Math.min(row * numColumns + col, itemCount - 1);
      if (newIndex !== lastIndex.current) {
        lastIndex.current = newIndex;
        moveTo(newIndex);
      }
    })
    .onEnd(() => {
      isDraggingRef.current = false;
      setIsDragging(false);
      // Snap explicitly to the last hovered cell instead of relying on the
      // slot-tracking effect below — that effect only re-fires when this
      // item's *own* orderIndex changes, so dropping back into the same
      // cell you started in (a very common release) left the tile sitting
      // wherever the finger let go instead of centered in the grid cell.
      const finalSlot = slotPosition(lastIndex.current, numColumns, itemSize, gap);
      posX.current = finalSlot.x;
      posY.current = finalSlot.y;
      Animated.spring(translateX, { ...SPRING, toValue: finalSlot.x }).start();
      Animated.spring(translateY, { ...SPRING, toValue: finalSlot.y }).start();
      Animated.spring(scale, { ...SPRING, toValue: 1 }).start();
      onDragCommit();
    });

  const tap = Gesture.Tap()
    .maxDuration(LONG_PRESS_MS - 50)
    .onEnd(() => {
      onPress?.();
    });

  // Race: whichever resolves first wins — a quick release fires the tap
  // before the pan's long-press threshold elapses; holding past it lets the
  // pan claim the touch and cancels the tap outright.
  const gesture = Gesture.Race(pan, tap);

  return (
    <Animated.View
      style={[
        styles.item,
        { width: itemSize, height: itemSize, zIndex: isDragging ? 100 : 0 },
        { transform: [{ translateX }, { translateY }, { scale }] },
      ]}
    >
      <GestureDetector gesture={gesture}>
        <View style={styles.fill}>{renderContent(isDragging)}</View>
      </GestureDetector>
      {renderOverlay?.()}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  item: {
    position: "absolute",
  },
  fill: {
    width: "100%",
    height: "100%",
  },
});
