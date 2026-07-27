import { useState } from "react";
import { View, Text, FlatList, Pressable, ActivityIndicator, RefreshControl, StyleSheet } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AppStackParamList } from "../navigation/AppNavigator";
import { fetchPendingFollowRequests, approveFollowRequest, unfollowKeep } from "../lib/queries";
import Button from "../components/Button";
import { colors, spacing, typography } from "../theme/tokens";
import type { KeepFollowerWithProfile } from "../types/database";

type Props = NativeStackScreenProps<AppStackParamList, "FollowRequests">;

export default function FollowRequests({ route, navigation }: Props) {
  const { keepId } = route.params;
  const queryClient = useQueryClient();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const {
    data: requests = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["followRequests", keepId],
    queryFn: () => fetchPendingFollowRequests(keepId),
  });

  const respond = async (profileId: string, action: "approve" | "decline") => {
    setProcessingId(profileId);
    try {
      if (action === "approve") {
        await approveFollowRequest(keepId, profileId);
      } else {
        await unfollowKeep(keepId, profileId);
      }
      await queryClient.invalidateQueries({ queryKey: ["followRequests", keepId] });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={requests}
        keyExtractor={(item) => item.profile_id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.accent} />}
        ListEmptyComponent={!isLoading ? <Text style={styles.empty}>No pending requests.</Text> : null}
        renderItem={({ item }: { item: KeepFollowerWithProfile }) => {
          const isProcessing = processingId === item.profile_id;
          return (
            <View style={styles.row}>
              <Pressable
                style={styles.identity}
                onPress={() => navigation.navigate("PublicProfile", { profileId: item.profile_id })}
              >
                <Text style={styles.name}>{item.profiles.display_name}</Text>
                <Text style={styles.handle}>@{item.profiles.handle}</Text>
              </Pressable>
              <View style={styles.actions}>
                <Button
                  label="Decline"
                  variant="secondary"
                  disabled={isProcessing}
                  onPress={() => respond(item.profile_id, "decline")}
                  style={styles.actionButton}
                />
                <Button
                  label="Approve"
                  disabled={isProcessing}
                  loading={isProcessing}
                  onPress={() => respond(item.profile_id, "approve")}
                  style={styles.actionButton}
                />
              </View>
            </View>
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
  row: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  identity: {
    marginBottom: spacing.sm,
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
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});
