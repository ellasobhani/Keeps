import { useState } from "react";
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { AppStackParamList } from "../navigation/AppNavigator";
import {
  fetchLikesForPost,
  likePost,
  unlikePost,
  fetchIsFavorited,
  favoritePost,
  unfavoritePost,
} from "../lib/queries";
import { colors, spacing, typography } from "../theme/tokens";
import type { LikeWithProfile } from "../types/database";

// Private-keep engagement is names, not counts (see mvp_spec.md §5, M3) —
// counts/anonymized display arrive with public mode in M5. Each name stays
// individually tappable (→ PublicProfile), so this renders as Text spans
// rather than one joined string like the old formatNames did.
function LikeNames({
  likes,
  onPressProfile,
}: {
  likes: LikeWithProfile[];
  onPressProfile: (profileId: string) => void;
}) {
  if (likes.length === 0) {
    return <Text style={styles.names}>No likes yet</Text>;
  }
  return (
    <Text style={styles.names}>
      Liked by{" "}
      {likes.map((like, index) => (
        <Text key={like.profile_id}>
          <Text onPress={() => onPressProfile(like.profile_id)} style={styles.nameLink}>
            {like.profiles.display_name}
          </Text>
          {index < likes.length - 2 ? ", " : index === likes.length - 2 ? " and " : ""}
        </Text>
      ))}
    </Text>
  );
}

export default function LikeRow({ postId, profileId }: { postId: string; profileId: string }) {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const queryClient = useQueryClient();
  const [isToggling, setIsToggling] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

  const { data: likes = [] } = useQuery({
    queryKey: ["likes", postId],
    queryFn: () => fetchLikesForPost(postId),
  });

  const { data: isFavorited = false } = useQuery({
    queryKey: ["favorite", postId, profileId],
    queryFn: () => fetchIsFavorited(postId, profileId),
  });

  const hasLiked = likes.some((like) => like.profile_id === profileId);

  const toggleLike = async () => {
    if (isToggling) return;
    setIsToggling(true);
    try {
      if (hasLiked) {
        await unlikePost(postId, profileId);
      } else {
        await likePost(postId, profileId);
      }
      await queryClient.invalidateQueries({ queryKey: ["likes", postId] });
    } finally {
      setIsToggling(false);
    }
  };

  const toggleFavorite = async () => {
    if (isTogglingFavorite) return;
    setIsTogglingFavorite(true);
    try {
      if (isFavorited) {
        await unfavoritePost(postId, profileId);
      } else {
        await favoritePost(postId, profileId);
      }
      await queryClient.invalidateQueries({ queryKey: ["favorite", postId, profileId] });
      await queryClient.invalidateQueries({ queryKey: ["favorites", profileId] });
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  return (
    <View style={styles.row}>
      <Pressable onPress={toggleLike} disabled={isToggling} hitSlop={8}>
        {isToggling ? (
          <ActivityIndicator size="small" color={colors.accent} />
        ) : (
          <Text style={[styles.heart, hasLiked && styles.heartActive]}>{hasLiked ? "♥" : "♡"}</Text>
        )}
      </Pressable>
      <LikeNames likes={likes} onPressProfile={(id) => navigation.navigate("PublicProfile", { profileId: id })} />
      <Pressable onPress={toggleFavorite} disabled={isTogglingFavorite} hitSlop={8}>
        {isTogglingFavorite ? (
          <ActivityIndicator size="small" color={colors.accent} />
        ) : (
          <Ionicons
            name={isFavorited ? "bookmark" : "bookmark-outline"}
            size={22}
            color={isFavorited ? colors.textPrimary : colors.textSecondary}
          />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  heart: {
    fontSize: typography.size.xl,
    color: colors.textSecondary,
  },
  heartActive: {
    color: colors.danger,
  },
  names: {
    flex: 1,
    fontSize: typography.size.sm,
    color: colors.textSecondary,
  },
  nameLink: {
    fontWeight: typography.weight.medium,
    color: colors.textPrimary,
  },
});
