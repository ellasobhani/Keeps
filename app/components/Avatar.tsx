import { View, Text, Image, StyleSheet } from "react-native";
import { colors, typography } from "../theme/tokens";

// `uri` is an already-resolved, directly-renderable image source — either a
// public avatar URL (see lib/storage.ts#getAvatarUrl) or a local file uri
// from the picker while previewing an unsaved change.
export default function Avatar({
  uri,
  displayName,
  size = 72,
}: {
  uri: string | null;
  displayName: string;
  size?: number;
}) {
  const initial = displayName.trim().charAt(0).toUpperCase() || "?";
  const dimensions = { width: size, height: size, borderRadius: size / 2 };

  return uri ? (
    <Image source={{ uri }} style={[styles.circle, dimensions]} />
  ) : (
    <View style={[styles.circle, styles.placeholder, dimensions]}>
      <Text style={[styles.initial, { fontSize: size * 0.4 }]}>{initial}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    backgroundColor: colors.surface,
  },
  placeholder: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  initial: {
    color: colors.textSecondary,
    fontWeight: typography.weight.bold,
  },
});
