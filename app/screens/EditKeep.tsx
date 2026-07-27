import { useEffect, useState } from "react";
import { View, Text, TextInput, Switch, StyleSheet, ActivityIndicator } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AppStackParamList } from "../navigation/AppNavigator";
import { useAuth } from "../lib/AuthProvider";
import { fetchKeepById, fetchKeepMembership, updateKeep, updateKeepCoverPhoto } from "../lib/queries";
import { uploadKeepCoverPhoto, getSignedMediaUrl } from "../lib/storage";
import { computeBlurhash } from "../lib/blurhash";
import { SIGNED_URL_QUERY_OPTIONS, signedMediaUrlKey } from "../lib/signedUrlCache";
import { getErrorMessage } from "../lib/errors";
import Button from "../components/Button";
import CoverPhotoPicker from "../components/CoverPhotoPicker";
import KeyboardAvoidingScreen from "../components/KeyboardAvoidingScreen";
import { colors, spacing, radii, typography } from "../theme/tokens";
import type { PrivacyMode } from "../types/database";

type Props = NativeStackScreenProps<AppStackParamList, "EditKeep">;

export default function EditKeep({ route, navigation }: Props) {
  const { keepId } = route.params;
  const { session } = useAuth();
  const queryClient = useQueryClient();

  const { data: keep, isLoading } = useQuery({
    queryKey: ["keep", keepId],
    queryFn: () => fetchKeepById(keepId),
  });

  const { data: membership, isLoading: isMembershipLoading } = useQuery({
    queryKey: ["keepMembership", keepId, session?.user.id],
    queryFn: () => fetchKeepMembership(keepId, session!.user.id),
    enabled: !!session,
  });

  const [title, setTitle] = useState("");
  const [privacyMode, setPrivacyMode] = useState<PrivacyMode>("private");
  const [isHiddenFromProfile, setIsHiddenFromProfile] = useState(false);
  const [coverUri, setCoverUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    if (!keep || !membership || isHydrated) return;
    setTitle(keep.title);
    setPrivacyMode(keep.privacy_mode);
    setIsHiddenFromProfile(membership.hidden_from_profile);
    setIsHydrated(true);
  }, [keep, membership, isHydrated]);

  const { data: existingCoverUrl } = useQuery({
    queryKey: signedMediaUrlKey(keep?.cover_photo_url ?? ""),
    queryFn: () => getSignedMediaUrl(keep!.cover_photo_url!),
    enabled: !!keep?.cover_photo_url,
    ...SIGNED_URL_QUERY_OPTIONS,
  });

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
      await updateKeep(keepId, session.user.id, {
        title: title.trim(),
        privacyMode,
        hiddenFromProfile: isHiddenFromProfile,
      });
      if (coverUri) {
        const [path, blurhash] = await Promise.all([
          uploadKeepCoverPhoto(keepId, coverUri),
          computeBlurhash(coverUri),
        ]);
        await updateKeepCoverPhoto(keepId, path, blurhash);
      }
      await queryClient.invalidateQueries({ queryKey: ["keep", keepId] });
      await queryClient.invalidateQueries({ queryKey: ["keeps", session.user.id] });
      await queryClient.invalidateQueries({ queryKey: ["profileKeeps", session.user.id] });
      navigation.goBack();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || isMembershipLoading || !keep || !membership) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const coverPreview = coverUri ?? existingCoverUrl ?? null;
  const coverPreviewCacheKey = coverUri ? undefined : keep.cover_photo_url ?? undefined;

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
      <CoverPhotoPicker uri={coverPreview} cacheKey={coverPreviewCacheKey} onPress={pickCoverPhoto} />

      <View style={styles.switchRow}>
        <View>
          <Text style={styles.label}>{privacyMode === "public" ? "Public" : "Private"}</Text>
          <Text style={styles.switchRowHint}>
            {privacyMode === "public" ? "Anyone can find and follow this keep" : "Only members can access this keep"}
          </Text>
        </View>
        <Switch
          value={privacyMode === "public"}
          onValueChange={(value) => setPrivacyMode(value ? "public" : "private")}
          trackColor={{ false: colors.border, true: colors.textPrimary }}
          thumbColor={colors.background}
          ios_backgroundColor={colors.border}
        />
      </View>

      <View style={styles.switchRow}>
        <View>
          <Text style={styles.label}>Show on profile</Text>
          <Text style={styles.switchRowHint}>
            {isHiddenFromProfile ? "Hidden from your profile grid" : "Visible on your profile grid"}
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

      {error && <Text style={styles.error}>{error}</Text>}

      <Button label="Save changes" onPress={handleSubmit} disabled={!title.trim()} loading={isSaving} />
    </KeyboardAvoidingScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
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
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  switchRowHint: {
    color: colors.textSecondary,
    fontSize: typography.size.sm,
    marginTop: spacing.xs / 2,
    maxWidth: 260,
  },
  error: {
    color: colors.danger,
    marginBottom: spacing.md,
  },
});
