import { View, Text, Pressable, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, radii, typography } from "../theme/tokens";

// Square cover-photo tile shared by CreateKeep and EditKeep. Styled after
// AddPost's photo-picking UX (images-outline empty state, dashed add-tile
// border) rather than a bare box + placeholder text — `uri` stays whatever
// the caller already has on hand (local picker uri or a resolved remote
// signed url), this component only renders it. `cacheKey` is only relevant
// for a remote signed url (see EditKeep, whose signed url rotates while the
// underlying storage path doesn't) — CreateKeep has no use for it.
export default function CoverPhotoPicker({
  uri,
  cacheKey,
  onPress,
}: {
  uri: string | null;
  cacheKey?: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.picker} onPress={onPress}>
      {uri ? (
        <>
          <Image
            source={{ uri, cacheKey }}
            style={styles.image}
            cachePolicy="memory-disk"
          />
          <View style={styles.editBadge}>
            <Ionicons name="camera" size={13} color={colors.textInverse} />
          </View>
        </>
      ) : (
        <View style={styles.empty}>
          <Ionicons name="images-outline" size={40} color={colors.textSecondary} />
          <Text style={styles.emptyText}>Add cover photo</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  picker: {
    aspectRatio: 1,
    borderRadius: radii.none,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
    overflow: "hidden",
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    width: "100%",
    height: "100%",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.border,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: typography.size.md,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  editBadge: {
    position: "absolute",
    bottom: spacing.sm,
    right: spacing.sm,
    width: 24,
    height: 24,
    borderRadius: radii.pill,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
});
