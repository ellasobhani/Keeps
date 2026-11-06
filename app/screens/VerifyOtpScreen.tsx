import { useState } from "react";
import { Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../navigation/AppNavigator";
import { useAuth } from "../lib/AuthProvider";
import { getErrorMessage } from "../lib/errors";
import KeyboardAvoidingScreen from "../components/KeyboardAvoidingScreen";
import { colors, spacing, radii, typography } from "../theme/tokens";

type Props = NativeStackScreenProps<AuthStackParamList, "VerifyOtp">;

export default function VerifyOtpScreen({ route }: Props) {
  const { email } = route.params;
  const { verifyOtp } = useAuth();
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    setError(null);
    setIsVerifying(true);
    try {
      await verifyOtp(email, code.trim());
      // On success, AuthProvider's session updates and AppNavigator swaps
      // to the main stack automatically — nothing to navigate to here.
    } catch (e) {
      setError(getErrorMessage(e, "Invalid code, try again."));
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <KeyboardAvoidingScreen contentContainerStyle={styles.content}>
      <Text style={styles.title}>Check your email</Text>
      <Text style={styles.subtitle}>Enter the code we sent to {email}.</Text>
      <TextInput
        style={styles.input}
        value={code}
        onChangeText={setCode}
        placeholder="123456"
        placeholderTextColor={colors.textSecondary}
        keyboardType="number-pad"
        autoFocus
      />
      {error && <Text style={styles.error}>{error}</Text>}
      <Pressable
        style={[styles.button, (!code || isVerifying) && styles.buttonDisabled]}
        onPress={handleVerify}
        disabled={!code || isVerifying}
      >
        {isVerifying ? (
          <ActivityIndicator color={colors.textInverse} />
        ) : (
          <Text style={styles.buttonText}>Verify</Text>
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
    letterSpacing: typography.letterSpacing.otp,
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
    opacity: 0.4,
  },
  buttonText: {
    color: colors.textInverse,
    fontSize: typography.size.md,
    fontWeight: typography.weight.medium,
  },
});
