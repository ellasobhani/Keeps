import type { QueryClient } from "@tanstack/react-query";
import { fetchPostsForKeep } from "./queries";
import { getSignedMediaUrls } from "./storage";
import type { PostWithMedia } from "../types/database";

// Signed media URLs carry a rotating token, but the underlying photo/video
// doesn't change — so react-query can safely treat a signed URL as fresh
// for most of its TTL (getSignedMediaUrl signs for SIGNED_URL_TTL_SECONDS =
// 1hr, see storage.ts) and keep it around long after that if nothing asks
// for it, rather than every mount (a FlatList tile scrolling on/off-screen,
// navigating back to a screen) re-signing from scratch.
export const SIGNED_URL_QUERY_OPTIONS = {
  staleTime: 50 * 60 * 1000,
  gcTime: 24 * 60 * 60 * 1000,
  // A signing failure means the object doesn't exist in Storage (a stale
  // db pointer — see reconcilePostMediaLocation for the post_media
  // equivalent) — retrying won't make it reappear, just re-logs the same
  // warning up to 4x (react-query's default retry count) for nothing.
  retry: false,
} as const;

export function signedMediaUrlKey(path: string) {
  return ["signedMediaUrl", path] as const;
}

export function postsForKeepKey(keepId: string) {
  return ["posts", keepId] as const;
}

// Loads a keep's posts and, in the same round trip, batch-signs every grid
// tile's photo (see storage.ts#getSignedMediaUrls) and seeds each one
// straight into the signedMediaUrl cache — by the time PostGridTile's own
// useQuery runs for a given path, this has usually already populated it, so
// the tile's own fetch is a cache hit instead of a second network call.
// Also what Profile.tsx prefetches on card press-in, so opening a keep you
// just touched already has both its post list and photo urls warm.
export async function fetchPostsForKeepPrewarmed(
  keepId: string,
  queryClient: QueryClient
): Promise<PostWithMedia[]> {
  const posts = await fetchPostsForKeep(keepId);

  const paths = posts
    .filter((post) => post.post_media.length > 0)
    .map((post) => [...post.post_media].sort((a, b) => a.position - b.position)[0].media_url);

  if (paths.length > 0) {
    const urlMap = await getSignedMediaUrls(paths);
    for (const [path, url] of Object.entries(urlMap)) {
      queryClient.setQueryData(signedMediaUrlKey(path), url);
    }
  }

  return posts;
}
