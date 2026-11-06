import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, iconGlyphFix } from "../theme/tokens";

type IconName = keyof typeof Ionicons.glyphMap;

// Shared icon-only control — "solid" is the black-circle primary affordance
// (add keep/post), "plain" is a bare tinted glyph for secondary actions
// (sign out) that shouldn't compete visually with it.
export default function IconButton({
  name,
  onPress,
  size = 40,
  variant = "plain",
  color,
  disabled,
  style,
}: {
  name: IconName;
  onPress: () => void;
  size?: number;
  variant?: "solid" | "plain";
  color?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const isSolid = variant === "solid";
  const iconSize = size * (isSolid ? 0.5 : 0.6);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      style={({ pressed }) => [
        styles.base,
        { width: size, height: size, borderRadius: size / 2 },
        isSolid && { backgroundColor: colors.textPrimary },
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Ionicons
        name={name}
        size={iconSize}
        color={color ?? (isSolid ? colors.textInverse : colors.textPrimary)}
        style={iconGlyphFix(iconSize)}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.6,
  },
  disabled: {
    opacity: 0.4,
  },
});
