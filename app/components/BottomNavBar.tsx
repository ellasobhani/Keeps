import { View, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { AppStackParamList } from "../navigation/AppNavigator";
import { colors, spacing } from "../theme/tokens";

// A plain fixed row, not a nested tab navigator — same call as SideMenu's
// "avoid pulling in new nav-primitive deps for something this simple": both
// destinations are already plain screens on the root stack, and
// navigation.navigate() on a stack reuses the existing instance instead of
// pushing a duplicate when it's already in history, which is all the
// "switch tabs" behavior this needs.
export default function BottomNavBar({ active }: { active: "profile" | "feed" | "search" }) {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom + spacing.sm }]}>
      <Pressable style={styles.tab} onPress={() => navigation.navigate("Profile")} hitSlop={8}>
        <Ionicons
          name={active === "profile" ? "person" : "person-outline"}
          size={24}
          color={active === "profile" ? colors.textPrimary : colors.textSecondary}
        />
      </Pressable>
      <Pressable style={styles.tab} onPress={() => navigation.navigate("Feed")} hitSlop={8}>
        <Ionicons
          name={active === "feed" ? "newspaper" : "newspaper-outline"}
          size={24}
          color={active === "feed" ? colors.textPrimary : colors.textSecondary}
        />
      </Pressable>
      <Pressable style={styles.tab} onPress={() => navigation.navigate("Search")} hitSlop={8}>
        <Ionicons
          name={active === "search" ? "search" : "search-outline"}
          size={24}
          color={active === "search" ? colors.textPrimary : colors.textSecondary}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
    paddingTop: spacing.sm,
  },
  tab: {
    flex: 1,
    alignItems: "center",
  },
});
