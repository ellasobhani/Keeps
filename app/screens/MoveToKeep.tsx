import { useState } from "react";
import { View, Text, FlatList, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AppStackParamList } from "../navigation/AppNavigator";
import { useAuth } from "../lib/AuthProvider";
import { fetchPostById, fetchOwnKeeps, movePostToKeep, updatePostMediaUrl } from "../lib/queries";
import { movePostMediaFile } from "../lib/storage";
import { getErrorMessage } from "../lib/errors";
import { colors, spacing, typography } from "../theme/tokens";
import type { Keep } from "../types/database";

type Props = NativeStackScreenProps<AppStackParamList, "MoveToKeep">;

export default function MoveToKeep({ route, navigation }: Props) {
  const { postId } = route.params;
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [movingKeepId, setMovingKeepId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: post, isLoading: isPostLoading } = useQuery({
    queryKey: ["post", postId],
    queryFn: () => fetchPostById(postId),
  });

  const { data: ownKeeps = [], isLoading: isKeepsLoading } = useQuery({
    queryKey: ["keeps", session?.user.id],
    enabled: !!session,
    queryFn: () => fetchOwnKeeps(session!.user.id),
  });

  // Only other keeps you co-own — the RLS added in 0008 would reject
  // anything else anyway, but filtering here avoids offering a move that's
  // guaranteed to fail.
  const destinations = ownKeeps.filter((keep) => keep.id !== post?.keep_id);

  const handleMove = async (destinationKeepId: string) => {
    if (!post) return;
    setError(null);
    setMovingKeepId(destinationKeepId);
    try {
      for (const media of post.post_media) {
        const newPath = await movePostMediaFile(media.media_url, destinationKeepId);
        await updatePostMediaUrl(media.id, newPath);
      }
      await movePostToKeep(postId, destinationKeepId);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["posts", post.keep_id] }),
        queryClient.invalidateQueries({ queryKey: ["posts", destinationKeepId] }),
        queryClient.invalidateQueries({ queryKey: ["post", postId] }),
      ]);

      navigation.popToTop();
      navigation.navigate("KeepDetail", { keepId: destinationKeepId });
    } catch (e) {
      setError(getErrorMessage(e));
      setMovingKeepId(null);
    }
  };

  const isLoading = isPostLoading || isKeepsLoading;

  return (
    <View style={styles.container}>
      {error && <Text style={styles.error}>{error}</Text>}
      <FlatList
        data={destinations}
        keyExtractor={(keep) => keep.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !isLoading ? <Text style={styles.empty}>No other keeps to move this into.</Text> : null
        }
        renderItem={({ item }: { item: Keep }) => {
          const isMoving = movingKeepId === item.id;
          return (
            <Pressable
              style={styles.row}
              onPress={() => handleMove(item.id)}
              disabled={!!movingKeepId}
            >
              <Text style={styles.title}>{item.title}</Text>
              {isMoving && <ActivityIndicator color={colors.accent} />}
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
  error: {
    color: colors.danger,
    padding: spacing.lg,
    paddingBottom: 0,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.medium,
    color: colors.textPrimary,
  },
});
