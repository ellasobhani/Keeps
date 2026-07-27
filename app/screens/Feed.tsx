import { useEffect } from "react";
import { View, Text, FlatList, Pressable, ActivityIndicator, RefreshControl, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AppStackParamList } from "../navigation/AppNavigator";
import { useAuth } from "../lib/AuthProvider";
import { fetchFeed, type FeedPost } from "../lib/queries";
import { getLastSeenFeedAt, setLastSeenFeedAt } from "../lib/feedSeen";
import { getAvatarUrl, getSignedMediaUrl } from "../lib/storage";
import { SIGNED_URL_QUERY_OPTIONS, signedMediaUrlKey } from "../lib/signedUrlCache";
import Avatar from "../components/Avatar";
import BottomNavBar from "../components/BottomNavBar";
import { colors, spacing, radii, typography } from "../theme/tokens";

type Props = NativeStackScreenProps<AppStackParamList, "Feed">;

// Same shape as Notifications.tsx's timeAgo — small enough not to be worth
// sharing across the two screens.
function timeAgo(isoDate: string): string {
  const seconds = Math.max(0, (Date.now() - new Date(isoDate).getTime()) / 1000);
  if (seconds < 60) return "now";
  const minutes = seconds / 60;
  if (minutes < 60) return `${Math.floor(minutes)}m`;
  const hours = minutes / 60;
  if (hours < 24) return `${Math.floor(hours)}h`;
  const days = hours / 24;
  if (days < 7) return `${Math.floor(days)}d`;
  return `${Math.floor(days / 7)}w`;
}

function FeedThumb({ post }: { post: FeedPost }) {
  const media = [...post.post_media].sort((a, b) => a.position - b.position)[0];
  const { data: url } = useQuery({
    queryKey: signedMediaUrlKey(media?.media_url ?? ""),
    queryFn: () => getSignedMediaUrl(media!.media_url),
    enabled: !!media,
    ...SIGNED_URL_QUERY_OPTIONS,
  });

  return (
    <View style={styles.thumb}>
      <Image
        source={url ? { uri: url, cacheKey: media.media_url } : undefined}
        style={styles.thumbImage}
        cachePolicy="memory-disk"
        transition={150}
        placeholder={media?.blurhash ? { blurhash: media.blurhash } : undefined}
        placeholderContentFit="cover"
      />
      {media?.media_type === "video" && (
        <View style={styles.thumbVideoBadge}>
          <Ionicons name="play" size={12} color={colors.textInverse} />
        </View>
      )}
    </View>
  );
}

function FeedRow({ post, onPress }: { post: FeedPost; onPress: () => void }) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <Avatar
        uri={post.profiles.avatar_url ? getAvatarUrl(post.profiles.avatar_url) : null}
        displayName={post.profiles.display_name}
        size={40}
      />
      <View style={styles.rowBody}>
        <Text style={styles.rowHeader} numberOfLines={1}>
          <Text style={styles.rowAuthor}>{post.profiles.display_name}</Text>
          <Text style={styles.rowKeep}> · {post.keeps.title}</Text>
        </Text>
        {post.caption ? (
          <Text style={styles.rowCaption} numberOfLines={2}>
            <Text style={styles.rowCaptionAuthor}>{post.profiles.display_name} </Text>
            {post.caption}
          </Text>
        ) : null}
        <Text style={styles.rowTime}>{timeAgo(post.created_at)}</Text>
      </View>
      <FeedThumb post={post} />
    </Pressable>
  );
}

export default function Feed({ navigation }: Props) {
  const { session } = useAuth();

  const { data: lastSeenFeedAt, isLoading: isCursorLoading } = useQuery({
    queryKey: ["lastSeenFeedAt", session?.user.id],
    enabled: !!session,
    queryFn: () => getLastSeenFeedAt(session!.user.id),
  });

  const {
    data: posts = [],
    isLoading: isFeedLoading,
    refetch: refetchPosts,
    isRefetching,
  } = useQuery({
    queryKey: ["feed", session?.user.id, lastSeenFeedAt],
    enabled: !!session && !isCursorLoading,
    queryFn: () => fetchFeed(session!.user.id, lastSeenFeedAt ?? null),
  });

  // Freezes this batch as "seen" the moment the tab is opened, regardless of
  // scroll position — same timing as Notifications.tsx's lastSeen stamp.
  useEffect(() => {
    if (session && !isCursorLoading) setLastSeenFeedAt(session.user.id, new Date().toISOString());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, isCursorLoading]);

  const isLoading = isCursorLoading || isFeedLoading;

  return (
    <View style={styles.container}>
      <FlatList
        style={styles.list}
        data={posts}
        keyExtractor={(post) => post.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetchPosts} tintColor={colors.accent} />
        }
        renderItem={({ item }) => (
          <FeedRow post={item} onPress={() => navigation.navigate("PhotoDetail", { postId: item.id })} />
        )}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.caughtUp}>
              <Ionicons name="checkmark-circle" size={48} color={colors.accent} />
              <Text style={styles.caughtUpTitle}>You're all caught up</Text>
              <Text style={styles.caughtUpHint}>Nothing new since your last visit.</Text>
            </View>
          ) : null
        }
      />
      {isLoading && <ActivityIndicator style={styles.loader} color={colors.accent} />}
      <BottomNavBar active="feed" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    padding: spacing.lg,
  },
  loader: {
    marginTop: spacing.lg,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowBody: {
    flex: 1,
  },
  rowHeader: {
    fontSize: typography.size.sm,
  },
  rowAuthor: {
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },
  rowKeep: {
    color: colors.textSecondary,
  },
  rowCaption: {
    fontSize: typography.size.sm,
    color: colors.textPrimary,
    marginTop: 2,
  },
  rowCaptionAuthor: {
    fontWeight: typography.weight.bold,
  },
  rowTime: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: radii.xs,
    overflow: "hidden",
    backgroundColor: colors.surface,
  },
  thumbImage: {
    width: "100%",
    height: "100%",
  },
  thumbVideoBadge: {
    position: "absolute",
    right: spacing.xs,
    bottom: spacing.xs,
    width: 18,
    height: 18,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  caughtUp: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: spacing.xxl,
  },
  caughtUpTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  caughtUpHint: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
  },
});
