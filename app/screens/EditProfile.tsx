import { useState } from "react";
import { View, Text, TextInput, Pressable, Alert, StyleSheet } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useQueryClient } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AppStackParamList } from "../navigation/AppNavigator";
import { useAuth } from "../lib/AuthProvider";
import { updateProfile, deleteOwnAccount } from "../lib/queries";
import { uploadAvatarPhoto, getAvatarUrl } from "../lib/storage";
import { getErrorMessage } from "../lib/errors";
import Avatar from "../components/Avatar";
import Button from "../components/Button";
import KeyboardAvoidingScreen from "../components/KeyboardAvoidingScreen";
import { colors, spacing, radii, typography } from "../theme/tokens";

const HANDLE_PATTERN = /^[a-z0-9_]{3,20}$/;

type Props = NativeStackScreenProps<AppStackParamList, "EditProfile">;

export default function EditProfile({ navigation }: Props) {
  const { session, profile, signOut } = useAuth();
  const queryClient = useQueryClient();

  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [handle, setHandle] = useState(profile?.handle ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("Photo library access is needed to pick a photo.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const normalizedHandle = handle.trim().toLowerCase();
  const isHandleValid = HANDLE_PATTERN.test(normalizedHandle);

  const handleSubmit = async () => {
    if (!session || !displayName.trim() || !isHandleValid) return;
    setError(null);
    setIsSaving(true);
    try {
      let avatarUrl: string | undefined;
      if (avatarUri) {
        avatarUrl = await uploadAvatarPhoto(session.user.id, avatarUri);
      }
      await updateProfile(session.user.id, {
        displayName: displayName.trim(),
        handle: normalizedHandle,
        bio: bio.trim() || null,
        avatarUrl,
      });
      await queryClient.invalidateQueries({ queryKey: ["profile", session.user.id] });
      navigation.goBack();
    } catch (e) {
      const message = getErrorMessage(e);
      setError(message.includes("duplicate key") ? "That handle is already taken." : message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = () => {
    if (!session) return;
    Alert.alert(
      "Delete account?",
      "This permanently deletes your keeps, posts, comments, likes, and profile. This can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete everything",
          style: "destructive",
          onPress: async () => {
            setIsDeletingAccount(true);
            try {
              await deleteOwnAccount(session.user.id);
              await signOut();
            } catch (e) {
              setError(getErrorMessage(e));
              setIsDeletingAccount(false);
            }
          },
        },
      ]
    );
  };

  const avatarPreviewUrl = avatarUri ?? (profile?.avatar_url ? getAvatarUrl(profile.avatar_url) : null);

  return (
    <KeyboardAvoidingScreen contentContainerStyle={styles.content}>
        <Pressable style={styles.avatarPicker} onPress={pickAvatar}>
          <Avatar uri={avatarPreviewUrl} displayName={displayName} size={96} />
          <Text style={styles.avatarPickerText}>Change photo</Text>
        </Pressable>

        <Text style={styles.label}>Display name</Text>
        <TextInput
          style={styles.input}
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Your name"
          placeholderTextColor={colors.textSecondary}
          returnKeyType="done"
        />

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

        <Text style={styles.label}>Bio</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={bio}
          onChangeText={setBio}
          placeholder="Add a bio..."
          placeholderTextColor={colors.textSecondary}
          multiline
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <Button
          label="Save changes"
          onPress={handleSubmit}
          disabled={!displayName.trim() || !isHandleValid || isDeletingAccount}
          loading={isSaving}
        />
        <Button
          label="Delete account"
          variant="danger"
          onPress={handleDeleteAccount}
          disabled={isSaving}
          loading={isDeletingAccount}
          style={styles.deleteButton}
        />
    </KeyboardAvoidingScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
  },
  deleteButton: {
    marginTop: spacing.sm,
  },
  avatarPicker: {
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  avatarPickerText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.accent,
    marginTop: spacing.sm,
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
  multiline: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  error: {
    color: colors.danger,
    marginBottom: spacing.md,
  },
});
