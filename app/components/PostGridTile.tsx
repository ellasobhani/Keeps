import { View, Pressable, Dimensions, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { getSignedMediaUrl } from "../lib/storage";
import { SIGNED_URL_QUERY_OPTIONS, signedMediaUrlKey } from "../lib/signedUrlCache";
import { colors, spacing, radii } from "../theme/tokens";
import type { MediaType } from "../types/database";

// Matches the numColumns/padding/gap every consumer (KeepDetail, Favorites)
// uses for its grid — a fixed tile size means a short row (e.g. one post)
// stays the same cell size instead of flex:1 stretching it to fill the row.
const NUM_COLUMNS = 3;
const GRID_PADDING = spacing.lg;
const GRID_GAP = spacing.xs;
const TILE_SIZE =
  (Dimensions.get("window").width - GRID_PADDING * 2 - GRID_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

// Video files can't render through <Image> — it silently shows nothing,
// which is why grid previews used to stay blank until you opened the post.
// VideoView paused on its first frame gives a real poster image instead.
function VideoTilePreview({ url }: { url: string }) {
  const player = useVideoPlayer(url, (p) => {
    p.pause();
  });
  return (
    <VideoView
      player={player}
      style={styles.image}
      nativeControls={false}
      contentFit="cover"
      pointerEvents="none"
    />
  );
}

export default function PostGridTile({
  mediaPath,
  mediaCount,
  firstMediaType,
  blurhash,
  onPress,
}: {
  mediaPath: string;
  mediaCount: number;
  firstMediaType: MediaType;
  blurhash: string | null;
  onPress: () => void;
}) {
  const { data: url } = useQuery({
    queryKey: signedMediaUrlKey(mediaPath),
    queryFn: () => getSignedMediaUrl(mediaPath),
    ...SIGNED_URL_QUERY_OPTIONS,
  });

  return (
    <Pressable style={styles.tile} onPress={onPress}>
      {firstMediaType === "video" ? (
        url ? <VideoTilePreview url={url} /> : <View style={[styles.image, styles.placeholder]} />
      ) : url || blurhash ? (
        // cachePolicy + a stable cacheKey (the storage path, not the signed
        // url) mean a photo we've already downloaded once shows instantly
        // from disk even after its signed url's token rotates — otherwise
        // every re-sign would look like a brand-new image to the cache and
        // force a full re-download. placeholder renders the blurhash the
        // instant the tile mounts, before url even resolves, instead of a
        // blank box.
        <Image
          source={url ? { uri: url, cacheKey: mediaPath } : undefined}
          style={styles.image}
          cachePolicy="memory-disk"
          transition={150}
          placeholder={blurhash ? { blurhash } : undefined}
          placeholderContentFit="cover"
        />
      ) : (
        <View style={[styles.image, styles.placeholder]} />
      )}
      {mediaCount > 1 && (
        <View style={[styles.badge, styles.badgeRight]}>
          <Ionicons name="copy-outline" size={13} color={colors.textInverse} />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: radii.none,
    overflow: "visible",
    backgroundColor: colors.surface,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  badge: {
    position: "absolute",
    top: spacing.xs,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  badgeRight: {
    right: spacing.xs,
  },
});
