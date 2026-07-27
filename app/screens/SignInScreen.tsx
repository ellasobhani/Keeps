import { useState } from "react";
import { Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../navigation/AppNavigator";
import { useAuth } from "../lib/AuthProvider";
import { getErrorMessage } from "../lib/errors";
import KeyboardAvoidingScreen from "../components/KeyboardAvoidingScreen";
import { colors, spacing, radii, typography } from "../theme/tokens";

type Props = NativeStackScreenProps<AuthStackParamList, "SignIn">;

export default function SignInScreen({ navigation }: Props) {
  const { signInWithOtp } = useAuth();
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendCode = async () => {
    setError(null);
    setIsSending(true);
    try {
      await signInWithOtp(email.trim());
      navigation.navigate("VerifyOtp", { email: email.trim() });
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <KeyboardAvoidingScreen contentContainerStyle={styles.content}>
      <Text style={styles.title}>Keeps</Text>
      <Text style={styles.subtitle}>Enter your email and we'll send you a sign-in code.</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        placeholderTextColor={colors.textSecondary}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
      />
      {error && <Text style={styles.error}>{error}</Text>}
      <Pressable
        style={[styles.button, (!email || isSending) && styles.buttonDisabled]}
        onPress={handleSendCode}
        disabled={!email || isSending}
      >
        {isSending ? (
          <ActivityIndicator color={colors.textInverse} />
        ) : (
          <Text style={styles.buttonText}>Send code</Text>
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
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    fontSize: typography.size.md,
    color: colors.textPrimary,
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
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: colors.textInverse,
    fontSize: typography.size.md,
    fontWeight: typography.weight.medium,
  },
});
