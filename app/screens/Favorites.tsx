import { View, Text, FlatList, ActivityIndicator, RefreshControl, StyleSheet } from "react-native";
import { useQuery } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AppStackParamList } from "../navigation/AppNavigator";
import { useAuth } from "../lib/AuthProvider";
import { fetchFavoritedPosts } from "../lib/queries";
import PostGridTile from "../components/PostGridTile";
import { colors, spacing, typography } from "../theme/tokens";
import type { PostWithMedia } from "../types/database";

type Props = NativeStackScreenProps<AppStackParamList, "Favorites">;

export default function Favorites({ navigation }: Props) {
  const { session } = useAuth();

  const {
    data: allPosts = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["favorites", session?.user.id],
    enabled: !!session,
    queryFn: () => fetchFavoritedPosts(session!.user.id),
  });

  // Defensive, same as KeepDetail: don't crash on media[0] for a post with
  // zero post_media rows.
  const posts = allPosts.filter((post) => post.post_media.length > 0);

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={(post) => post.id}
        numColumns={3}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.row}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.accent} />}
        ListEmptyComponent={!isLoading ? <Text style={styles.empty}>Nothing favorited yet.</Text> : null}
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
    gap: spacing.xs,
  },
  row: {
    gap: spacing.xs,
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
