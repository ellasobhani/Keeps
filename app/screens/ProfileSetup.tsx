import { useState } from "react";
import { Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../lib/AuthProvider";
import { createProfile } from "../lib/queries";
import { getErrorMessage } from "../lib/errors";
import KeyboardAvoidingScreen from "../components/KeyboardAvoidingScreen";
import { colors, spacing, radii, typography } from "../theme/tokens";

const HANDLE_PATTERN = /^[a-z0-9_]{3,20}$/;

export default function ProfileSetup() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [handle, setHandle] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizedHandle = handle.trim().toLowerCase();
  const isHandleValid = HANDLE_PATTERN.test(normalizedHandle);
  const isValid = isHandleValid && displayName.trim().length > 0;

  const handleSubmit = async () => {
    if (!session || !isValid) return;
    setError(null);
    setIsSaving(true);
    try {
      await createProfile({
        id: session.user.id,
        handle: normalizedHandle,
        displayName: displayName.trim(),
      });
      await queryClient.invalidateQueries({ queryKey: ["profile", session.user.id] });
    } catch (e) {
      const message = getErrorMessage(e);
      setError(message.includes("duplicate key") ? "That handle is already taken." : message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingScreen contentContainerStyle={styles.content}>
      <Text style={styles.title}>Set up your profile</Text>
      <Text style={styles.subtitle}>Pick a handle and a display name — you can change these later.</Text>
      <Text style={styles.label}>Handle</Text>
      <TextInput
        style={styles.input}
        value={handle}
        onChangeText={setHandle}
        placeholder="lowercase, numbers, underscores"
        placeholderTextColor={colors.textSecondary}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {handle.length > 0 && !isHandleValid && (
        <Text style={styles.hint}>3-20 characters: lowercase letters, numbers, and underscores only.</Text>
      )}
      <Text style={styles.label}>Display name</Text>
      <TextInput
        style={styles.input}
        value={displayName}
        onChangeText={setDisplayName}
        placeholder="Your name"
        placeholderTextColor={colors.textSecondary}
      />
      {error && <Text style={styles.error}>{error}</Text>}
      <Pressable
        style={[styles.button, (!isValid || isSaving) && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={!isValid || isSaving}
      >
        {isSaving ? (
          <ActivityIndicator color={colors.textInverse} />
        ) : (
          <Text style={styles.buttonText}>Continue</Text>
        )}
      </Pressable>
    </KeyboardAvoidingScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    padding: spacing.lg,
    justifyContent: "center",
  },
  title: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.size.md,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    fontSize: typography.size.md,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  hint: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
  },
  error: {
    color: colors.danger,
    marginBottom: spacing.md,
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    padding: spacing.md,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    color: colors.textInverse,
    fontSize: typography.size.md,
    fontWeight: typography.weight.medium,
  },
});
