import { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, Switch, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AppStackParamList } from "../navigation/AppNavigator";
import Button from "../components/Button";
import KeyboardAvoidingScreen from "../components/KeyboardAvoidingScreen";
import { PRIVACY_OPTIONS } from "../lib/keepPrivacyOptions";
import { colors, spacing, radii, typography } from "../theme/tokens";
import type { PrivacyMode } from "../types/database";

type Props = NativeStackScreenProps<AppStackParamList, "CreateKeep">;

export default function CreateKeep({ navigation }: Props) {
  const [title, setTitle] = useState("");
  const [privacyMode, setPrivacyMode] = useState<PrivacyMode>("private");
  const [isHiddenFromProfile, setIsHiddenFromProfile] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      headerTitleStyle: { fontFamily: typography.family.serif, fontSize: typography.size.lg, color: colors.textPrimary },
      headerLeft: () => (
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Text style={styles.headerCancel}>Cancel</Text>
        </Pressable>
      ),
    });
  }, [navigation]);

  const handleContinue = () => {
    if (!title.trim()) return;
    navigation.navigate("CreateKeepCover", {
      title: title.trim(),
      privacyMode,
      hiddenFromProfile: isHiddenFromProfile,
    });
  };

  return (
    <KeyboardAvoidingScreen contentContainerStyle={styles.content}>
      <TextInput
        style={styles.titleInput}
        value={title}
        onChangeText={setTitle}
        placeholder="Untitled keep"
        placeholderTextColor={colors.textSecondary}
        returnKeyType="done"
        onSubmitEditing={handleContinue}
      />

      <Text style={styles.eyebrow}>Privacy</Text>
      <View style={styles.privacyRow}>
        {PRIVACY_OPTIONS.map((option) => {
          const isActive = option.value === privacyMode;
          return (
            <Pressable
              key={option.value}
              style={[styles.privacyCard, isActive && styles.privacyCardActive]}
              onPress={() => setPrivacyMode(option.value)}
            >
              <Ionicons name={option.icon} size={20} color={isActive ? colors.accent : colors.textPrimary} />
              <Text style={[styles.privacyLabel, isActive && styles.privacyLabelActive]}>{option.label}</Text>
              <Text style={styles.privacyDescription}>{option.description}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.switchRow}>
        <View>
          <Text style={styles.label}>Show on profile</Text>
          <Text style={styles.switchRowHint}>
            {isHiddenFromProfile ? "Hidden from your profile grid" : "Appears in your keeps grid"}
          </Text>
        </View>
        <Switch
          value={!isHiddenFromProfile}
          onValueChange={(value) => setIsHiddenFromProfile(!value)}
          trackColor={{ false: colors.border, true: colors.textPrimary }}
          thumbColor={colors.background}
          ios_backgroundColor={colors.border}
        />
      </View>

      <Button label="Continue" onPress={handleContinue} disabled={!title.trim()} />
    </KeyboardAvoidingScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
  },
  headerCancel: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
  },
  titleInput: {
    fontFamily: typography.family.serif,
    fontSize: typography.size.xl,
    color: colors.textPrimary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  eyebrow: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: typography.letterSpacing.wide,
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  privacyRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  privacyCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  privacyCardActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentMuted,
  },
  privacyLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
    marginTop: spacing.sm,
    marginBottom: 2,
  },
  privacyLabelActive: {
    color: colors.accent,
  },
  privacyDescription: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
  },
  switchRowHint: {
    color: colors.textSecondary,
    fontSize: typography.size.sm,
    marginTop: spacing.xs / 2,
    maxWidth: 260,
  },
});
