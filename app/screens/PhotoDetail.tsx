import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Linking,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  RefreshControl,
  StyleSheet,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from "react-native";
import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AppStackParamList } from "../navigation/AppNavigator";
import { useAuth } from "../lib/AuthProvider";
import { fetchPostById, reconcilePostMediaLocation } from "../lib/queries";
import { getSignedMediaUrl } from "../lib/storage";
import { getErrorMessage } from "../lib/errors";
import { SIGNED_URL_QUERY_OPTIONS, signedMediaUrlKey } from "../lib/signedUrlCache";
import LikeRow from "../components/LikeRow";
import CommentThread from "../components/CommentThread";
import CommentComposer from "../components/CommentComposer";
import IconButton from "../components/IconButton";
import CarouselChevron from "../components/CarouselChevron";
import { colors, spacing, radii, typography, iconGlyphFix } from "../theme/tokens";
import type { MediaType } from "../types/database";

type Props = NativeStackScreenProps<AppStackParamList, "PhotoDetail">;

const IMAGE_SIZE = Dimensions.get("window").width;

function VideoCarouselItem({ url, isActive }: { url: string; isActive: boolean }) {
  const player = useVideoPlayer(url, (p) => {
    p.loop = true;
    p.muted = true;
  });
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    if (isActive) {
      player.play();
    } else {
      player.pause();
    }
  }, [player, isActive]);

  const toggleMute = () => {
    const next = !isMuted;
    player.muted = next;
    setIsMuted(next);
  };

  return (
    <Pressable style={styles.image} onPress={toggleMute}>
      <VideoView player={player} style={styles.image} nativeControls={false} contentFit="cover" pointerEvents="none" />
      <View style={styles.muteBadge}>
        <Ionicons name={isMuted ? "volume-mute" : "volume-high"} size={16} color={colors.textInverse} style={iconGlyphFix(16)} />
      </View>
    </Pressable>
  );
}

function CarouselItem({
  mediaPath,
  mediaType,
  isActive,
  blurhash,
}: {
  mediaPath: string;
  mediaType: MediaType;
  isActive: boolean;
  blurhash: string | null;
}) {
  const { data: url } = useQuery({
    queryKey: signedMediaUrlKey(mediaPath),
    queryFn: () => getSignedMediaUrl(mediaPath),
    ...SIGNED_URL_QUERY_OPTIONS,
  });

  if (mediaType === "video") {
    if (!url) return <View style={[styles.image, styles.imagePlaceholder]} />;
    return <VideoCarouselItem url={url} isActive={isActive} />;
  }

  if (!url && !blurhash) {
    return <View style={[styles.image, styles.imagePlaceholder]} />;
  }

  return (
    <Image
      source={url ? { uri: url, cacheKey: mediaPath } : undefined}
      style={styles.image}
      cachePolicy="memory-disk"
      transition={150}
      placeholder={blurhash ? { blurhash } : undefined}
      placeholderContentFit="cover"
    />
  );
}

export default function PhotoDetail({ route, navigation }: Props) {
  const { postId } = route.params;
  const { session } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: post,
    isLoading,
    refetch: refetchPost,
  } = useQuery({
    queryKey: ["post", postId],
    queryFn: () => fetchPostById(postId),
  });

  const isAuthor = !!session && !!post && post.author_id === session.user.id;
  const [activeIndex, setActiveIndex] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Refreshes everything visible on the page, not just the caption — likes
  // and comments are separately-queried child components (LikeRow,
  // CommentThread), so a pull-to-refresh here has to invalidate their keys
  // too or it'd look like only half the page updated.
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchPost(),
        queryClient.invalidateQueries({ queryKey: ["likes", postId] }),
        queryClient.invalidateQueries({ queryKey: ["comments", postId] }),
        session
          ? queryClient.invalidateQueries({ queryKey: ["favorite", postId, session.user.id] })
          : Promise.resolve(),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  }, [refetchPost, queryClient, postId, session]);

  // Self-heal: see KeepDetail.tsx's identical effect + reconcilePostMediaLocation
  // for why a post's media can drift out of sync with its keep_id.
  useEffect(() => {
    if (!post || !isAuthor) return;
    reconcilePostMediaLocation(post)
      .then((fixed) => {
        if (fixed) queryClient.invalidateQueries({ queryKey: ["post", postId] });
      })
      .catch((e) => console.warn(`[reconcile] failed for post ${postId}:`, getErrorMessage(e)));
  }, [post, isAuthor, postId, queryClient]);

  const handleCarouselScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / IMAGE_SIZE);
    setActiveIndex((prev) => (prev === index ? prev : index));
  };

  const showActions = () => {
    Alert.alert("", "", [
      { text: "Edit", onPress: () => navigation.navigate("EditPost", { postId }) },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  useEffect(() => {
    navigation.setOptions({
      headerRight: isAuthor ? () => <IconButton name="ellipsis-horizontal" onPress={showActions} /> : undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation, isAuthor, postId]);

  if (isLoading || !post || !session) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const media = [...post.post_media].sort((a, b) => a.position - b.position);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      >
        <View style={styles.carouselWrap}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleCarouselScroll}
            scrollEventThrottle={16}
          >
            {media.map((item, index) => (
              <CarouselItem
                key={item.id}
                mediaPath={item.media_url}
                mediaType={item.media_type}
                isActive={index === activeIndex}
                blurhash={item.blurhash}
              />
            ))}
          </ScrollView>
          {media.length > 1 && activeIndex > 0 && <CarouselChevron direction="left" />}
          {media.length > 1 && activeIndex < media.length - 1 && <CarouselChevron direction="right" />}
        </View>

        <View style={styles.body}>
          <LikeRow postId={postId} profileId={session.user.id} />

          {(post.caption || post.song_title || post.location_label) && (
            <View style={styles.textBlock}>
              {post.caption && (
                <Text style={styles.caption}>
                  <Text
                    style={styles.captionAuthor}
                    onPress={() => navigation.navigate("PublicProfile", { profileId: post.author_id })}
                  >
                    {post.profiles.display_name}{" "}
                  </Text>
                  {post.caption}
                </Text>
              )}

              {post.song_title && (
                <Pressable
                  style={styles.tile}
                  onPress={() => post.song_url && Linking.openURL(post.song_url)}
                  disabled={!post.song_url}
                >
                  <Text style={styles.tileText}>
                    ♪ {post.song_title}
                    {post.song_artist ? ` — ${post.song_artist}` : ""}
                  </Text>
                </Pressable>
              )}

              {post.location_label && (
                <View style={styles.tile}>
                  <Text style={styles.tileText}>📍 {post.location_label}</Text>
                </View>
              )}
            </View>
          )}

          <View style={styles.divider} />

          <CommentThread postId={postId} />
        </View>
      </ScrollView>

      <CommentComposer postId={postId} profileId={session.user.id} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: spacing.xl,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  image: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    backgroundColor: colors.surface,
  },
  imagePlaceholder: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  carouselWrap: {
    position: "relative",
  },
  muteBadge: {
    position: "absolute",
    right: spacing.sm,
    bottom: spacing.sm,
    width: 28,
    height: 28,
    borderRadius: radii.pill,
    backgroundColor: colors.scrim,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  textBlock: {
    gap: spacing.sm,
  },
  caption: {
    fontSize: typography.size.sm,
    color: colors.textPrimary,
  },
  captionAuthor: {
    fontWeight: typography.weight.bold,
  },
  tile: {
    backgroundColor: colors.surface,
    borderRadius: radii.xs,
    padding: spacing.sm,
  },
  tileText: {
    fontSize: typography.size.sm,
    color: colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
});
