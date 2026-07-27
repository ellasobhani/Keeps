import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useQueryClient } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AppStackParamList } from "../navigation/AppNavigator";
import { useAuth } from "../lib/AuthProvider";
import { createKeep, updateKeepCoverPhoto } from "../lib/queries";
import { uploadKeepCoverPhoto } from "../lib/storage";
import { computeBlurhash } from "../lib/blurhash";
import { getErrorMessage } from "../lib/errors";
import Button from "../components/Button";
import CoverPhotoPicker from "../components/CoverPhotoPicker";
import KeyboardAvoidingScreen from "../components/KeyboardAvoidingScreen";
import { colors, spacing, radii, typography } from "../theme/tokens";
import type { PrivacyMode } from "../types/database";

type Props = NativeStackScreenProps<AppStackParamList, "CreateKeep">;

export default function CreateKeep({ navigation }: Props) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [privacyMode, setPrivacyMode] = useState<PrivacyMode>("private");
  const [coverUri, setCoverUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickCoverPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("Photo library access is needed to pick a cover photo.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setCoverUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!session || !title.trim()) return;
    setError(null);
    setIsSaving(true);
    try {
      const keep = await createKeep({
        ownerId: session.user.id,
        title: title.trim(),
        privacyMode,
      });
      if (coverUri) {
        const [path, blurhash] = await Promise.all([
          uploadKeepCoverPhoto(keep.id, coverUri),
          computeBlurhash(coverUri),
        ]);
        await updateKeepCoverPhoto(keep.id, path, blurhash);
      }
      await queryClient.invalidateQueries({ queryKey: ["keeps", session.user.id] });
      navigation.goBack();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingScreen contentContainerStyle={styles.content}>
      <Text style={styles.label}>Title</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="Spring Break 2026"
        placeholderTextColor={colors.textSecondary}
        returnKeyType="done"
        onSubmitEditing={handleSubmit}
      />

      <Text style={styles.label}>Cover photo</Text>
      <CoverPhotoPicker uri={coverUri} onPress={pickCoverPhoto} />

      <Text style={styles.label}>Privacy</Text>
      <View style={styles.toggleRow}>
        <Pressable
          style={[styles.toggleOption, privacyMode === "private" && styles.toggleOptionActive]}
          onPress={() => setPrivacyMode("private")}
        >
          <Text style={[styles.toggleText, privacyMode === "private" && styles.toggleTextActive]}>
            Private
          </Text>
        </Pressable>
        <Pressable
          style={[styles.toggleOption, privacyMode === "public" && styles.toggleOptionActive]}
          onPress={() => setPrivacyMode("public")}
        >
          <Text style={[styles.toggleText, privacyMode === "public" && styles.toggleTextActive]}>
            Public
          </Text>
        </Pressable>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <Button label="Create keep" onPress={handleSubmit} disabled={!title.trim()} loading={isSaving} />
    </KeyboardAvoidingScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
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
    borderRadius: radii.xs,
    padding: spacing.md,
    fontSize: typography.size.md,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  toggleRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  toggleOption: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xs,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  toggleOptionActive: {
    backgroundColor: colors.accentMuted,
    borderColor: colors.accent,
  },
  toggleText: {
    color: colors.textSecondary,
    fontSize: typography.size.md,
    fontWeight: typography.weight.medium,
  },
  toggleTextActive: {
    color: colors.accent,
  },
  error: {
    color: colors.danger,
    marginBottom: spacing.md,
  },
});
