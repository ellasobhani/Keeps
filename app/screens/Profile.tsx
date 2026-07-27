import { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, FlatList, Pressable, RefreshControl, Share, Alert } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AppStackParamList } from "../navigation/AppNavigator";
import { useAuth } from "../lib/AuthProvider";
import {
  fetchOwnKeeps,
  fetchFollowerCount,
  fetchFollowingCount,
  fetchMyPendingCoOwnerInvites,
  fetchPendingFollowRequestsForOwnKeeps,
  fetchNotificationsForProfile,
} from "../lib/queries";
import { getLastSeenNotificationsAt } from "../lib/notificationSeen";
import { getAvatarUrl } from "../lib/storage";
import { fetchPostsForKeepPrewarmed, postsForKeepKey } from "../lib/signedUrlCache";
import KeepCoverCard from "../components/KeepCoverCard";
import Avatar from "../components/Avatar";
import IconButton from "../components/IconButton";
import SideMenu, { type SideMenuItem } from "../components/SideMenu";
import BottomNavBar from "../components/BottomNavBar";
import { colors, spacing, radii, typography } from "../theme/tokens";
import type { Keep } from "../types/database";

type Props = NativeStackScreenProps<AppStackParamList, "Profile">;

export default function Profile({ navigation }: Props) {
  const { session, profile, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Warms a keep's post list + photo urls the moment a finger lands on its
  // card — well before the tap completes and the nav transition finishes —
  // so KeepDetail usually has nothing left to fetch by the time it mounts.
  const prefetchKeep = (keepId: string) => {
    queryClient.prefetchQuery({
      queryKey: postsForKeepKey(keepId),
      queryFn: () => fetchPostsForKeepPrewarmed(keepId, queryClient),
    });
  };

  // Badge on the hamburger icon below: on if there's a co-owner invite or
  // keep-follow request still waiting on a response (naturally "pending" —
  // no seen-tracking needed), or a like/comment newer than the last time
  // this device opened Notifications (see lib/notificationSeen.ts).
  const { data: coOwnerInvites = [], refetch: refetchCoOwnerInvites } = useQuery({
    queryKey: ["myPendingCoOwnerInvites", session?.user.id],
    enabled: !!session,
    queryFn: () => fetchMyPendingCoOwnerInvites(session!.user.id),
  });

  const { data: keepRequests = [], refetch: refetchKeepRequests } = useQuery({
    queryKey: ["pendingFollowRequestsForOwnKeeps", session?.user.id],
    enabled: !!session,
    queryFn: () => fetchPendingFollowRequestsForOwnKeeps(session!.user.id),
  });

  const { data: notifications = [], refetch: refetchNotifications } = useQuery({
    queryKey: ["notifications", session?.user.id],
    enabled: !!session,
    queryFn: () => fetchNotificationsForProfile(session!.user.id),
  });

  const { data: lastSeenNotificationsAt } = useQuery({
    queryKey: ["lastSeenNotificationsAt", session?.user.id],
    enabled: !!session,
    queryFn: () => getLastSeenNotificationsAt(session!.user.id),
  });

  const hasPendingInvites = coOwnerInvites.length > 0 || keepRequests.some((r) => r.pending_count > 0);
  const hasUnseenNotifications =
    !!notifications[0] && (!lastSeenNotificationsAt || notifications[0].createdAt > lastSeenNotificationsAt);
  const hasBadge = hasPendingInvites || hasUnseenNotifications;

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerRightRow}>
          <IconButton name="eye-outline" onPress={() => navigation.navigate("OutsiderProfilePreview")} />
          <View style={styles.headerIconWrap}>
            <IconButton name="menu-outline" onPress={() => setIsMenuOpen(true)} />
            {hasBadge && <View style={styles.headerBadge} />}
          </View>
        </View>
      ),
    });
  }, [navigation, hasBadge]);

  const handleShareProfile = () => {
    if (!profile) return;
    Share.share({ message: `Check out @${profile.handle} on Keeps` });
  };

  const handleSignOutPress = () => {
    setIsMenuOpen(false);
    Alert.alert("Sign out?", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: () => signOut() },
    ]);
  };

  const menuItems: SideMenuItem[] = [
    {
      key: "notifications",
      label: "Notifications",
      icon: "heart-outline",
      onPress: () => {
        setIsMenuOpen(false);
        navigation.navigate("Notifications");
      },
    },
    {
      key: "favorites",
      label: "Favorites",
      icon: "bookmark-outline",
      onPress: () => {
        setIsMenuOpen(false);
        navigation.navigate("Favorites");
      },
    },
    {
      key: "invites",
      label: "Invites",
      icon: "people-outline",
      onPress: () => {
        setIsMenuOpen(false);
        navigation.navigate("Invites");
      },
    },
    {
      key: "share",
      label: "Share profile",
      icon: "share-outline",
      onPress: () => {
        setIsMenuOpen(false);
        handleShareProfile();
      },
    },
    {
      key: "profileSettings",
      label: "Profile settings",
      icon: "settings-outline",
      onPress: () => {
        setIsMenuOpen(false);
        navigation.navigate("EditProfile");
      },
    },
  ];

  const {
    data: keeps = [],
    isLoading: isKeepsLoading,
    refetch: refetchKeeps,
  } = useQuery({
    queryKey: ["keeps", session?.user.id],
    enabled: !!session,
    queryFn: () => fetchOwnKeeps(session!.user.id),
  });

  const { data: followerCount = 0, refetch: refetchFollowerCount } = useQuery({
    queryKey: ["followerCount", session?.user.id],
    enabled: !!session,
    queryFn: () => fetchFollowerCount(session!.user.id),
  });

  const { data: followingCount = 0, refetch: refetchFollowingCount } = useQuery({
    queryKey: ["followingCount", session?.user.id],
    enabled: !!session,
    queryFn: () => fetchFollowingCount(session!.user.id),
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchKeeps(),
        refetchFollowerCount(),
        refetchFollowingCount(),
        refetchCoOwnerInvites(),
        refetchKeepRequests(),
        refetchNotifications(),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  }, [
    refetchKeeps,
    refetchFollowerCount,
    refetchFollowingCount,
    refetchCoOwnerInvites,
    refetchKeepRequests,
    refetchNotifications,
  ]);

  return (
    <View style={styles.container}>
      <FlatList
        style={styles.list}
        data={keeps}
        keyExtractor={(keep) => keep.id}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.row}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.identityRow}>
              <Avatar
                uri={profile?.avatar_url ? getAvatarUrl(profile.avatar_url) : null}
                displayName={profile?.display_name ?? ""}
                size={76}
              />
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{keeps.length}</Text>
                  <Text style={styles.statLabel}>keeps</Text>
                </View>
                <Pressable
                  style={styles.statItem}
                  onPress={() =>
                    session &&
                    navigation.navigate("ProfileConnections", { profileId: session.user.id, mode: "followers" })
                  }
                >
                  <Text style={styles.statValue}>{followerCount}</Text>
                  <Text style={styles.statLabel}>followers</Text>
                </Pressable>
                <Pressable
                  style={styles.statItem}
                  onPress={() =>
                    session &&
                    navigation.navigate("ProfileConnections", { profileId: session.user.id, mode: "following" })
                  }
                >
                  <Text style={styles.statValue}>{followingCount}</Text>
                  <Text style={styles.statLabel}>following</Text>
                </Pressable>
              </View>
            </View>

            <Text style={styles.name}>{profile?.display_name}</Text>
            <Text style={styles.handle}>@{profile?.handle}</Text>
            {profile?.bio && <Text style={styles.bio}>{profile.bio}</Text>}

            <View style={styles.divider} />

            {isKeepsLoading && <ActivityIndicator style={styles.loader} color={colors.accent} />}
            {!isKeepsLoading && keeps.length === 0 && (
              <Text style={styles.empty}>No keeps yet — tap + above to create your first one.</Text>
            )}
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

      <SideMenu
        visible={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        items={menuItems}
        onSignOut={handleSignOutPress}
      />
      <BottomNavBar active="profile" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerRightRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  headerIconWrap: {
    position: "relative",
  },
  headerBadge: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 9,
    height: 9,
    borderRadius: radii.pill,
    backgroundColor: colors.danger,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  row: {
    gap: spacing.sm,
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
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  name: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
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
