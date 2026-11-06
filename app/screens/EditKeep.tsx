import { useEffect, useRef, useState } from "react";
import { View, Text, TextInput, Pressable, Switch, Alert, StyleSheet, ActivityIndicator } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AppStackParamList } from "../navigation/AppNavigator";
import { useAuth } from "../lib/AuthProvider";
import { fetchKeepById, fetchKeepMembership, updateKeep, updateKeepCoverPhoto, deleteKeep } from "../lib/queries";
import { uploadKeepCoverPhoto, getSignedMediaUrl } from "../lib/storage";
import { computeBlurhash } from "../lib/blurhash";
import { SIGNED_URL_QUERY_OPTIONS, signedMediaUrlKey } from "../lib/signedUrlCache";
import { getErrorMessage } from "../lib/errors";
import { PRIVACY_OPTIONS } from "../lib/keepPrivacyOptions";
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
  const [isDeleting, setIsDeleting] = useState(false);
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

  const handleDelete = () => {
    Alert.alert(
      "Delete keep?",
      "This permanently deletes the keep and everything in it — photos, posts, comments. This can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (!session) return;
            setIsDeleting(true);
            try {
              await deleteKeep(keepId);
              await queryClient.invalidateQueries({ queryKey: ["keeps", session.user.id] });
              await queryClient.invalidateQueries({ queryKey: ["profileKeeps", session.user.id] });
              navigation.pop(2);
            } catch (e) {
              setError(getErrorMessage(e));
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  // handleSubmit closes over title/privacyMode/coverUri/etc., so it's a
  // fresh function every render — putting it directly in the effect below's
  // deps re-runs navigation.setOptions, and hands native-stack a brand new
  // headerLeft/headerRight, on every render (including ones that have
  // nothing to do with the header, e.g. picking a cover photo). Rebuilding
  // the native header that rapidly is known to corrupt the header bar and
  // swipe-back gesture (see EditPost.tsx's identical fix). Routing the tap
  // through a ref keeps handleSubmit itself out of the deps array — Save
  // still always calls the latest version — while `title` stays a direct
  // dep since the header's disabled styling needs to react to it.
  const handleSubmitRef = useRef(handleSubmit);
  handleSubmitRef.current = handleSubmit;

  useEffect(() => {
    const canSave = !!title.trim();
    navigation.setOptions({
      headerTitleStyle: { fontFamily: typography.family.serif, fontSize: typography.size.lg, color: colors.textPrimary },
      headerLeft: () => (
        <Pressable onPress={() => navigation.goBack()} disabled={isSaving || isDeleting} hitSlop={8}>
          <Text style={styles.headerCancel}>Cancel</Text>
        </Pressable>
      ),
      headerRight: () => (
        <Pressable onPress={() => handleSubmitRef.current()} disabled={isSaving || isDeleting || !canSave} hitSlop={8}>
          {isSaving ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : (
            <Text style={[styles.headerSave, (isDeleting || !canSave) && styles.headerSaveDisabled]}>Save</Text>
          )}
        </Pressable>
      ),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation, isSaving, isDeleting, title]);

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
      <CoverPhotoPicker uri={coverPreview} cacheKey={coverPreviewCacheKey} onPress={pickCoverPhoto} />

      <TextInput
        style={styles.titleInput}
        value={title}
        onChangeText={setTitle}
        placeholder="Untitled keep"
        placeholderTextColor={colors.textSecondary}
        returnKeyType="done"
        onSubmitEditing={handleSubmit}
      />

      <View style={styles.divider} />

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

      <View style={styles.divider} />

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

      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.divider} />

      <Pressable
        style={styles.listRow}
        onPress={() => navigation.navigate("ManageCoOwners", { keepId })}
        disabled={isSaving || isDeleting}
      >
        <Text style={styles.listRowText}>Manage collaborators</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
      </Pressable>

      <Pressable style={styles.listRow} onPress={handleDelete} disabled={isSaving || isDeleting}>
        <Text style={[styles.listRowText, styles.deleteText]}>Delete keep</Text>
        {isDeleting ? (
          <ActivityIndicator size="small" color={colors.danger} />
        ) : (
          <Ionicons name="trash-outline" size={18} color={colors.danger} />
        )}
      </Pressable>
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
  headerCancel: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
  },
  headerSave: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.accent,
  },
  headerSaveDisabled: {
    opacity: 0.4,
  },
  titleInput: {
    fontFamily: typography.family.serif,
    fontSize: typography.size.xl,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
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
  },
  switchRowHint: {
    color: colors.textSecondary,
    fontSize: typography.size.sm,
    marginTop: spacing.xs / 2,
    maxWidth: 260,
  },
  error: {
    color: colors.danger,
    marginTop: spacing.md,
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
  },
  listRowText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.medium,
    color: colors.textPrimary,
  },
  deleteText: {
    color: colors.danger,
  },
});
