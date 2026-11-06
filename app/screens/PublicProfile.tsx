import { useCallback, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, FlatList, Pressable, RefreshControl } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AppStackParamList } from "../navigation/AppNavigator";
import { useAuth } from "../lib/AuthProvider";
import {
  fetchProfileById,
  fetchProfileKeeps,
  fetchFollowerCount,
  fetchFollowingCount,
  isFollowingProfile,
  followProfile,
  unfollowProfile,
} from "../lib/queries";
import { getAvatarUrl } from "../lib/storage";
import { fetchPostsForKeepPrewarmed, postsForKeepKey } from "../lib/signedUrlCache";
import KeepCoverCard from "../components/KeepCoverCard";
import Avatar from "../components/Avatar";
import Button from "../components/Button";
import { colors, spacing, typography } from "../theme/tokens";
import type { Keep } from "../types/database";

type Props = NativeStackScreenProps<AppStackParamList, "PublicProfile">;

export default function PublicProfile({ route, navigation }: Props) {
  const { profileId } = route.params;
  const { session } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile, isLoading: isProfileLoading, refetch: refetchProfile } = useQuery({
    queryKey: ["profile", profileId],
    queryFn: () => fetchProfileById(profileId),
  });

  const {
    data: keeps = [],
    isLoading: isKeepsLoading,
    refetch: refetchKeeps,
  } = useQuery({
    queryKey: ["profileKeeps", profileId],
    queryFn: () => fetchProfileKeeps(profileId),
  });

  const { data: followerCount = 0, refetch: refetchFollowerCount } = useQuery({
    queryKey: ["followerCount", profileId],
    queryFn: () => fetchFollowerCount(profileId),
  });

  const { data: followingCount = 0, refetch: refetchFollowingCount } = useQuery({
    queryKey: ["followingCount", profileId],
    queryFn: () => fetchFollowingCount(profileId),
  });

  const { data: isFollowing, refetch: refetchIsFollowing } = useQuery({
    queryKey: ["isFollowingProfile", profileId, session?.user.id],
    enabled: !!session,
    queryFn: () => isFollowingProfile(profileId, session!.user.id),
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchProfile(),
        refetchKeeps(),
        refetchFollowerCount(),
        refetchFollowingCount(),
        session ? refetchIsFollowing() : Promise.resolve(),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  }, [refetchProfile, refetchKeeps, refetchFollowerCount, refetchFollowingCount, refetchIsFollowing, session]);

  const handleFollowPress = async () => {
    if (!session) return;
    if (isFollowing) {
      await unfollowProfile(profileId, session.user.id);
    } else {
      await followProfile(profileId, session.user.id);
    }
    await queryClient.invalidateQueries({ queryKey: ["isFollowingProfile", profileId, session.user.id] });
    await queryClient.invalidateQueries({ queryKey: ["followerCount", profileId] });
  };

  const isSelf = session?.user.id === profileId;

  const prefetchKeep = (keepId: string) => {
    queryClient.prefetchQuery({
      queryKey: postsForKeepKey(keepId),
      queryFn: () => fetchPostsForKeepPrewarmed(keepId, queryClient),
    });
  };

  if (isProfileLoading || !profile) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={keeps}
        keyExtractor={(keep) => keep.id}
        numColumns={3}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.row}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.identityRow}>
              <Avatar
                uri={profile.avatar_url ? getAvatarUrl(profile.avatar_url) : null}
                displayName={profile.display_name}
                size={76}
              />
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{keeps.length}</Text>
                  <Text style={styles.statLabel}>keeps</Text>
                </View>
                <Pressable
                  style={styles.statItem}
                  onPress={() => navigation.navigate("ProfileConnections", { profileId, mode: "followers" })}
                >
                  <Text style={styles.statValue}>{followerCount}</Text>
                  <Text style={styles.statLabel}>followers</Text>
                </Pressable>
                <Pressable
                  style={styles.statItem}
                  onPress={() => navigation.navigate("ProfileConnections", { profileId, mode: "following" })}
                >
                  <Text style={styles.statValue}>{followingCount}</Text>
                  <Text style={styles.statLabel}>following</Text>
                </Pressable>
              </View>
            </View>

            <Text style={styles.name}>{profile.display_name}</Text>
            <Text style={styles.handle}>@{profile.handle}</Text>
            {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}

            {!isSelf && (
              <Button
                label={isFollowing ? "Added" : "Add"}
                variant={isFollowing ? "secondary" : "primary"}
                onPress={handleFollowPress}
                style={styles.followButton}
              />
            )}

            <View style={styles.divider} />

            {isKeepsLoading && <ActivityIndicator style={styles.loader} color={colors.accent} />}
            {!isKeepsLoading && keeps.length === 0 && <Text style={styles.empty}>No keeps yet.</Text>}
          </View>
        }
        renderItem={({ item }: { item: Keep }) => (
          <KeepCoverCard
            keep={item}
            onPress={() => navigation.navigate("KeepDetail", { keepId: item.id })}
            onPressIn={() => prefetchKeep(item.id)}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
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
  identityRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  statsRow: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    marginLeft: spacing.lg,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.regular,
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  name: {
    fontFamily: typography.family.serif,
    fontSize: typography.size.lg,
    color: colors.textPrimary,
  },
  handle: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  bio: {
    fontSize: typography.size.sm,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  followButton: {
    marginTop: spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginTop: spacing.lg,
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
