import { useCallback, useState } from "react";
import { View, Text, FlatList, Pressable, ActivityIndicator, RefreshControl, StyleSheet } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AppStackParamList } from "../navigation/AppNavigator";
import { useAuth } from "../lib/AuthProvider";
import {
  fetchMyPendingCoOwnerInvites,
  acceptCoOwnerInvite,
  removeCoOwner,
  fetchRecentProfileFollowers,
  fetchPendingFollowRequestsForOwnKeeps,
} from "../lib/queries";
import Button from "../components/Button";
import { colors, spacing, typography } from "../theme/tokens";
import type { PendingInviteWithKeep, ProfileFollowerEvent, KeepFollowRequestSummary } from "../lib/queries";

type Props = NativeStackScreenProps<AppStackParamList, "Invites">;

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

type Row =
  | { type: "coOwnerHeader" }
  | { type: "coOwnerInvite"; invite: PendingInviteWithKeep }
  | { type: "followerHeader" }
  | { type: "follower"; event: ProfileFollowerEvent }
  | { type: "keepRequestHeader" }
  | { type: "keepRequest"; summary: KeepFollowRequestSummary };

export default function Invites({ navigation }: Props) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [processingKeepId, setProcessingKeepId] = useState<string | null>(null);

  const {
    data: coOwnerInvites = [],
    isLoading: isCoOwnerLoading,
    refetch: refetchCoOwnerInvites,
  } = useQuery({
    queryKey: ["myPendingCoOwnerInvites", session?.user.id],
    enabled: !!session,
    queryFn: () => fetchMyPendingCoOwnerInvites(session!.user.id),
  });

  const {
    data: newFollowers = [],
    isLoading: isFollowersLoading,
    refetch: refetchNewFollowers,
  } = useQuery({
    queryKey: ["recentProfileFollowers", session?.user.id],
    enabled: !!session,
    queryFn: () => fetchRecentProfileFollowers(session!.user.id),
  });

  const {
    data: keepRequests = [],
    isLoading: isKeepRequestsLoading,
    refetch: refetchKeepRequests,
  } = useQuery({
    queryKey: ["pendingFollowRequestsForOwnKeeps", session?.user.id],
    enabled: !!session,
    queryFn: () => fetchPendingFollowRequestsForOwnKeeps(session!.user.id),
  });

  const isLoading = isCoOwnerLoading || isFollowersLoading || isKeepRequestsLoading;
  const [isRefreshing, setIsRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refetchCoOwnerInvites(), refetchNewFollowers(), refetchKeepRequests()]);
    } finally {
      setIsRefreshing(false);
    }
  }, [refetchCoOwnerInvites, refetchNewFollowers, refetchKeepRequests]);

  const respondToCoOwnerInvite = async (keepId: string, action: "accept" | "decline") => {
    if (!session) return;
    setProcessingKeepId(keepId);
    try {
      if (action === "accept") {
        await acceptCoOwnerInvite(keepId, session.user.id);
      } else {
        await removeCoOwner(keepId, session.user.id);
      }
      await queryClient.invalidateQueries({ queryKey: ["myPendingCoOwnerInvites", session.user.id] });
      await queryClient.invalidateQueries({ queryKey: ["keeps", session.user.id] });
      if (action === "accept") {
        navigation.navigate("KeepDetail", { keepId });
      }
    } finally {
      setProcessingKeepId(null);
    }
  };

  const rows: Row[] = [
    ...(coOwnerInvites.length > 0 ? [{ type: "coOwnerHeader" as const }] : []),
    ...coOwnerInvites.map((invite) => ({ type: "coOwnerInvite" as const, invite })),
    ...(keepRequests.length > 0 ? [{ type: "keepRequestHeader" as const }] : []),
    ...keepRequests.map((summary) => ({ type: "keepRequest" as const, summary })),
    ...(newFollowers.length > 0 ? [{ type: "followerHeader" as const }] : []),
    ...newFollowers.map((event) => ({ type: "follower" as const, event })),
  ];

  return (
    <View style={styles.container}>
      <FlatList
        data={rows}
        keyExtractor={(row, index) => {
          if (row.type === "coOwnerInvite") return `coOwner-${row.invite.keep_id}`;
          if (row.type === "keepRequest") return `keepRequest-${row.summary.keep_id}`;
          if (row.type === "follower") return `follower-${row.event.follower_id}`;
          return `${row.type}-${index}`;
        }}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        ListEmptyComponent={
          !isLoading ? <Text style={styles.empty}>No invites, requests, or new followers.</Text> : null
        }
        renderItem={({ item }: { item: Row }) => {
          if (item.type === "coOwnerHeader") return <Text style={styles.sectionLabel}>Co-owner invites</Text>;
          if (item.type === "keepRequestHeader")
            return <Text style={styles.sectionLabel}>Follow requests on your keeps</Text>;
          if (item.type === "followerHeader") return <Text style={styles.sectionLabel}>New followers</Text>;

          if (item.type === "coOwnerInvite") {
            const isProcessing = processingKeepId === item.invite.keep_id;
            return (
              <View style={styles.row}>
                <View style={styles.identity}>
                  <Text style={styles.title}>{item.invite.keeps?.title ?? "a keep"}</Text>
                  <Text style={styles.hint}>Invited to co-own this keep</Text>
                </View>
                <View style={styles.actions}>
                  <Button
                    label="Decline"
                    variant="secondary"
                    disabled={isProcessing}
                    onPress={() => respondToCoOwnerInvite(item.invite.keep_id, "decline")}
                    style={styles.actionButton}
                  />
                  <Button
                    label="Accept"
                    disabled={isProcessing}
                    loading={isProcessing}
                    onPress={() => respondToCoOwnerInvite(item.invite.keep_id, "accept")}
                    style={styles.actionButton}
                  />
                </View>
              </View>
            );
          }

          if (item.type === "keepRequest") {
            return (
              <Pressable
                style={styles.row}
                onPress={() => navigation.navigate("FollowRequests", { keepId: item.summary.keep_id })}
              >
                <View style={styles.identity}>
                  <Text style={styles.title}>{item.summary.keep_title}</Text>
                  <Text style={styles.hint}>
                    {item.summary.pending_count} pending request{item.summary.pending_count === 1 ? "" : "s"}
                  </Text>
                </View>
              </Pressable>
            );
          }

          return (
            <Pressable
              style={styles.row}
              onPress={() => navigation.navigate("PublicProfile", { profileId: item.event.follower_id })}
            >
              <View style={styles.identity}>
                <Text style={styles.title}>{item.event.profiles.display_name} started following you</Text>
                <Text style={styles.hint}>
                  @{item.event.profiles.handle} · {timeAgo(item.event.created_at)}
                </Text>
              </View>
            </Pressable>
          );
        }}
      />
      {isLoading && <ActivityIndicator style={styles.loader} color={colors.accent} />}
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
  },
  loader: {
    marginTop: spacing.lg,
  },
  empty: {
    fontSize: typography.size.md,
    color: colors.textSecondary,
    marginTop: spacing.lg,
  },
  sectionLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.textSecondary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  row: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  identity: {
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },
  hint: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});
