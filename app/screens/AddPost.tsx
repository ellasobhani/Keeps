import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Image,
  ScrollView,
  Switch,
  StyleSheet,
  Dimensions,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AppStackParamList } from "../navigation/AppNavigator";
import { useAuth } from "../lib/AuthProvider";
import { createPost, addPostMedia, deletePost } from "../lib/queries";
import { uploadPostMedia } from "../lib/storage";
import { computeBlurhash } from "../lib/blurhash";
import { getErrorMessage } from "../lib/errors";
import Button from "../components/Button";
import IconButton from "../components/IconButton";
import CarouselChevron from "../components/CarouselChevron";
import SortableGrid from "../components/SortableGrid";
import PhotoEditor from "../components/PhotoEditor";
import KeyboardAvoidingScreen from "../components/KeyboardAvoidingScreen";
import { colors, spacing, radii, typography, iconGlyphFix } from "../theme/tokens";
import type { MediaType } from "../types/database";

type Props = NativeStackScreenProps<AppStackParamList, "AddPost">;
type Step = "select" | "details";
type MediaItem = { uri: string; type: MediaType };

const HERO_SIZE = Dimensions.get("window").width - spacing.lg * 2;
const VIDEO_MAX_DURATION_SECONDS = 60;
const MAX_ITEMS = 10;
const GRID_COLUMNS = 3;
const GRID_GAP = spacing.xs;
const GRID_TILE_SIZE = (Dimensions.get("window").width - spacing.lg * 2 - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS;

function VideoThumbBadge({ size = 20 }: { size?: number }) {
  return (
    <View
      style={[
        styles.videoBadge,
        { width: size, height: size, borderRadius: size / 2, marginLeft: -size / 2, marginTop: -size / 2 },
      ]}
    >
      <Ionicons name="play" size={size * 0.55} color={colors.textInverse} />
    </View>
  );
}

export default function AddPost({ route, navigation }: Props) {
  const { keepId } = route.params;
  const { session } = useAuth();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<Step>("select");
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [caption, setCaption] = useState("");
  const [songTitle, setSongTitle] = useState("");
  const [songArtist, setSongArtist] = useState("");
  const [songUrl, setSongUrl] = useState("");
  const [locationLabel, setLocationLabel] = useState("");
  const [isSongOpen, setIsSongOpen] = useState(false);
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [showInFeed, setShowInFeed] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [heroIndex, setHeroIndex] = useState(0);
  const [editingUri, setEditingUri] = useState<string | null>(null);

  const launchPicker = async (options: ImagePicker.ImagePickerOptions) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("Photo library access is needed to add photos or videos.");
      return null;
    }
    const result = await ImagePicker.launchImageLibraryAsync(options);
    return result.canceled ? null : result.assets;
  };

  const toMediaItem = (asset: ImagePicker.ImagePickerAsset): MediaItem => ({
    uri: asset.uri,
    type: asset.type === "video" ? "video" : "image",
  });

  const pickMedia = async () => {
    const assets = await launchPicker({
      mediaTypes: ["images", "videos"],
      allowsMultipleSelection: true,
      orderedSelection: true,
      selectionLimit: MAX_ITEMS,
      quality: 0.8,
      videoMaxDuration: VIDEO_MAX_DURATION_SECONDS,
    });
    if (assets) {
      setError(null);
      setMediaItems(assets.map(toMediaItem));
    }
  };

  // Auto-open the picker the moment this screen appears — a placeholder
  // button you have to tap first just adds a step before the same picker.
  useEffect(() => {
    pickMedia();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addMoreMedia = async () => {
    const remaining = MAX_ITEMS - mediaItems.length;
    if (remaining <= 0) return;
    const assets = await launchPicker({
      mediaTypes: ["images", "videos"],
      allowsMultipleSelection: true,
      orderedSelection: true,
      selectionLimit: remaining,
      quality: 0.8,
      videoMaxDuration: VIDEO_MAX_DURATION_SECONDS,
    });
    if (assets) {
      setError(null);
      setMediaItems((prev) => [...prev, ...assets.map(toMediaItem)]);
    }
  };

  const replaceMediaAt = async (index: number) => {
    const assets = await launchPicker({
      mediaTypes: ["images", "videos"],
      quality: 0.8,
      videoMaxDuration: VIDEO_MAX_DURATION_SECONDS,
    });
    if (assets && assets[0]) {
      const replacement = toMediaItem(assets[0]);
      setMediaItems((prev) => prev.map((item, i) => (i === index ? replacement : item)));
    }
  };

  const removeMedia = (uri: string) => {
    setMediaItems((prev) => prev.filter((item) => item.uri !== uri));
  };

  const handleEditSave = (newUri: string) => {
    setMediaItems((prev) => prev.map((item) => (item.uri === editingUri ? { ...item, uri: newUri } : item)));
    setEditingUri(null);
  };

  const handleHeroScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / HERO_SIZE);
    setHeroIndex((prev) => (prev === index ? prev : index));
  };

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

  const handleSubmit = async () => {
    if (!session || mediaItems.length === 0) return;
    setError(null);
    setIsSaving(true);
    try {
      const post = await createPost({
        keepId,
        authorId: session.user.id,
        caption: caption.trim() || null,
        songTitle: songTitle.trim() || null,
        songArtist: songArtist.trim() || null,
        songUrl: songUrl.trim() || null,
        locationLabel: locationLabel.trim() || null,
        showInFeed,
      });
      try {
        for (let i = 0; i < mediaItems.length; i++) {
          setUploadProgress({ current: i + 1, total: mediaItems.length });
          const item = mediaItems[i];
          const [path, blurhash] = await Promise.all([
            uploadPostMedia(keepId, post.id, item.uri, i),
            item.type === "image" ? computeBlurhash(item.uri) : Promise.resolve(null),
          ]);
          await addPostMedia(post.id, path, i, item.type, blurhash);
        }
      } catch (mediaError) {
        // Don't leave a medialess post behind — a post with zero post_media
        // rows crashes the grid (KeepDetail assumes media[0] exists).
        await deletePost(post.id).catch(() => {});
        throw mediaError;
      }
      await queryClient.invalidateQueries({ queryKey: ["posts", keepId] });
      navigation.goBack();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setIsSaving(false);
      setUploadProgress(null);
    }
  };

  const addTileIndex = mediaItems.length < MAX_ITEMS ? mediaItems.length : -1;
  const addTileCol = addTileIndex % GRID_COLUMNS;
  const addTileRow = Math.floor(addTileIndex / GRID_COLUMNS);
  const gridSlotCount = addTileIndex === -1 ? mediaItems.length : mediaItems.length + 1;
  const gridRows = Math.ceil(gridSlotCount / GRID_COLUMNS);
  const gridWidth = GRID_COLUMNS * GRID_TILE_SIZE + (GRID_COLUMNS - 1) * GRID_GAP;
  const gridHeight = gridRows > 0 ? gridRows * GRID_TILE_SIZE + (gridRows - 1) * GRID_GAP : 0;

  if (step === "select") {
    return (
      <View style={styles.container}>
        {mediaItems.length === 0 ? (
          <Pressable style={styles.emptyState} onPress={pickMedia}>
            <Ionicons name="images-outline" size={40} color={colors.textSecondary} />
            <Text style={styles.emptyStateText}>Select photos or videos</Text>
          </Pressable>
        ) : (
          <ScrollView style={styles.selectContent}>
            <Text style={styles.selectedCount}>
              {mediaItems.length} item{mediaItems.length > 1 ? "s" : ""} selected — tap one to swap it, hold and
              drag to reorder
            </Text>
            <View style={[styles.gridWrap, { width: gridWidth, height: gridHeight }]}>
              <SortableGrid
                data={mediaItems}
                keyExtractor={(item) => item.uri}
                numColumns={GRID_COLUMNS}
                itemSize={GRID_TILE_SIZE}
                gap={GRID_GAP}
                onPressItem={(_item, index) => replaceMediaAt(index)}
                onDragEnd={setMediaItems}
                renderItem={(item) => (
                  <>
                    {item.type === "image" ? (
                      <Image source={{ uri: item.uri }} style={styles.gridImage} />
                    ) : (
                      <View style={[styles.gridImage, styles.videoPlaceholder]} />
                    )}
                    {item.type === "video" && <VideoThumbBadge size={28} />}
                  </>
                )}
                renderOverlay={(item) => (
                  <>
                    {item.type === "image" && (
                      <Pressable
                        style={styles.editBadge}
                        onPress={() => setEditingUri(item.uri)}
                        hitSlop={8}
                      >
                        <Ionicons name="crop-outline" size={14} color={colors.textInverse} style={iconGlyphFix(14)} />
                      </Pressable>
                    )}
                    <Pressable style={styles.trashBadge} onPress={() => removeMedia(item.uri)} hitSlop={8}>
                      <Ionicons name="trash-outline" size={14} color={colors.textInverse} style={iconGlyphFix(14)} />
                    </Pressable>
                  </>
                )}
              />
              {mediaItems.length < MAX_ITEMS && (
                <Pressable
                  style={[
                    styles.gridTile,
                    styles.addTile,
                    {
                      position: "absolute",
                      left: addTileCol * (GRID_TILE_SIZE + GRID_GAP),
                      top: addTileRow * (GRID_TILE_SIZE + GRID_GAP),
                    },
                  ]}
                  onPress={addMoreMedia}
                >
                  <Ionicons name="add" size={28} color={colors.textSecondary} style={iconGlyphFix(28)} />
                </Pressable>
              )}
            </View>
          </ScrollView>
        )}

        {error && <Text style={styles.error}>{error}</Text>}

        <Button label="Next" onPress={() => setStep("details")} disabled={mediaItems.length === 0} />

        <PhotoEditor
          visible={editingUri !== null}
          uri={editingUri}
          onCancel={() => setEditingUri(null)}
          onSave={handleEditSave}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingScreen contentContainerStyle={styles.content}>
        <IconButton
          name="chevron-back"
          onPress={() => setStep("select")}
          size={32}
          style={styles.backLink}
        />

        <View style={styles.hero}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleHeroScroll}
            scrollEventThrottle={16}
          >
            {mediaItems.map((item) => (
              <View key={item.uri} style={styles.heroImageWrap}>
                {item.type === "image" ? (
                  <Image source={{ uri: item.uri }} style={styles.heroImage} />
                ) : (
                  <View style={[styles.heroImage, styles.videoPlaceholder]} />
                )}
                {item.type === "video" && <VideoThumbBadge size={44} />}
              </View>
            ))}
          </ScrollView>
          {mediaItems.length > 1 && heroIndex > 0 && <CarouselChevron direction="left" />}
          {mediaItems.length > 1 && heroIndex < mediaItems.length - 1 && <CarouselChevron direction="right" />}
        </View>

        <TextInput
          style={[styles.input, styles.multiline]}
          value={caption}
          onChangeText={(text) => {
            if (text.length > caption.length && text.endsWith("\n")) {
              handleSubmit();
              return;
            }
            setCaption(text);
          }}
          placeholder="Write a caption..."
          placeholderTextColor={colors.textSecondary}
          multiline
          returnKeyType="send"
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

        {!isLocationOpen ? (
          <Pressable style={styles.addonRow} onPress={() => setIsLocationOpen(true)}>
            <Text style={styles.addonRowText}>Add location</Text>
          </Pressable>
        ) : (
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

        {uploadProgress && (
          <Text style={styles.progress}>
            Uploading {uploadProgress.current} of {uploadProgress.total}...
          </Text>
        )}

        <Button label="Share" onPress={handleSubmit} loading={isSaving} />
    </KeyboardAvoidingScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  content: {
    padding: spacing.lg,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  emptyStateText: {
    color: colors.textSecondary,
    fontSize: typography.size.md,
    fontWeight: typography.weight.medium,
  },
  selectContent: {
    flex: 1,
  },
  selectedCount: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  gridWrap: {
    position: "relative",
  },
  gridTile: {
    width: GRID_TILE_SIZE,
    height: GRID_TILE_SIZE,
    position: "relative",
  },
  gridImage: {
    width: "100%",
    height: "100%",
    backgroundColor: colors.surface,
  },
  addTile: {
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
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
    backgroundColor: colors.scrim,
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
    backgroundColor: colors.scrim,
  },
  videoPlaceholder: {
    backgroundColor: colors.textPrimary,
  },
  videoBadge: {
    position: "absolute",
    top: "50%",
    left: "50%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.scrim,
  },
  backLink: {
    marginBottom: spacing.md,
  },
  hero: {
    width: HERO_SIZE,
    aspectRatio: 1,
    borderRadius: radii.none,
    marginBottom: spacing.md,
  },
  heroImageWrap: {
    position: "relative",
  },
  heroImage: {
    width: HERO_SIZE,
    height: HERO_SIZE,
    borderRadius: radii.none,
    backgroundColor: colors.surface,
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
  progress: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
});
