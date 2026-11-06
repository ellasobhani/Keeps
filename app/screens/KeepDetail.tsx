import { useCallback, useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, Pressable, RefreshControl, Alert, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AppStackParamList } from "../navigation/AppNavigator";
import { useAuth } from "../lib/AuthProvider";
import {
  fetchKeepById,
  fetchKeepMembership,
  fetchKeepFollowStatus,
  fetchPendingCoOwnerInvites,
  fetchKeepCoOwners,
  followKeep,
  unfollowKeep,
  reconcilePostMediaLocation,
} from "../lib/queries";
import { fetchPostsForKeepPrewarmed, postsForKeepKey } from "../lib/signedUrlCache";
import { getErrorMessage } from "../lib/errors";
import { getAvatarUrl } from "../lib/storage";
import PostGridTile from "../components/PostGridTile";
import IconButton from "../components/IconButton";
import Button from "../components/Button";
import Avatar from "../components/Avatar";
import { colors, spacing, radii, typography } from "../theme/tokens";
import type { PostWithMedia, KeepMemberWithProfile } from "../types/database";

const AVATAR_STACK_MAX = 4;
const AVATAR_STACK_SIZE = 22;

// Overlapping co-owner avatars — tappable (opens ManageCoOwners) only for
// co-owners themselves; a follower/outsider viewing a public keep can see
// who's in it (keep_members select RLS allows this) but has no reason to
// reach the invite/remove screen, so it renders as plain info for them.
function AvatarStack({
  coOwners,
  onPress,
}: {
  coOwners: KeepMemberWithProfile[];
  onPress?: () => void;
}) {
  const shown = coOwners.slice(0, AVATAR_STACK_MAX);
  const content = (
    <View style={styles.avatarStack}>
      {shown.map((member, index) => (
        <View
          key={member.profile_id}
          style={[styles.avatarStackItem, index > 0 && { marginLeft: -8 }]}
        >
          <Avatar
            uri={member.profiles.avatar_url ? getAvatarUrl(member.profiles.avatar_url) : null}
            displayName={member.profiles.display_name}
            size={AVATAR_STACK_SIZE}
          />
        </View>
      ))}
    </View>
  );
  return onPress ? <Pressable onPress={onPress}>{content}</Pressable> : content;
}

type Props = NativeStackScreenProps<AppStackParamList, "KeepDetail">;

export default function KeepDetail({ route, navigation }: Props) {
  const { keepId } = route.params;
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const queryClient = useQueryClient();

  const { data: keep, refetch: refetchKeep } = useQuery({
    queryKey: ["keep", keepId],
    queryFn: () => fetchKeepById(keepId),
  });

  const {
    data: allPosts = [],
    isLoading,
    refetch: refetchPosts,
  } = useQuery({
    queryKey: postsForKeepKey(keepId),
    queryFn: () => fetchPostsForKeepPrewarmed(keepId, queryClient),
  });

  // Defensive: a post can end up with zero post_media rows if an upload
  // failed partway through before the cleanup in AddPost existed. Hide
  // those rather than crash on media[0] below.
  const posts = allPosts.filter((post) => post.post_media.length > 0);

  // Self-heal: only the author's own client can fix post_media (see the
  // RLS policy in supabase/0011_post_media_update_policy.sql), so this is
  // the one place that's guaranteed to run whenever they view a keep they
  // moved a post into or out of — see reconcilePostMediaLocation for why a
  // post's media can drift out of sync with its keep_id in the first place.
  useEffect(() => {
    if (!session) return;
    const ownPosts = allPosts.filter((post) => post.author_id === session.user.id);
    if (ownPosts.length === 0) return;
    (async () => {
      let anyFixed = false;
      for (const post of ownPosts) {
        try {
          if (await reconcilePostMediaLocation(post)) anyFixed = true;
        } catch (e) {
          console.warn(`[reconcile] failed for post ${post.id}:`, getErrorMessage(e));
        }
      }
      if (anyFixed) queryClient.invalidateQueries({ queryKey: postsForKeepKey(keepId) });
    })();
  }, [allPosts, session, keepId, queryClient]);

  // Membership is the sole source of truth for rights now — any approved
  // co-owner has full parity, not just the original creator (keep.owner_id
  // is provenance only, see supabase/0006_collaborative_keeps.sql).
  const { data: membership } = useQuery({
    queryKey: ["keepMembership", keepId, session?.user.id],
    enabled: !!session,
    queryFn: () => fetchKeepMembership(keepId, session!.user.id),
  });
  const isCoOwner = membership?.status === "approved";

  const { data: followStatus } = useQuery({
    queryKey: ["keepFollowStatus", keepId, session?.user.id],
    enabled: !!session && !isCoOwner,
    queryFn: () => fetchKeepFollowStatus(keepId, session!.user.id),
  });

  // Shared query key with ManageCoOwners.tsx — same underlying list, so a
  // change made there (invite accepted, co-owner removed) is already
  // invalidated under this key and this stack picks it up for free.
  const { data: coOwners = [], refetch: refetchCoOwners } = useQuery({
    queryKey: ["keepCoOwners", keepId],
    queryFn: () => fetchKeepCoOwners(keepId),
  });

  // Badge on the collaborators icon below — invites you've sent that
  // haven't been accepted yet. Incoming follow requests moved to the
  // Invites tab (Milestone 9 of collaborative_keeps_plan.md), so this icon
  // is purely about managing co-owners now.
  const { data: pendingCoOwnerInvites = [], refetch: refetchPendingCoOwnerInvites } = useQuery({
    queryKey: ["pendingCoOwnerInvites", keepId],
    enabled: isCoOwner,
    queryFn: () => fetchPendingCoOwnerInvites(keepId),
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchKeep(),
        refetchPosts(),
        refetchCoOwners(),
        isCoOwner ? refetchPendingCoOwnerInvites() : Promise.resolve(),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  }, [refetchKeep, refetchPosts, refetchCoOwners, refetchPendingCoOwnerInvites, isCoOwner]);

  const handleFollowPress = async () => {
    if (!session || !keep) return;
    if (followStatus) {
      await unfollowKeep(keepId, session.user.id);
    } else {
      await followKeep(keepId, session.user.id, keep.privacy_mode === "public");
    }
    await queryClient.invalidateQueries({ queryKey: ["keepFollowStatus", keepId, session.user.id] });
  };

  const showKeepActions = () => {
    Alert.alert("", "", [
      { text: "Edit", onPress: () => navigation.navigate("EditKeep", { keepId }) },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  useEffect(() => {
    navigation.setOptions({
      headerRight: isCoOwner ? () => <IconButton name="ellipsis-horizontal" onPress={showKeepActions} /> : undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation, keepId, isCoOwner]);

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={(post) => post.id}
        numColumns={3}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.row}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Text style={styles.title} numberOfLines={1}>
                {keep?.title}
              </Text>
              {keep?.privacy_mode === "private" && (
                <Ionicons name="lock-closed" size={16} color={colors.textPrimary} style={styles.lockIcon} />
              )}
            </View>

            {coOwners.length > 0 && (
              <View style={styles.sharedRow}>
                <Text style={styles.sharedText}>
                  {posts.length} {posts.length === 1 ? "memory" : "memories"} · shared with
                </Text>
                <View style={styles.avatarStackWrap}>
                  <AvatarStack
                    coOwners={coOwners}
                    onPress={isCoOwner ? () => navigation.navigate("ManageCoOwners", { keepId }) : undefined}
                  />
                  {isCoOwner && pendingCoOwnerInvites.length > 0 && (
                    <View style={styles.requestsBadge}>
                      <Text style={styles.requestsBadgeText}>{pendingCoOwnerInvites.length}</Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {!isCoOwner && followStatus !== undefined && (
              <Button
                label={
                  followStatus === "approved"
                    ? "Following"
                    : followStatus === "pending"
                      ? "Requested"
                      : keep?.privacy_mode === "public"
                        ? "Follow"
                        : "Request to follow"
                }
                variant={followStatus ? "secondary" : "primary"}
                onPress={handleFollowPress}
                style={styles.followButton}
              />
            )}

            <View style={styles.divider} />
            {isLoading && <ActivityIndicator style={styles.loader} color={colors.accent} />}
            {!isLoading && posts.length === 0 && (
              <Text style={styles.empty}>No posts yet — tap + below to add the first one.</Text>
            )}
          </View>
        }
        renderItem={({ item }: { item: PostWithMedia }) => {
          const media = [...item.post_media].sort((a, b) => a.position - b.position);
          return (
            <PostGridTile
              mediaPath={media[0].media_url}
              mediaCount={media.length}
              firstMediaType={media[0].media_type}
              blurhash={media[0].blurhash}
              onPress={() => navigation.navigate("PhotoDetail", { postId: item.id })}
            />
          );
        }}
      />

      {isCoOwner && (
        <IconButton
          name="add"
          variant="solid"
          size={56}
          onPress={() => navigation.navigate("AddPost", { keepId })}
          style={[styles.fab, { bottom: insets.bottom + spacing.lg }]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: spacing.lg,
    gap: spacing.xs,
  },
  row: {
    gap: spacing.xs,
  },
  header: {
    marginBottom: spacing.lg,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    flex: 1,
    fontFamily: typography.family.serif,
    fontSize: typography.size.xl,
    color: colors.textPrimary,
  },
  lockIcon: {
    marginLeft: spacing.xs,
  },
  sharedRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xs,
  },
  sharedText: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    marginRight: spacing.xs,
  },
  avatarStackWrap: {
    position: "relative",
  },
  avatarStack: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarStackItem: {
    borderWidth: 2,
    borderColor: colors.background,
    borderRadius: radii.pill,
  },
  requestsBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.xs,
    backgroundColor: colors.danger,
    alignItems: "center",
    justifyContent: "center",
  },
  requestsBadgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    color: colors.textInverse,
  },
  followButton: {
    marginTop: spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginTop: spacing.md,
  },
  fab: {
    position: "absolute",
    right: spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  loader: {
    marginTop: spacing.lg,
  },
  empty: {
    fontSize: typography.size.md,
    color: colors.textSecondary,
    marginTop: spacing.lg,
  },
});
