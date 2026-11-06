import { useEffect } from "react";
import { View, Text, FlatList, ActivityIndicator, Pressable, RefreshControl, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AppStackParamList } from "../navigation/AppNavigator";
import { useAuth } from "../lib/AuthProvider";
import { fetchNotificationsForProfile } from "../lib/queries";
import { setLastSeenNotificationsAt } from "../lib/notificationSeen";
import { getAvatarUrl } from "../lib/storage";
import Avatar from "../components/Avatar";
import { colors, spacing, radii, typography } from "../theme/tokens";
import type { PostNotification } from "../lib/queries";

type Props = NativeStackScreenProps<AppStackParamList, "Notifications">;

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

export default function Notifications({ navigation }: Props) {
  const { session } = useAuth();

  const {
    data: notifications = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["notifications", session?.user.id],
    enabled: !!session,
    queryFn: () => fetchNotificationsForProfile(session!.user.id),
  });

  useEffect(() => {
    if (session) setLastSeenNotificationsAt(session.user.id, new Date().toISOString());
  }, [session]);

  return (
    <View style={styles.container}>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.accent} />}
        ListEmptyComponent={
          !isLoading ? <Text style={styles.empty}>No notifications yet.</Text> : null
        }
        renderItem={({ item }: { item: PostNotification }) => (
          <Pressable
            style={styles.row}
            onPress={() => navigation.navigate("PhotoDetail", { postId: item.postId })}
          >
            <View style={styles.avatarWrap}>
              <Avatar
                uri={item.actor.avatar_url ? getAvatarUrl(item.actor.avatar_url) : null}
                displayName={item.actor.display_name}
                size={40}
              />
              <View style={[styles.badge, item.type === "like" ? styles.badgeLike : styles.badgeComment]}>
                <Ionicons name={item.type === "like" ? "heart" : "chatbubble"} size={10} color={colors.textInverse} />
              </View>
            </View>
            <View style={styles.textWrap}>
              <Text style={styles.body}>
                <Text style={styles.actor}>{item.actor.display_name}</Text>
                {item.type === "like" ? " liked your post" : " commented on your post"}
                {item.type === "comment" && item.commentBody ? `: ${item.commentBody}` : ""}
              </Text>
              <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
            </View>
          </Pressable>
        )}
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
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  avatarWrap: {
    position: "relative",
  },
  badge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: radii.pill,
    borderWidth: 2,
    borderColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeLike: {
    backgroundColor: colors.danger,
  },
  badgeComment: {
    backgroundColor: colors.accent,
  },
  textWrap: {
    flex: 1,
    paddingTop: 2,
  },
  body: {
    fontSize: typography.size.sm,
    color: colors.textPrimary,
  },
  actor: {
    fontWeight: typography.weight.bold,
  },
  time: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
