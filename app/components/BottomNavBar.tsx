import { View, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { AppStackParamList } from "../navigation/AppNavigator";
import { colors, spacing, iconGlyphFix } from "../theme/tokens";

// A plain fixed row, not a nested tab navigator — same call as SideMenu's
// "avoid pulling in new nav-primitive deps for something this simple": both
// destinations are already plain screens on the root stack. popTo() pops
// back to an existing instance of the target if the stack already has one
// above/at the current screen — but if it doesn't, it does NOT push a new
// one the way navigate() would; per @react-navigation/routers' StackRouter,
// it instead *replaces* everything from the current screen down to (but not
// including) whatever's directly beneath it. That's fine here specifically
// because these three screens only ever sit at the bottom of their own tab's
// history, so "replace the current tab root" is exactly "switch tabs" — but
// it's a sharp edge: calling popTo() on a screen that ever finds itself with
// nothing beneath it (e.g. the app's actual root) wipes that root out
// entirely, leaving no way back. That's what broke every "tap into a keep /
// profile" flow elsewhere in the app when they were switched from
// navigate() to popTo() — see Profile.tsx, PublicProfile.tsx, etc., all
// reverted back to navigate().
export default function BottomNavBar({ active }: { active: "profile" | "feed" | "search" }) {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom + spacing.sm }]}>
      <Pressable style={styles.tab} onPress={() => navigation.popTo("Profile")} hitSlop={8}>
        <Ionicons
          name={active === "profile" ? "person" : "person-outline"}
          size={24}
          color={active === "profile" ? colors.textPrimary : colors.textSecondary}
          style={iconGlyphFix(24)}
        />
      </Pressable>
      <Pressable style={styles.tab} onPress={() => navigation.popTo("Feed")} hitSlop={8}>
        <Ionicons
          name={active === "feed" ? "newspaper" : "newspaper-outline"}
          size={24}
          color={active === "feed" ? colors.textPrimary : colors.textSecondary}
          style={iconGlyphFix(24)}
        />
      </Pressable>
      <Pressable style={styles.tab} onPress={() => navigation.popTo("Search")} hitSlop={8}>
        <Ionicons
          name={active === "search" ? "search" : "search-outline"}
          size={24}
          color={active === "search" ? colors.textPrimary : colors.textSecondary}
          style={iconGlyphFix(24)}
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
