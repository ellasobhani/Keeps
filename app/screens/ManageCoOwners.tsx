import { useState } from "react";
import { View, Text, TextInput, FlatList, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AppStackParamList } from "../navigation/AppNavigator";
import { useAuth } from "../lib/AuthProvider";
import {
  fetchKeepCoOwners,
  fetchPendingCoOwnerInvites,
  fetchProfileByHandle,
  inviteCoOwner,
  removeCoOwner,
} from "../lib/queries";
import { Ionicons } from "@expo/vector-icons";
import { getErrorMessage } from "../lib/errors";
import Button from "../components/Button";
import IconButton from "../components/IconButton";
import KeyboardAvoidingScreen from "../components/KeyboardAvoidingScreen";
import { colors, spacing, radii, typography } from "../theme/tokens";
import type { KeepMemberWithProfile } from "../types/database";

type Props = NativeStackScreenProps<AppStackParamList, "ManageCoOwners">;

export default function ManageCoOwners({ route, navigation }: Props) {
  const { keepId } = route.params;
  const { session } = useAuth();
  const queryClient = useQueryClient();

  const [handle, setHandle] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const { data: coOwners = [], isLoading: isCoOwnersLoading } = useQuery({
    queryKey: ["keepCoOwners", keepId],
    queryFn: () => fetchKeepCoOwners(keepId),
  });

  const { data: pendingInvites = [], isLoading: isPendingLoading } = useQuery({
    queryKey: ["pendingCoOwnerInvites", keepId],
    queryFn: () => fetchPendingCoOwnerInvites(keepId),
  });

  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["keepCoOwners", keepId] }),
      queryClient.invalidateQueries({ queryKey: ["pendingCoOwnerInvites", keepId] }),
    ]);

  const handleInvite = async () => {
    if (!handle.trim()) return;
    setInviteError(null);
    setIsInviting(true);
    try {
      const profile = await fetchProfileByHandle(handle.trim());
      if (!profile) {
        setInviteError("No one found with that handle.");
        return;
      }
      if (coOwners.some((m) => m.profile_id === profile.id)) {
        setInviteError(`@${profile.handle} is already a co-owner.`);
        return;
      }
      if (pendingInvites.some((m) => m.profile_id === profile.id)) {
        setInviteError(`@${profile.handle} already has a pending invite.`);
        return;
      }
      await inviteCoOwner(keepId, profile.id);
      setHandle("");
      await refresh();
    } catch (e) {
      setInviteError(getErrorMessage(e));
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemove = async (profileId: string) => {
    setProcessingId(profileId);
    try {
      await removeCoOwner(keepId, profileId);
      await refresh();
      if (profileId === session?.user.id) {
        navigation.popToTop();
      }
    } finally {
      setProcessingId(null);
    }
  };

  const renderMemberRow = (item: KeepMemberWithProfile, isPending: boolean) => {
    const isSelf = item.profile_id === session?.user.id;
    const isOnlyCoOwner = !isPending && coOwners.length <= 1;
    return (
      <View style={styles.row} key={item.profile_id}>
        <Pressable
          style={styles.identity}
          onPress={() => navigation.navigate("PublicProfile", { profileId: item.profile_id })}
        >
          <Text style={styles.name}>
            {item.profiles.display_name}
            {isSelf && " (you)"}
          </Text>
          <Text style={styles.handle}>
            @{item.profiles.handle}
            {isPending && " · invited"}
          </Text>
        </Pressable>
        {isPending || isSelf ? (
          <Button
            label={isPending ? "Cancel" : "Leave"}
            variant={isPending ? "secondary" : "danger"}
            disabled={processingId === item.profile_id || isOnlyCoOwner}
            loading={processingId === item.profile_id}
            onPress={() => handleRemove(item.profile_id)}
            style={styles.actionButton}
          />
        ) : processingId === item.profile_id ? (
          <ActivityIndicator color={colors.danger} style={styles.removeLoader} />
        ) : (
          <IconButton
            name="trash-outline"
            color={colors.danger}
            disabled={isOnlyCoOwner}
            onPress={() => handleRemove(item.profile_id)}
          />
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingScreen contentContainerStyle={styles.content}>
      <Text style={styles.label}>Invite a co-owner</Text>
      <Text style={styles.hint}>
        Co-owners can post, edit settings, invite others, and delete this keep — same as you.
      </Text>
      <View style={styles.inviteRow}>
        <TextInput
          style={styles.input}
          value={handle}
          onChangeText={(text) => {
            setHandle(text);
            setInviteError(null);
          }}
          placeholder="handle"
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={handleInvite}
        />
        <Button label="Invite" disabled={!handle.trim()} loading={isInviting} onPress={handleInvite} />
      </View>
      {inviteError && <Text style={styles.error}>{inviteError}</Text>}

      <Text style={styles.sectionLabel}>Co-owners</Text>
      {isCoOwnersLoading && <ActivityIndicator color={colors.accent} style={styles.loader} />}
      <FlatList
        data={coOwners}
        keyExtractor={(item) => item.profile_id}
        scrollEnabled={false}
        renderItem={({ item }) => renderMemberRow(item, false)}
      />

      {pendingInvites.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>Pending invites</Text>
          <FlatList
            data={pendingInvites}
            keyExtractor={(item) => item.profile_id}
            scrollEnabled={false}
            renderItem={({ item }) => renderMemberRow(item, true)}
          />
        </>
      )}
      {isPendingLoading && <ActivityIndicator color={colors.accent} style={styles.loader} />}
    </KeyboardAvoidingScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
  },
  label: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  hint: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  inviteRow: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xs,
    padding: spacing.md,
    fontSize: typography.size.md,
    color: colors.textPrimary,
  },
  error: {
    color: colors.danger,
    marginTop: spacing.sm,
  },
  sectionLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.textPrimary,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  loader: {
    marginTop: spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  identity: {
    flex: 1,
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
  actionButton: {
    minWidth: 88,
  },
  removeLoader: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
});
