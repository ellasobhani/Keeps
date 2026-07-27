import { View, Text, StyleSheet } from "react-native";
import { colors, spacing, typography } from "../theme/tokens";

// Placeholder for screens whose real UI arrives in a later milestone (see
// mvp_spec.md §5). Exists only to prove navigation + auth gating works.
export default function StubScreen({ title }: { title: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>Coming in a later milestone.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
  },
});
