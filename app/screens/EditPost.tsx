import { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, Switch, ActivityIndicator, Alert, Dimensions, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { File, Paths } from "expo-file-system";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AppStackParamList } from "../navigation/AppNavigator";
import {
  fetchPostById,
  updatePost,
  deletePost,
  reorderPostMedia,
  updatePostMediaUrl,
  deletePostMedia,
} from "../lib/queries";
import { getSignedMediaUrl } from "../lib/storage";
import { uploadPostMedia } from "../lib/storage";
import { computeBlurhash } from "../lib/blurhash";
import { SIGNED_URL_QUERY_OPTIONS, signedMediaUrlKey, postsForKeepKey } from "../lib/signedUrlCache";
import { getErrorMessage } from "../lib/errors";
import Button from "../components/Button";
import SortableGrid from "../components/SortableGrid";
import PhotoEditor from "../components/PhotoEditor";
import KeyboardAvoidingScreen from "../components/KeyboardAvoidingScreen";
import { colors, spacing, radii, typography } from "../theme/tokens";
import type { PostMedia } from "../types/database";

type Props = NativeStackScreenProps<AppStackParamList, "EditPost">;

const GRID_COLUMNS = 3;
const GRID_GAP = spacing.xs;
const GRID_TILE_SIZE = (Dimensions.get("window").width - spacing.lg * 2 - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS;

function MediaThumb({ media }: { media: PostMedia }) {
  const { data: url } = useQuery({
    queryKey: signedMediaUrlKey(media.media_url),
    queryFn: () => getSignedMediaUrl(media.media_url),
    ...SIGNED_URL_QUERY_OPTIONS,
  });

  return (
    <Image
      source={url ? { uri: url, cacheKey: media.media_url } : undefined}
      style={styles.gridImage}
      cachePolicy="memory-disk"
      transition={150}
      placeholder={media.blurhash ? { blurhash: media.blurhash } : undefined}
      placeholderContentFit="cover"
    />
  );
}

export default function EditPost({ route, navigation }: Props) {
  const { postId } = route.params;
  const queryClient = useQueryClient();

  const { data: post, isLoading } = useQuery({
    queryKey: ["post", postId],
    queryFn: () => fetchPostById(postId),
  });

  const [caption, setCaption] = useState("");
  const [songTitle, setSongTitle] = useState("");
  const [songArtist, setSongArtist] = useState("");
  const [songUrl, setSongUrl] = useState("");
  const [locationLabel, setLocationLabel] = useState("");
  const [isSongOpen, setIsSongOpen] = useState(false);
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [showInFeed, setShowInFeed] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [mediaOrder, setMediaOrder] = useState<PostMedia[]>([]);
  const [preparingMediaId, setPreparingMediaId] = useState<string | null>(null);
  const [editingMedia, setEditingMedia] = useState<PostMedia | null>(null);
  const [editingLocalUri, setEditingLocalUri] = useState<string | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [mediaEdited, setMediaEdited] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    if (!post || isHydrated) return;
    setCaption(post.caption ?? "");
    setSongTitle(post.song_title ?? "");
    setSongArtist(post.song_artist ?? "");
    setSongUrl(post.song_url ?? "");
    setLocationLabel(post.location_label ?? "");
    setIsSongOpen(!!post.song_title);
    setIsLocationOpen(!!post.location_label);
    setShowInFeed(post.show_in_feed);
    setMediaOrder([...post.post_media].sort((a, b) => a.position - b.position));
    setIsHydrated(true);
  }, [post, isHydrated]);

  const clearSong = () => {
    setSongTitle("");
    setSongArtist("");
    setSongUrl("");
    setIsSongOpen(false);
  };

  const clearLocation = () => {
    setLocationLabel("");
    setIsLocationOpen(false);
  };

  const handleEditPress = async (media: PostMedia) => {
    if (media.media_type !== "image" || preparingMediaId) return;
    setEditError(null);
    setPreparingMediaId(media.id);
    try {
      const signedUrl = await queryClient.fetchQuery({
        queryKey: signedMediaUrlKey(media.media_url),
        queryFn: () => getSignedMediaUrl(media.media_url),
        ...SIGNED_URL_QUERY_OPTIONS,
      });
      const file = await File.downloadFileAsync(signedUrl, Paths.cache);
      setEditingMedia(media);
      setEditingLocalUri(file.uri);
    } catch (e) {
      setEditError(getErrorMessage(e));
    } finally {
      setPreparingMediaId(null);
    }
  };

  const handleEditCancel = () => {
    setEditingMedia(null);
    setEditingLocalUri(null);
  };

  // Local-only, like reorder — actually deleting the row is deferred to
  // "Save changes" (handleSubmit diffs mediaOrder against the original) so
  // backing out of the screen without saving leaves the post untouched.
  const handleDeleteMedia = (media: PostMedia) => {
    if (mediaOrder.length <= 1) {
      Alert.alert("Can't remove this photo", "A post needs at least one photo.");
      return;
    }
    Alert.alert("Remove this photo?", "It'll be removed once you save changes.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => setMediaOrder((prev) => prev.filter((m) => m.id !== media.id)),
      },
    ]);
  };

  // Applies immediately (unlike caption/reorder, which wait for "Save
  // changes") — re-uploading is already its own committed write, and
  // deferring it would mean juggling a second pending-edits map just to
  // undo it on cancel.
  const handleEditSave = async (newLocalUri: string) => {
    const media = editingMedia;
    setEditingMedia(null);
    setEditingLocalUri(null);
    if (!media || !post) return;
    setIsSavingEdit(true);
    try {
      const [path, blurhash] = await Promise.all([
        uploadPostMedia(post.keep_id, postId, newLocalUri, media.position),
        computeBlurhash(newLocalUri),
      ]);
      await updatePostMediaUrl(media.id, path, blurhash);
      setMediaOrder((prev) => prev.map((m) => (m.id === media.id ? { ...m, media_url: path, blurhash } : m)));
      setMediaEdited(true);
    } catch (e) {
      setEditError(getErrorMessage(e));
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleSubmit = async () => {
    if (!post) return;
    setError(null);
    setIsSaving(true);
    try {
      await updatePost(postId, {
        caption: caption.trim() || null,
        songTitle: songTitle.trim() || null,
        songArtist: songArtist.trim() || null,
        songUrl: songUrl.trim() || null,
        locationLabel: locationLabel.trim() || null,
        showInFeed,
      });
      const originalOrder = [...post.post_media].sort((a, b) => a.position - b.position).map((m) => m.id);
      const newOrder = mediaOrder.map((m) => m.id);
      const removedIds = originalOrder.filter((id) => !newOrder.includes(id));
      const orderChanged = newOrder.length !== originalOrder.length || newOrder.some((id, index) => id !== originalOrder[index]);

      for (const id of removedIds) {
        await deletePostMedia(id);
      }
      // Deleting leaves gaps in `position` (e.g. 0, 2 after removing index
      // 1) — reorder whenever anything changed, not just a pure drag, so
      // the remaining rows stay contiguously numbered.
      if (orderChanged) {
        await reorderPostMedia(newOrder);
      }
      await queryClient.invalidateQueries({ queryKey: ["post", postId] });
      if (orderChanged || mediaEdited) {
        await queryClient.invalidateQueries({ queryKey: postsForKeepKey(post.keep_id) });
      }
      navigation.goBack();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!post) return;
    Alert.alert("Delete post?", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setIsDeleting(true);
          try {
            await deletePost(postId);
            await queryClient.invalidateQueries({ queryKey: ["posts", post.keep_id] });
            navigation.pop(2);
          } catch (e) {
            setError(getErrorMessage(e));
            setIsDeleting(false);
          }
        },
      },
    ]);
  };

  if (isLoading || !post) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const gridRows = Math.ceil(mediaOrder.length / GRID_COLUMNS);
  const gridWidth = GRID_COLUMNS * GRID_TILE_SIZE + (GRID_COLUMNS - 1) * GRID_GAP;
  const gridHeight = gridRows > 0 ? gridRows * GRID_TILE_SIZE + (gridRows - 1) * GRID_GAP : 0;

  return (
    <KeyboardAvoidingScreen contentContainerStyle={styles.content}>
        {mediaOrder.length > 0 && (
          <>
            <Text style={styles.label}>
              {mediaOrder.length > 1 ? "Photos — hold and drag to reorder" : "Photo"}
            </Text>
            <View style={[styles.gridWrap, { width: gridWidth, height: gridHeight }]}>
              <SortableGrid
                data={mediaOrder}
                keyExtractor={(media) => media.id}
                numColumns={GRID_COLUMNS}
                itemSize={GRID_TILE_SIZE}
                gap={GRID_GAP}
                onDragEnd={setMediaOrder}
                renderItem={(media) => <MediaThumb media={media} />}
                renderOverlay={(media) => (
                  <>
                    {media.media_type === "image" && (
                      <Pressable
                        style={styles.editBadge}
                        onPress={() => handleEditPress(media)}
                        hitSlop={8}
                      >
                        {preparingMediaId === media.id ? (
                          <ActivityIndicator size="small" color={colors.textInverse} />
                        ) : (
                          <Ionicons name="crop-outline" size={14} color={colors.textInverse} />
                        )}
                      </Pressable>
                    )}
                    <Pressable style={styles.trashBadge} onPress={() => handleDeleteMedia(media)} hitSlop={8}>
                      <Ionicons name="trash-outline" size={14} color={colors.textInverse} />
                    </Pressable>
                  </>
                )}
              />
            </View>
            {isSavingEdit && <Text style={styles.savingHint}>Saving photo edit...</Text>}
            {editError && <Text style={styles.error}>{editError}</Text>}
          </>
        )}

        <Text style={styles.label}>Caption</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={caption}
          onChangeText={setCaption}
          placeholder="Write a caption..."
          placeholderTextColor={colors.textSecondary}
          multiline
        />

        {!isSongOpen ? (
          <Pressable style={styles.addonRow} onPress={() => setIsSongOpen(true)}>
            <Text style={styles.addonRowText}>Add song</Text>
          </Pressable>
        ) : (
          <View style={styles.addonSection}>
            <View style={styles.addonHeader}>
              <Text style={styles.addonTitle}>Song</Text>
              <Pressable onPress={clearSong} hitSlop={8}>
                <Ionicons name="trash-outline" size={16} color={colors.danger} />
              </Pressable>
            </View>
            <TextInput
              style={styles.input}
              value={songTitle}
              onChangeText={setSongTitle}
              placeholder="Song title"
              placeholderTextColor={colors.textSecondary}
            />
            <TextInput
              style={styles.input}
              value={songArtist}
              onChangeText={setSongArtist}
              placeholder="Artist"
              placeholderTextColor={colors.textSecondary}
            />
            <TextInput
              style={styles.input}
              value={songUrl}
              onChangeText={setSongUrl}
              placeholder="Link (Spotify, Apple Music...)"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>
        )}

        {!isLocationOpen ? (
          <Pressable style={styles.addonRow} onPress={() => setIsLocationOpen(true)}>
            <Text style={styles.addonRowText}>Add location</Text>
          </Pressable>
        ) : (
          <View style={styles.addonSection}>
            <View style={styles.addonHeader}>
              <Text style={styles.addonTitle}>Location</Text>
              <Pressable onPress={clearLocation} hitSlop={8}>
                <Ionicons name="trash-outline" size={16} color={colors.danger} />
              </Pressable>
            </View>
            <TextInput
              style={styles.input}
              value={locationLabel}
              onChangeText={setLocationLabel}
              placeholder="Where was this?"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        )}

        <View style={styles.switchRow}>
          <View>
            <Text style={styles.addonTitle}>Show in feed</Text>
            <Text style={styles.switchRowHint}>
              {showInFeed ? "Visible in followers' feeds" : "Only visible on this keep's page"}
            </Text>
          </View>
          <Switch
            value={showInFeed}
            onValueChange={setShowInFeed}
            trackColor={{ false: colors.border, true: colors.textPrimary }}
            thumbColor={colors.background}
            ios_backgroundColor={colors.border}
          />
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <Button label="Save changes" onPress={handleSubmit} loading={isSaving} disabled={isDeleting} />
        <Button
          label="Move to another keep"
          variant="secondary"
          onPress={() => navigation.navigate("MoveToKeep", { postId })}
          disabled={isSaving || isDeleting}
          style={styles.moveButton}
        />
        <Button
          label="Delete post"
          variant="danger"
          onPress={handleDelete}
          loading={isDeleting}
          disabled={isSaving}
          style={styles.deleteButton}
        />

        <PhotoEditor
          visible={editingLocalUri !== null}
          uri={editingLocalUri}
          onCancel={handleEditCancel}
          onSave={handleEditSave}
        />
    </KeyboardAvoidingScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
  },
  gridWrap: {
    position: "relative",
    marginBottom: spacing.md,
  },
  gridImage: {
    width: "100%",
    height: "100%",
    backgroundColor: colors.surface,
  },
  editBadge: {
    position: "absolute",
    top: spacing.xs,
    left: spacing.xs,
    width: 24,
    height: 24,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  trashBadge: {
    position: "absolute",
    top: spacing.xs,
    right: spacing.xs,
    width: 24,
    height: 24,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  savingHint: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
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
  multiline: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  addonRow: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xs,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  addonRowText: {
    color: colors.textSecondary,
    fontSize: typography.size.md,
    fontWeight: typography.weight.medium,
  },
  addonSection: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xs,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  addonHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  addonTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    marginBottom: spacing.md,
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
  moveButton: {
    marginTop: spacing.sm,
  },
  deleteButton: {
    marginTop: spacing.sm,
  },
});
