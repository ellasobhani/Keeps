import { useCallback, useEffect, useState } from "react";
import { View, Text, TextInput, FlatList, Pressable, ActivityIndicator, RefreshControl, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AppStackParamList } from "../navigation/AppNavigator";
import { searchKeeps, searchProfiles } from "../lib/queries";
import { getAvatarUrl } from "../lib/storage";
import Avatar from "../components/Avatar";
import BottomNavBar from "../components/BottomNavBar";
import { colors, spacing, radii, typography } from "../theme/tokens";
import type { Keep, Profile } from "../types/database";

type Props = NativeStackScreenProps<AppStackParamList, "Search">;

export default function Search({ navigation }: Props) {
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");

  // Simple debounce — no search-as-you-type flood of requests.
  useEffect(() => {
    const timeout = setTimeout(() => setQuery(input.trim()), 300);
    return () => clearTimeout(timeout);
  }, [input]);

  const {
    data: keeps = [],
    isLoading: isKeepsLoading,
    refetch: refetchKeeps,
  } = useQuery({
    queryKey: ["searchKeeps", query],
    enabled: query.length > 0,
    queryFn: () => searchKeeps(query),
  });

  const {
    data: profiles = [],
    isLoading: isProfilesLoading,
    refetch: refetchProfiles,
  } = useQuery({
    queryKey: ["searchProfiles", query],
    enabled: query.length > 0,
    queryFn: () => searchProfiles(query),
  });

  const isLoading = isKeepsLoading || isProfilesLoading;
  const [isRefreshing, setIsRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refetchKeeps(), refetchProfiles()]);
    } finally {
      setIsRefreshing(false);
    }
  }, [refetchKeeps, refetchProfiles]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.textSecondary} />
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Search keeps and people"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
        </View>

        {query.length === 0 && <Text style={styles.empty}>Search for a keep or a handle.</Text>}
        {isLoading && <ActivityIndicator color={colors.accent} style={styles.loader} />}

        {query.length > 0 && !isLoading && (
        <FlatList
          style={styles.list}
          data={[
            ...(keeps.length > 0 ? [{ type: "keepsHeader" as const }] : []),
            ...keeps.map((keep) => ({ type: "keep" as const, keep })),
            ...(profiles.length > 0 ? [{ type: "profilesHeader" as const }] : []),
            ...profiles.map((profile) => ({ type: "profile" as const, profile })),
          ]}
          keyExtractor={(item, index) =>
            item.type === "keep" ? `keep-${item.keep.id}` : item.type === "profile" ? `profile-${item.profile.id}` : `${item.type}-${index}`
          }
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.accent} />
          }
          ListEmptyComponent={
            keeps.length === 0 && profiles.length === 0 ? (
              <Text style={styles.empty}>No results for "{query}".</Text>
            ) : null
          }
          renderItem={({ item }) => {
            if (item.type === "keepsHeader") return <Text style={styles.sectionLabel}>Keeps</Text>;
            if (item.type === "profilesHeader") return <Text style={styles.sectionLabel}>People</Text>;
            if (item.type === "keep") {
              const keep: Keep = item.keep;
              return (
                <Pressable
                  style={styles.row}
                  onPress={() => navigation.navigate("KeepDetail", { keepId: keep.id })}
                >
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {keep.title}
                  </Text>
                  <Ionicons
                    name={keep.privacy_mode === "private" ? "lock-closed" : "globe-outline"}
                    size={14}
                    color={colors.textSecondary}
                  />
                </Pressable>
              );
            }
            const profile: Profile = item.profile;
            return (
              <Pressable
                style={styles.row}
                onPress={() => navigation.navigate("PublicProfile", { profileId: profile.id })}
              >
                <View style={styles.profileRow}>
                  <Avatar
                    uri={profile.avatar_url ? getAvatarUrl(profile.avatar_url) : null}
                    displayName={profile.display_name}
                    size={32}
                  />
                  <View>
                    <Text style={styles.rowTitle}>{profile.display_name}</Text>
                    <Text style={styles.rowSubtitle}>@{profile.handle}</Text>
                  </View>
                </View>
              </Pressable>
            );
          }}
        />
        )}
      </View>
      <BottomNavBar active="search" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xs,
    paddingHorizontal: spacing.md,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: typography.size.md,
    color: colors.textPrimary,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingTop: spacing.md,
  },
  sectionLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.textSecondary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  rowTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.medium,
    color: colors.textPrimary,
  },
  rowSubtitle: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    marginTop: 2,
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
