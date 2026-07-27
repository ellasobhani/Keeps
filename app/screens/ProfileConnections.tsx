import { useEffect } from "react";
import { View, Text, FlatList, Pressable, ActivityIndicator, RefreshControl, StyleSheet } from "react-native";
import { useQuery } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AppStackParamList } from "../navigation/AppNavigator";
import { fetchProfileFollowersList, fetchProfileFollowingList } from "../lib/queries";
import { colors, spacing, typography } from "../theme/tokens";
import type { ProfileConnection } from "../lib/queries";

type Props = NativeStackScreenProps<AppStackParamList, "ProfileConnections">;

export default function ProfileConnections({ route, navigation }: Props) {
  const { profileId, mode } = route.params;
  const isFollowers = mode === "followers";

  useEffect(() => {
    navigation.setOptions({ title: isFollowers ? "Followers" : "Following" });
  }, [navigation, isFollowers]);

  const {
    data: connections = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: [isFollowers ? "profileFollowersList" : "profileFollowingList", profileId],
    queryFn: () => (isFollowers ? fetchProfileFollowersList(profileId) : fetchProfileFollowingList(profileId)),
  });

  return (
    <View style={styles.container}>
      <FlatList
        data={connections}
        keyExtractor={(item) => item.profile_id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.accent} />}
        ListEmptyComponent={
          !isLoading ? (
            <Text style={styles.empty}>{isFollowers ? "No followers yet." : "Not following anyone yet."}</Text>
          ) : null
        }
        renderItem={({ item }: { item: ProfileConnection }) => (
          <Pressable
            style={styles.row}
            onPress={() => navigation.navigate("PublicProfile", { profileId: item.profiles.id })}
          >
            <View>
              <Text style={styles.name}>{item.profiles.display_name}</Text>
              <Text style={styles.handle}>@{item.profiles.handle}</Text>
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
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
});
