import { useEffect } from "react";
import { View, Text, FlatList, ActivityIndicator, Pressable, RefreshControl, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AppStackParamList } from "../navigation/AppNavigator";
import { useAuth } from "../lib/AuthProvider";
import { fetchNotificationsForProfile } from "../lib/queries";
import { setLastSeenNotificationsAt } from "../lib/notificationSeen";
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
            <View style={styles.iconWrap}>
              <Ionicons
                name={item.type === "like" ? "heart" : "chatbubble"}
                size={16}
                color={item.type === "like" ? colors.danger : colors.textPrimary}
              />
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
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  textWrap: {
    flex: 1,
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
