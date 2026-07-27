import { View, Text, Pressable, Dimensions, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { getSignedMediaUrl } from "../lib/storage";
import { SIGNED_URL_QUERY_OPTIONS, signedMediaUrlKey } from "../lib/signedUrlCache";
import { colors, spacing, radii, typography } from "../theme/tokens";
import type { Keep } from "../types/database";

// Matches Profile's FlatList (numColumns=2, padding=lg, row gap=sm) — a
// fixed card width means a lone keep (or an odd count leaving one alone in
// the last row) stays the same cell size instead of flex:1 stretching it.
const NUM_COLUMNS = 2;
const GRID_PADDING = spacing.lg;
const GRID_GAP = spacing.sm;
const CARD_WIDTH = (Dimensions.get("window").width - GRID_PADDING * 2 - GRID_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

export default function KeepCoverCard({
  keep,
  onPress,
  onPressIn,
}: {
  keep: Keep;
  onPress: () => void;
  onPressIn?: () => void;
}) {
  const { data: coverUrl } = useQuery({
    queryKey: signedMediaUrlKey(keep.cover_photo_url ?? ""),
    queryFn: () => getSignedMediaUrl(keep.cover_photo_url!),
    enabled: !!keep.cover_photo_url,
    ...SIGNED_URL_QUERY_OPTIONS,
  });

  return (
    <Pressable style={styles.card} onPress={onPress} onPressIn={onPressIn}>
      {coverUrl || keep.cover_blurhash ? (
        <Image
          source={coverUrl ? { uri: coverUrl, cacheKey: keep.cover_photo_url! } : undefined}
          style={styles.cover}
          cachePolicy="memory-disk"
          transition={150}
          placeholder={keep.cover_blurhash ? { blurhash: keep.cover_blurhash } : undefined}
          placeholderContentFit="cover"
        />
      ) : (
        <View style={[styles.cover, styles.coverPlaceholder]} />
      )}
      <View style={styles.titleRow}>
        <Text style={styles.title} numberOfLines={1}>
          {keep.title}
        </Text>
        {keep.privacy_mode === "private" && (
          <Ionicons name="lock-closed" size={11} color={colors.textPrimary} style={styles.lockIcon} />
        )}
        {keep.hidden_from_profile && (
          <Ionicons name="eye-off-outline" size={11} color={colors.textSecondary} style={styles.lockIcon} />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
  },
  cover: {
    width: CARD_WIDTH,
    height: CARD_WIDTH,
    borderRadius: radii.none,
    backgroundColor: colors.surface,
  },
  coverPlaceholder: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.sm,
  },
  title: {
    flexShrink: 1,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.textPrimary,
  },
  lockIcon: {
    marginLeft: spacing.xs,
  },
});
