import { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
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
import { colors, spacing, typography } from "../theme/tokens";

type Props = NativeStackScreenProps<AppStackParamList, "CreateKeepCover">;

export default function CreateKeepCover({ route, navigation }: Props) {
  const { title, privacyMode, hiddenFromProfile } = route.params;
  const { session } = useAuth();
  const queryClient = useQueryClient();

  const [coverUri, setCoverUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <Pressable onPress={() => navigation.goBack()} disabled={isSaving} hitSlop={8}>
          <Text style={styles.headerBack}>Back</Text>
        </Pressable>
      ),
    });
  }, [navigation, isSaving]);

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
      setError(null);
      setCoverUri(result.assets[0].uri);
    }
  };

  // Auto-open the picker the moment this screen appears — same as AddPost's
  // media step, so landing here drops you straight into the camera roll
  // instead of a placeholder tile you have to tap first.
  useEffect(() => {
    pickCoverPhoto();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async () => {
    if (!session) return;
    setError(null);
    setIsSaving(true);
    try {
      const keep = await createKeep({ ownerId: session.user.id, title, privacyMode, hiddenFromProfile });
      if (coverUri) {
        const [path, blurhash] = await Promise.all([
          uploadKeepCoverPhoto(keep.id, coverUri),
          computeBlurhash(coverUri),
        ]);
        await updateKeepCoverPhoto(keep.id, path, blurhash);
      }
      await queryClient.invalidateQueries({ queryKey: ["keeps", session.user.id] });
      navigation.pop(2);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Add a cover</Text>
      <Text style={styles.hint}>Choose a photo from your camera roll.</Text>

      <CoverPhotoPicker uri={coverUri} onPress={pickCoverPhoto} />

      {error && <Text style={styles.error}>{error}</Text>}

      <Button label="Create keep" onPress={handleCreate} loading={isSaving} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  headerBack: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
  },
  heading: {
    fontFamily: typography.family.serif,
    fontSize: typography.size.xl,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  hint: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  error: {
    color: colors.danger,
    marginBottom: spacing.md,
  },
});
