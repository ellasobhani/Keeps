import { View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, radii } from "../theme/tokens";

// Tiny swipe affordance for horizontal carousels — points toward more
// content, hidden at whichever end has nothing further to reveal.
export default function CarouselChevron({ direction }: { direction: "left" | "right" }) {
  return (
    <View style={[styles.badge, direction === "left" ? styles.left : styles.right]}>
      <Ionicons
        name={direction === "left" ? "chevron-back" : "chevron-forward"}
        size={14}
        color={colors.textInverse}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: "absolute",
    top: "50%",
    marginTop: -12,
    width: 24,
    height: 24,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.scrim,
  },
  left: {
    left: spacing.sm,
  },
  right: {
    right: spacing.sm,
  },
});
