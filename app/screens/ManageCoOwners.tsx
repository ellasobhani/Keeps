import { useEffect, useState } from "react";
import { View, Text, TextInput, FlatList, Pressable, ActivityIndicator, Alert, StyleSheet } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AppStackParamList } from "../navigation/AppNavigator";
import { useAuth } from "../lib/AuthProvider";
import {
  fetchKeepCoOwners,
  fetchPendingCoOwnerInvites,
  searchProfiles,
  inviteCoOwner,
  removeCoOwner,
} from "../lib/queries";
import { getErrorMessage } from "../lib/errors";
import { getAvatarUrl } from "../lib/storage";
import Avatar from "../components/Avatar";
import KeyboardAvoidingScreen from "../components/KeyboardAvoidingScreen";
import { colors, spacing, radii, typography } from "../theme/tokens";
import type { KeepMemberWithProfile, Profile } from "../types/database";

type Props = NativeStackScreenProps<AppStackParamList, "ManageCoOwners">;

export default function ManageCoOwners({ route, navigation }: Props) {
  const { keepId } = route.params;
  const { session } = useAuth();
  const queryClient = useQueryClient();

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [invitingId, setInvitingId] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Simple debounce — same as Search.tsx's people search, which this
  // reuses. The previous version required typing someone's exact full
  // handle before it would even look them up, so anything short of that
  // just silently found no one; live results as you type actually show
  // matches.
  useEffect(() => {
    const timeout = setTimeout(() => setQuery(input.trim()), 300);
    return () => clearTimeout(timeout);
  }, [input]);

  const { data: coOwners = [], isLoading: isCoOwnersLoading } = useQuery({
    queryKey: ["keepCoOwners", keepId],
    queryFn: () => fetchKeepCoOwners(keepId),
  });

  const { data: pendingInvites = [], isLoading: isPendingLoading } = useQuery({
    queryKey: ["pendingCoOwnerInvites", keepId],
    queryFn: () => fetchPendingCoOwnerInvites(keepId),
  });

  const { data: searchResults = [], isLoading: isSearching } = useQuery({
    queryKey: ["searchProfiles", query],
    enabled: query.length > 0,
    queryFn: () => searchProfiles(query),
  });

  const inviteableResults = searchResults.filter(
    (profile) =>
      profile.id !== session?.user.id &&
      !coOwners.some((m) => m.profile_id === profile.id) &&
      !pendingInvites.some((m) => m.profile_id === profile.id)
  );

  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["keepCoOwners", keepId] }),
      queryClient.invalidateQueries({ queryKey: ["pendingCoOwnerInvites", keepId] }),
    ]);

  const handleInvite = async (profile: Profile) => {
    setInviteError(null);
    setInvitingId(profile.id);
    try {
      await inviteCoOwner(keepId, profile.id);
      setInput("");
      setQuery("");
      setIsInviteOpen(false);
      await refresh();
    } catch (e) {
      setInviteError(getErrorMessage(e));
    } finally {
      setInvitingId(null);
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

  const ownMembership = coOwners.find((m) => m.profile_id === session?.user.id);
  const isLastCoOwner = coOwners.length <= 1;

  const confirmRemove = (item: KeepMemberWithProfile, isPending: boolean) => {
    const isSelf = item.profile_id === session?.user.id;
    const isOnlyCoOwner = !isPending && coOwners.length <= 1;
    if (isOnlyCoOwner || processingId) return;
    const title = isPending
      ? `Cancel ${item.profiles.display_name}'s invite?`
      : isSelf
        ? "Leave this keep?"
        : `Remove ${item.profiles.display_name}?`;
    Alert.alert(title, undefined, [
      { text: "Cancel", style: "cancel" },
      {
        text: isPending ? "Cancel invite" : isSelf ? "Leave" : "Remove",
        style: "destructive",
        onPress: () => handleRemove(item.profile_id),
      },
    ]);
  };

  const renderMemberRow = (item: KeepMemberWithProfile, isPending: boolean) => {
    const isSelf = item.profile_id === session?.user.id;
    // keep_members.role ("owner" vs "contributor") is unused dead weight
    // since 0006_collaborative_keeps.sql — every approved member has equal
    // rights, so the label shouldn't imply a hierarchy that isn't there.
    const roleLabel = isPending ? "Invited" : "Co-owner";
    return (
      <Pressable
        style={styles.row}
        key={item.profile_id}
        onPress={() => navigation.navigate("PublicProfile", { profileId: item.profile_id })}
        onLongPress={() => confirmRemove(item, isPending)}
      >
        <Avatar
          uri={item.profiles.avatar_url ? getAvatarUrl(item.profiles.avatar_url) : null}
          displayName={item.profiles.display_name}
          size={48}
        />
        <Text style={styles.name} numberOfLines={1}>
          {item.profiles.display_name}
          {isSelf && " (you)"}
        </Text>
        {processingId === item.profile_id ? (
          <ActivityIndicator color={colors.textSecondary} />
        ) : (
          <Text style={styles.role}>{roleLabel}</Text>
        )}
      </Pressable>
    );
  };

  return (
    <KeyboardAvoidingScreen contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Collaborators</Text>
      <Text style={styles.hint}>Anyone added can post and see everything in this keep.</Text>

      {isCoOwnersLoading && <ActivityIndicator color={colors.accent} style={styles.loader} />}
      <FlatList
        data={coOwners}
        keyExtractor={(item) => item.profile_id}
        scrollEnabled={false}
        renderItem={({ item }) => renderMemberRow(item, false)}
      />

      {pendingInvites.length > 0 && (
        <FlatList
          data={pendingInvites}
          keyExtractor={(item) => item.profile_id}
          scrollEnabled={false}
          renderItem={({ item }) => renderMemberRow(item, true)}
        />
      )}
      {isPendingLoading && <ActivityIndicator color={colors.accent} style={styles.loader} />}

      {isInviteOpen ? (
        <View style={styles.inviteSection}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={(text) => {
              setInput(text);
              setInviteError(null);
            }}
            placeholder="Search by handle or name"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            returnKeyType="search"
          />
          {isSearching && <ActivityIndicator color={colors.accent} style={styles.loader} />}
          {query.length > 0 && !isSearching && (
            <FlatList
              data={inviteableResults}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              ListEmptyComponent={<Text style={styles.searchEmpty}>No one found.</Text>}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.row}
                  onPress={() => handleInvite(item)}
                  disabled={invitingId !== null}
                >
                  <Avatar
                    uri={item.avatar_url ? getAvatarUrl(item.avatar_url) : null}
                    displayName={item.display_name}
                    size={40}
                  />
                  <Text style={styles.name} numberOfLines={1}>
                    {item.display_name}
                  </Text>
                  {invitingId === item.id ? (
                    <ActivityIndicator color={colors.textSecondary} />
                  ) : (
                    <Text style={styles.role}>@{item.handle}</Text>
                  )}
                </Pressable>
              )}
            />
          )}
        </View>
      ) : (
        <Pressable style={styles.invitePill} onPress={() => setIsInviteOpen(true)}>
          <Text style={styles.invitePillText}>Invite people</Text>
        </Pressable>
      )}
      {inviteError && <Text style={styles.error}>{inviteError}</Text>}

      {ownMembership && (
        <Pressable
          style={[styles.invitePill, styles.leaveButton, (isLastCoOwner || processingId !== null) && styles.disabled]}
          onPress={() => confirmRemove(ownMembership, false)}
          disabled={isLastCoOwner || processingId !== null}
        >
          {processingId === ownMembership.profile_id ? (
            <ActivityIndicator color={colors.textPrimary} />
          ) : (
            <Text style={styles.invitePillText}>Leave keep</Text>
          )}
        </Pressable>
      )}
    </KeyboardAvoidingScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
  },
  heading: {
    fontFamily: typography.family.serif,
    fontSize: typography.size.xl,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  hint: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  loader: {
    marginTop: spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  name: {
    flex: 1,
    fontSize: typography.size.md,
    fontWeight: typography.weight.medium,
    color: colors.textPrimary,
  },
  role: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
  },
  inviteSection: {
    marginTop: spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xs,
    padding: spacing.md,
    fontSize: typography.size.md,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  searchEmpty: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  invitePill: {
    marginTop: spacing.md,
    borderRadius: radii.pill,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    alignItems: "center",
  },
  invitePillText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },
  error: {
    color: colors.danger,
    marginTop: spacing.sm,
  },
  leaveButton: {
    marginTop: spacing.lg,
  },
  disabled: {
    opacity: 0.4,
  },
});
