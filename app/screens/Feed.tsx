import { useEffect, useState } from "react";
import { View, Text, FlatList, Pressable, ActivityIndicator, RefreshControl, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AppStackParamList } from "../navigation/AppNavigator";
import { useAuth } from "../lib/AuthProvider";
import { fetchFeed, type FeedPost, type FeedScope } from "../lib/queries";
import { getLastSeenFeedAt, setLastSeenFeedAt } from "../lib/feedSeen";
import { getAvatarUrl, getSignedMediaUrl } from "../lib/storage";
import { SIGNED_URL_QUERY_OPTIONS, signedMediaUrlKey } from "../lib/signedUrlCache";
import Avatar from "../components/Avatar";
import BottomNavBar from "../components/BottomNavBar";
import LikeRow from "../components/LikeRow";
import { colors, spacing, radii, typography } from "../theme/tokens";

type Props = NativeStackScreenProps<AppStackParamList, "Feed">;

const SCOPE_OPTIONS: { value: FeedScope; label: string }[] = [
  { value: "mine", label: "My keeps" },
  { value: "all", label: "Keeps + following" },
];

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

function FeedThumb({ post, onPress }: { post: FeedPost; onPress: () => void }) {
  const media = [...post.post_media].sort((a, b) => a.position - b.position)[0];
  const { data: url } = useQuery({
    queryKey: signedMediaUrlKey(media?.media_url ?? ""),
    queryFn: () => getSignedMediaUrl(media!.media_url),
    enabled: !!media,
    ...SIGNED_URL_QUERY_OPTIONS,
  });

  return (
    <Pressable style={styles.thumb} onPress={onPress}>
      <Image
        source={url ? { uri: url, cacheKey: media.media_url } : undefined}
        style={styles.thumbImage}
        cachePolicy="memory-disk"
        transition={150}
        placeholder={media?.blurhash ? { blurhash: media.blurhash } : undefined}
        placeholderContentFit="cover"
      />
      {post.post_media.length > 1 && (
        <View style={[styles.thumbBadge, styles.thumbBadgeTop]}>
          <Ionicons name="copy-outline" size={13} color={colors.textInverse} />
        </View>
      )}
      {media?.media_type === "video" && (
        <View style={[styles.thumbBadge, styles.thumbBadgeBottom]}>
          <Ionicons name="play" size={12} color={colors.textInverse} />
        </View>
      )}
    </Pressable>
  );
}

function FeedRow({ post, onPress, profileId }: { post: FeedPost; onPress: () => void; profileId: string }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Avatar
          uri={post.profiles.avatar_url ? getAvatarUrl(post.profiles.avatar_url) : null}
          displayName={post.profiles.display_name}
          size={36}
        />
        <View style={styles.cardHeaderText}>
          <Text style={styles.cardAuthor} numberOfLines={1}>
            {post.profiles.display_name}
          </Text>
          <Text style={styles.cardMeta} numberOfLines={1}>
            {post.keeps.title} · {timeAgo(post.created_at)}
          </Text>
        </View>
      </View>
      <FeedThumb post={post} onPress={onPress} />
      {post.caption ? (
        <Text style={styles.cardCaption} numberOfLines={3}>
          <Text style={styles.cardCaptionAuthor}>{post.profiles.display_name} </Text>
          {post.caption}
        </Text>
      ) : null}
      <View style={styles.cardLikes}>
        <LikeRow postId={post.id} profileId={profileId} />
      </View>
    </View>
  );
}

export default function Feed({ navigation }: Props) {
  const { session } = useAuth();
  const [scope, setScope] = useState<FeedScope>("all");

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
    queryKey: ["feed", session?.user.id, lastSeenFeedAt, scope],
    enabled: !!session && !isCursorLoading,
    queryFn: () => fetchFeed(session!.user.id, lastSeenFeedAt ?? null, scope),
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
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.pageTitle}>Keeps</Text>
            <View style={styles.scopeRow}>
              {SCOPE_OPTIONS.map((option) => {
                const isActive = option.value === scope;
                return (
                  <Pressable
                    key={option.value}
                    style={[styles.scopePill, isActive && styles.scopePillActive]}
                    onPress={() => setScope(option.value)}
                  >
                    <Text style={[styles.scopePillText, isActive && styles.scopePillTextActive]}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <FeedRow
            post={item}
            profileId={session!.user.id}
            onPress={() => navigation.navigate("PhotoDetail", { postId: item.id })}
          />
        )}
        ListFooterComponent={
          !isLoading ? (
            <View style={styles.caughtUp}>
              <Ionicons name="checkmark-circle" size={48} color={colors.accent} />
              <Text style={styles.caughtUpTitle}>You're all caught up</Text>
              <Text style={styles.caughtUpHint}>New keeps and posts will show up here.</Text>
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
  header: {
    marginBottom: spacing.lg,
  },
  pageTitle: {
    fontFamily: typography.family.serif,
    fontSize: typography.size.xl,
    color: colors.textPrimary,
  },
  scopeRow: {
    flexDirection: "row",
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  scopePill: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
  },
  scopePillActive: {
    backgroundColor: colors.textPrimary,
  },
  scopePillText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    color: colors.textSecondary,
  },
  scopePillTextActive: {
    color: colors.textInverse,
  },
  card: {
    paddingBottom: spacing.lg,
    marginBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardAuthor: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },
  cardMeta: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    marginTop: 1,
  },
  cardCaption: {
    fontSize: typography.size.sm,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  cardCaptionAuthor: {
    fontWeight: typography.weight.bold,
  },
  cardLikes: {
    marginTop: spacing.sm,
  },
  thumb: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: radii.none,
    overflow: "hidden",
    backgroundColor: colors.surface,
  },
  thumbImage: {
    width: "100%",
    height: "100%",
  },
  thumbBadge: {
    position: "absolute",
    right: spacing.xs,
    width: 20,
    height: 20,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.scrim,
  },
  thumbBadgeTop: {
    top: spacing.xs,
  },
  thumbBadgeBottom: {
    bottom: spacing.xs,
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
