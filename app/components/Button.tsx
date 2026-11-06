import { Pressable, Text, ActivityIndicator, StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { colors, spacing, radii, typography } from "../theme/tokens";

type Variant = "primary" | "secondary" | "text" | "danger";

export default function Button({
  label,
  onPress,
  variant = "primary",
  disabled,
  loading,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variantStyles[variant],
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "primary" || variant === "danger" ? colors.textInverse : colors.textPrimary}
        />
      ) : (
        <Text style={[styles.label, variantTextStyles[variant]]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.pill,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.4,
  },
  label: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    letterSpacing: typography.letterSpacing.wide,
    textTransform: "uppercase",
  },
});

const variantStyles = StyleSheet.create({
  primary: {
    backgroundColor: colors.textPrimary,
  },
  secondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.textPrimary,
  },
  text: {
    backgroundColor: "transparent",
    paddingHorizontal: 0,
    paddingVertical: spacing.xs,
    alignSelf: "flex-start",
  },
  danger: {
    backgroundColor: colors.danger,
  },
});

const variantTextStyles = StyleSheet.create({
  primary: {
    color: colors.textInverse,
  },
  secondary: {
    color: colors.textPrimary,
  },
  text: {
    color: colors.accent,
  },
  danger: {
    color: colors.textInverse,
  },
});
