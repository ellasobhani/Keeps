import type { ReactNode } from "react";
import { KeyboardAvoidingView, ScrollView, Platform, StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { colors } from "../theme/tokens";

// Single place every form screen routes its keyboard handling through, so
// "does the keyboard cover the save button" is answered once here instead
// of per-screen — a screen that skips this wrapper is exactly the kind of
// gap that let EditProfile/CreateKeep/etc. miss it before.
export default function KeyboardAvoidingScreen({
  children,
  contentContainerStyle,
}: {
  children: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
}) {
  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={contentContainerStyle}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
