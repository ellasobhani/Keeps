import { useCallback, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, FlatList, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AppStackParamList } from "../navigation/AppNavigator";
import { useAuth } from "../lib/AuthProvider";
import { fetchOwnKeeps, fetchFollowerCount, fetchFollowingCount } from "../lib/queries";
import { getAvatarUrl } from "../lib/storage";
import KeepCoverCard from "../components/KeepCoverCard";
import Avatar from "../components/Avatar";
import { colors, spacing, radii, typography } from "../theme/tokens";

type Props = NativeStackScreenProps<AppStackParamList, "OutsiderProfilePreview">;

export default function OutsiderProfilePreview({ navigation }: Props) {
  const { session, profile } = useAuth();

  const {
    data: allKeeps = [],
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

  // "Show on profile" is the only gate for the profile grid, private or
  // public — see supabase/0010_shown_keeps_are_publicly_listable.sql. A
  // private keep's tile (title, cover, lock icon) still shows to a
  // non-follower; privacy_mode only gates the keep's contents once they
  // tap in, same as fetchProfileKeeps for someone else's real profile.
  const keeps = allKeeps.filter((keep) => !keep.hidden_from_profile);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refetchKeeps(), refetchFollowerCount(), refetchFollowingCount()]);
    } finally {
      setIsRefreshing(false);
    }
  }, [refetchKeeps, refetchFollowerCount, refetchFollowingCount]);

  return (
    <View style={styles.container}>
      <View style={styles.banner}>
        <Ionicons name="eye-outline" size={16} color={colors.textSecondary} />
        <Text style={styles.bannerText}>This is how your profile looks to someone who doesn't follow you.</Text>
      </View>
      <FlatList
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
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{followerCount}</Text>
                  <Text style={styles.statLabel}>followers</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{followingCount}</Text>
                  <Text style={styles.statLabel}>following</Text>
                </View>
              </View>
            </View>

            <Text style={styles.name}>{profile?.display_name}</Text>
            <Text style={styles.handle}>@{profile?.handle}</Text>
            {profile?.bio && <Text style={styles.bio}>{profile.bio}</Text>}

            <View style={styles.divider} />

            {isKeepsLoading && <ActivityIndicator style={styles.loader} color={colors.accent} />}
            {!isKeepsLoading && keeps.length === 0 && (
              <Text style={styles.empty}>No public keeps yet — this is what an outsider would see.</Text>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <KeepCoverCard keep={item} onPress={() => navigation.navigate("KeepDetail", { keepId: item.id })} />
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
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  bannerText: {
    flex: 1,
    fontSize: typography.size.xs,
    color: colors.textSecondary,
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
