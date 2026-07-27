import { useState } from "react";
import { View, TextInput, Pressable, Text, ActivityIndicator, StyleSheet } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { addComment } from "../lib/queries";
import { colors, spacing, radii, typography } from "../theme/tokens";

// Pinned above the keyboard as a screen-level footer (see PhotoDetail) rather
// than scrolled with the comment list — scrolling this along with content is
// what made it hard to see/select text while the keyboard was up.
export default function CommentComposer({ postId, profileId }: { postId: string; profileId: string }) {
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const [body, setBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmed = body.trim();
    if (!trimmed || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await addComment({ postId, authorId: profileId, body: trimmed });
      setBody("");
      await queryClient.invalidateQueries({ queryKey: ["comments", postId] });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.row, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      <TextInput
        style={styles.input}
        value={body}
        onChangeText={(text) => {
          if (text.length > body.length && text.endsWith("\n")) {
            handleSubmit();
            return;
          }
          setBody(text);
        }}
        placeholder="Add a comment..."
        placeholderTextColor={colors.textSecondary}
        multiline
        returnKeyType="send"
        contextMenuHidden={false}
      />
      <Pressable
        style={[styles.sendButton, (!body.trim() || isSubmitting) && styles.sendButtonDisabled]}
        onPress={handleSubmit}
        disabled={!body.trim() || isSubmitting}
        hitSlop={8}
      >
        {isSubmitting ? (
          <ActivityIndicator size="small" color={colors.accent} />
        ) : (
          <Text style={styles.sendButtonText}>Post</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.size.sm,
    color: colors.textPrimary,
    maxHeight: 100,
  },
  sendButton: {
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.xs,
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  sendButtonText: {
    color: colors.accent,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    letterSpacing: typography.letterSpacing.wide,
    textTransform: "uppercase",
  },
});
