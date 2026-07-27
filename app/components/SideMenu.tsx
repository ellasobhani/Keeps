import { useEffect, useRef, useState } from "react";
import { Modal, View, Text, Pressable, Animated, Dimensions, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, radii, typography } from "../theme/tokens";

const PANEL_WIDTH = Math.min(300, Dimensions.get("window").width * 0.8);

export type SideMenuItem = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
};

// No drawer navigator / gesture-handler in this project — a Modal + Animated
// slide-in avoids pulling in new native deps for what's just a tap-open menu.
export default function SideMenu({
  visible,
  onClose,
  items,
  onSignOut,
}: {
  visible: boolean;
  onClose: () => void;
  items: SideMenuItem[];
  onSignOut: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [isMounted, setIsMounted] = useState(visible);
  const translateX = useRef(new Animated.Value(PANEL_WIDTH)).current;

  useEffect(() => {
    if (visible) {
      setIsMounted(true);
      Animated.timing(translateX, { toValue: 0, duration: 220, useNativeDriver: true }).start();
    } else if (isMounted) {
      Animated.timing(translateX, { toValue: PANEL_WIDTH, duration: 180, useNativeDriver: true }).start(() => {
        setIsMounted(false);
      });
    }
    // isMounted intentionally excluded — this effect only reacts to `visible` changing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, translateX]);

  if (!isMounted) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <Animated.View
        style={[
          styles.panel,
          {
            width: PANEL_WIDTH,
            paddingTop: insets.top + spacing.lg,
            paddingBottom: insets.bottom + spacing.lg,
            transform: [{ translateX }],
          },
        ]}
      >
        <View style={styles.items}>
          {items.map((item) => (
            <Pressable key={item.key} style={styles.item} onPress={item.onPress}>
              <Ionicons name={item.icon} size={20} color={colors.textPrimary} />
              <Text style={styles.itemLabel}>{item.label}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable style={styles.item} onPress={onSignOut}>
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          <Text style={[styles.itemLabel, styles.signOutLabel]}>Sign out</Text>
        </Pressable>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  panel: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
  },
  items: {
    flex: 1,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  itemLabel: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.medium,
    color: colors.textPrimary,
  },
  signOutLabel: {
    color: colors.danger,
  },
});
