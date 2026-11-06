import { useEffect, useRef, useState } from "react";
import { View, Text, TextInput, Pressable, Switch, ActivityIndicator, Alert, Dimensions, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { File, Paths } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
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
  addPostMedia,
} from "../lib/queries";
import { getSignedMediaUrl } from "../lib/storage";
import { uploadPostMedia } from "../lib/storage";
import { computeBlurhash } from "../lib/blurhash";
import { SIGNED_URL_QUERY_OPTIONS, signedMediaUrlKey, postsForKeepKey } from "../lib/signedUrlCache";
import { getErrorMessage } from "../lib/errors";
import SortableGrid from "../components/SortableGrid";
import PhotoEditor from "../components/PhotoEditor";
import KeyboardAvoidingScreen from "../components/KeyboardAvoidingScreen";
import { colors, spacing, radii, typography, iconGlyphFix } from "../theme/tokens";
import type { MediaType, PostMedia } from "../types/database";

type Props = NativeStackScreenProps<AppStackParamList, "EditPost">;

const GRID_COLUMNS = 3;
const GRID_GAP = spacing.xs;
const GRID_TILE_SIZE = (Dimensions.get("window").width - spacing.lg * 2 - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS;
const MAX_ITEMS = 10;
const VIDEO_MAX_DURATION_SECONDS = 60;

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
  const [isAddingMedia, setIsAddingMedia] = useState(false);

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
      // idempotent: true — the destination filename is derived from the
      // signed URL's path, which is stable for a given media item, so
      // re-opening the editor on the same photo (after a cancel, or just a
      // second attempt) collides with the previous download's leftover
      // cache file and throws "Destination already exists" without this.
      const file = await File.downloadFileAsync(signedUrl, Paths.cache, { idempotent: true });
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

  // One "..." badge per tile replaces separate always-visible crop/trash
  // badges — drag-to-reorder is still a plain long-press on the tile itself
  // (see SortableGrid), so this only ever gates the two less-common actions.
  const handlePhotoOptions = (media: PostMedia) => {
    const actions: { text: string; style?: "destructive" | "cancel"; onPress?: () => void }[] = [];
    if (media.media_type === "image") {
      actions.push({ text: "Edit photo", onPress: () => handleEditPress(media) });
    }
    actions.push({ text: "Remove photo", style: "destructive", onPress: () => handleDeleteMedia(media) });
    actions.push({ text: "Cancel", style: "cancel" });
    Alert.alert("", "", actions);
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

  // Applies immediately, same as handleEditSave above — the upload/insert is
  // already its own committed write, so there's no local-only "pending add"
  // state to juggle or undo on cancel.
  const handleAddMedia = async () => {
    if (!post || mediaOrder.length >= MAX_ITEMS) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setEditError("Photo library access is needed to add photos or videos.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      allowsMultipleSelection: true,
      orderedSelection: true,
      selectionLimit: MAX_ITEMS - mediaOrder.length,
      quality: 0.8,
      videoMaxDuration: VIDEO_MAX_DURATION_SECONDS,
    });
    if (result.canceled || result.assets.length === 0) return;
    setEditError(null);
    setIsAddingMedia(true);
    try {
      let position = mediaOrder.length;
      for (const asset of result.assets) {
        const mediaType: MediaType = asset.type === "video" ? "video" : "image";
        const [path, blurhash] = await Promise.all([
          uploadPostMedia(post.keep_id, postId, asset.uri, position),
          mediaType === "image" ? computeBlurhash(asset.uri) : Promise.resolve(null),
        ]);
        const newMedia = await addPostMedia(postId, path, position, mediaType, blurhash);
        setMediaOrder((prev) => [...prev, newMedia]);
        position++;
      }
      setMediaEdited(true);
    } catch (e) {
      setEditError(getErrorMessage(e));
    } finally {
      setIsAddingMedia(false);
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

  // handleSubmit closes over caption/songTitle/etc., so it's a fresh
  // function every render — putting it directly in the effect below's deps
  // would re-run navigation.setOptions (and hand native-stack a brand new
  // headerLeft/headerRight) on every keystroke and every unrelated state
  // change in this screen (e.g. the preparingMediaId/isAddingMedia flips
  // during handleEditPress/handleAddMedia). Rebuilding the native header
  // that rapidly is what was corrupting the header bar and swipe-back
  // gesture. Routing the tap through a ref keeps the effect's deps limited
  // to what the header actually needs to redraw for, while Save still
  // always calls the latest handleSubmit.
  const handleSubmitRef = useRef(handleSubmit);
  handleSubmitRef.current = handleSubmit;

  useEffect(() => {
    navigation.setOptions({
      headerTitleStyle: { fontFamily: typography.family.serif, fontSize: typography.size.lg, color: colors.textPrimary },
      headerLeft: () => (
        <Pressable onPress={() => navigation.goBack()} disabled={isSaving || isDeleting} hitSlop={8}>
          <Text style={styles.headerCancel}>Cancel</Text>
        </Pressable>
      ),
      headerRight: () => (
        <Pressable onPress={() => handleSubmitRef.current()} disabled={isSaving || isDeleting} hitSlop={8}>
          {isSaving ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : (
            <Text style={[styles.headerSave, isDeleting && styles.headerSaveDisabled]}>Save</Text>
          )}
        </Pressable>
      ),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation, isSaving, isDeleting]);

  if (isLoading || !post) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const addTileIndex = mediaOrder.length < MAX_ITEMS ? mediaOrder.length : -1;
  const addTileCol = addTileIndex % GRID_COLUMNS;
  const addTileRow = Math.floor(addTileIndex / GRID_COLUMNS);
  const gridSlotCount = addTileIndex === -1 ? mediaOrder.length : mediaOrder.length + 1;
  const gridRows = Math.ceil(gridSlotCount / GRID_COLUMNS);
  const gridWidth = GRID_COLUMNS * GRID_TILE_SIZE + (GRID_COLUMNS - 1) * GRID_GAP;
  const gridHeight = gridRows > 0 ? gridRows * GRID_TILE_SIZE + (gridRows - 1) * GRID_GAP : 0;

  return (
    <KeyboardAvoidingScreen contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>
          {mediaOrder.length > 1 ? "Photos · hold & drag to reorder" : mediaOrder.length === 1 ? "Photo" : "Add a photo"}
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
              <Pressable style={styles.optionsBadge} onPress={() => handlePhotoOptions(media)} hitSlop={8}>
                {preparingMediaId === media.id ? (
                  <ActivityIndicator size="small" color={colors.textInverse} />
                ) : (
                  <Ionicons name="ellipsis-horizontal" size={14} color={colors.textInverse} style={iconGlyphFix(14)} />
                )}
              </Pressable>
            )}
          />
          {addTileIndex !== -1 && (
            <Pressable
              style={[
                styles.addTile,
                {
                  width: GRID_TILE_SIZE,
                  height: GRID_TILE_SIZE,
                  position: "absolute",
                  left: addTileCol * (GRID_TILE_SIZE + GRID_GAP),
                  top: addTileRow * (GRID_TILE_SIZE + GRID_GAP),
                },
              ]}
              onPress={handleAddMedia}
              disabled={isAddingMedia}
            >
              {isAddingMedia ? (
                <ActivityIndicator color={colors.textSecondary} />
              ) : (
                <Ionicons name="add" size={28} color={colors.textSecondary} style={iconGlyphFix(28)} />
              )}
            </Pressable>
          )}
        </View>
        {isSavingEdit && <Text style={styles.savingHint}>Saving photo edit...</Text>}
        {isAddingMedia && <Text style={styles.savingHint}>Adding photo...</Text>}
        {editError && <Text style={styles.error}>{editError}</Text>}

        <TextInput
          style={styles.captionInput}
          value={caption}
          onChangeText={setCaption}
          placeholder="Write a caption..."
          placeholderTextColor={colors.textSecondary}
          multiline
        />

        <View style={styles.divider} />

        <Text style={styles.eyebrow}>Details</Text>
        <View style={styles.chipRow}>
          <Pressable
            style={[styles.chip, isSongOpen && styles.chipActive]}
            onPress={() => setIsSongOpen((v) => !v)}
          >
            <Ionicons
              name="musical-notes-outline"
              size={14}
              color={isSongOpen ? colors.accent : colors.textSecondary}
            />
            <Text style={[styles.chipText, isSongOpen && styles.chipTextActive]}>Song</Text>
          </Pressable>
          <Pressable
            style={[styles.chip, isLocationOpen && styles.chipActive]}
            onPress={() => setIsLocationOpen((v) => !v)}
          >
            <Ionicons
              name="location-outline"
              size={14}
              color={isLocationOpen ? colors.accent : colors.textSecondary}
            />
            <Text style={[styles.chipText, isLocationOpen && styles.chipTextActive]}>Location</Text>
          </Pressable>
        </View>

        {isSongOpen && (
          <View style={styles.addonSection}>
            <View style={styles.addonHeader}>
              <Text style={styles.addonTitle}>Song</Text>
              <Pressable onPress={clearSong} hitSlop={8}>
                <Ionicons name="trash-outline" size={16} color={colors.danger} style={iconGlyphFix(16)} />
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

        {isLocationOpen && (
          <View style={styles.addonSection}>
            <View style={styles.addonHeader}>
              <Text style={styles.addonTitle}>Location</Text>
              <Pressable onPress={clearLocation} hitSlop={8}>
                <Ionicons name="trash-outline" size={16} color={colors.danger} style={iconGlyphFix(16)} />
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

        <View style={styles.divider} />

        <Pressable
          style={styles.listRow}
          onPress={() => navigation.navigate("MoveToKeep", { postId })}
          disabled={isSaving || isDeleting}
        >
          <Text style={styles.listRowText}>Move to another keep</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </Pressable>

        <Pressable style={styles.listRow} onPress={handleDelete} disabled={isSaving || isDeleting}>
          <Text style={[styles.listRowText, styles.deleteText]}>Delete post</Text>
          {isDeleting ? (
            <ActivityIndicator size="small" color={colors.danger} />
          ) : (
            <Ionicons name="trash-outline" size={18} color={colors.danger} />
          )}
        </Pressable>

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
    borderRadius: radii.md,
    backgroundColor: colors.surface,
  },
  addTile: {
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  optionsBadge: {
    position: "absolute",
    top: spacing.xs,
    right: spacing.xs,
    width: 24,
    height: 24,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.scrim,
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
  eyebrow: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: typography.letterSpacing.wide,
    marginBottom: spacing.sm,
  },
  captionInput: {
    padding: 0,
    fontSize: typography.size.md,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: spacing.lg,
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
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
  },
  chipActive: {
    backgroundColor: colors.accentMuted,
  },
  chipText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.textPrimary,
  },
  chipTextActive: {
    color: colors.accent,
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
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
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
