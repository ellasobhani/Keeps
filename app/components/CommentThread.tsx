import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { AppStackParamList } from "../navigation/AppNavigator";
import { fetchCommentsForPost } from "../lib/queries";
import { colors, spacing, typography } from "../theme/tokens";

// Flat notes only — threaded replies (parent_id) are a public-keep feature
// that arrives with M5 (see mvp_spec.md §3, §5). Composing a comment lives in
// CommentComposer, pinned above the keyboard rather than scrolled with this list.
export default function CommentThread({ postId }: { postId: string }) {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["comments", postId],
    queryFn: () => fetchCommentsForPost(postId),
  });

  return (
    <View style={styles.container}>
      {isLoading && <ActivityIndicator color={colors.accent} />}
      {!isLoading && comments.length === 0 && <Text style={styles.empty}>No comments yet.</Text>}
      {comments.map((comment) => (
        <View key={comment.id} style={styles.comment}>
          <Text style={styles.body}>
            <Text
              style={styles.author}
              onPress={() => navigation.navigate("PublicProfile", { profileId: comment.author_id })}
            >
              {comment.profiles.display_name}{" "}
            </Text>
            {comment.body}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  empty: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
  },
  comment: {
    paddingVertical: spacing.xs,
  },
  author: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },
  body: {
    fontSize: typography.size.sm,
    color: colors.textPrimary,
    marginTop: 2,
  },
});
