import { File } from "expo-file-system";
import { supabase } from "./supabase";

// media bucket is private — object paths must be resolved to a short-lived
// signed URL before rendering, never stored/rendered as a public URL.
const SIGNED_URL_TTL_SECONDS = 60 * 60;

function extensionOf(uri: string): string {
  return /\.[a-zA-Z0-9]+$/.exec(uri)?.[0] ?? ".jpg";
}

// uploadPostMedia's local file can be an image or a video — File#type reads
// the real MIME type instead of assuming image/jpeg, which would otherwise
// mislabel every uploaded video's Content-Type.
function mimeTypeOf(localUri: string, fallback: string): string {
  return new File(localUri).type || fallback;
}

// Uploads as a FormData body (storage-js only special-cases Blob and
// FormData; a raw Uint8Array body used to come back "successful" from RN's
// networking bridge with no object actually landing in the bucket).
//
// Since Expo SDK 55+, global fetch is expo/fetch, whose FormData encoder
// (expo/src/winter/fetch/convertFormData.ts) does NOT accept RN-style
// {uri, name, type} parts — it throws "Unsupported FormDataPart
// implementation". It does accept any object with a `bytes()` method, so
// the part reads the file via expo-file-system's File#bytes at send time.
async function uploadFile(
  bucket: string,
  path: string,
  localUri: string,
  contentType: string,
  options?: { upsert?: boolean }
): Promise<void> {
  const file = new File(localUri);
  const part = {
    name: path.split("/").pop() ?? "upload",
    type: contentType,
    bytes: () => file.bytes(),
  };
  const form = new FormData();
  form.append("", part as unknown as Blob);
  const { error } = await supabase.storage.from(bucket).upload(path, form, options);
  if (error) throw error;
}

export async function uploadKeepCoverPhoto(keepId: string, localUri: string): Promise<string> {
  const path = `covers/${keepId}/${Date.now()}${extensionOf(localUri)}`;
  await uploadFile("media", path, localUri, mimeTypeOf(localUri, "image/jpeg"));
  return path;
}

export async function uploadPostMedia(
  keepId: string,
  postId: string,
  localUri: string,
  position: number
): Promise<string> {
  const path = `posts/${keepId}/${postId}/${Date.now()}-${position}${extensionOf(localUri)}`;
  await uploadFile("media", path, localUri, mimeTypeOf(localUri, "image/jpeg"));
  return path;
}

// avatars bucket is public — RLS scopes writes to a `{profile_id}/...` path
// matching auth.uid(), but reads need no signing (see supabase/0001_init.sql §4).
export async function uploadAvatarPhoto(profileId: string, localUri: string): Promise<string> {
  const path = `${profileId}/${Date.now()}${extensionOf(localUri)}`;
  await uploadFile("avatars", path, localUri, mimeTypeOf(localUri, "image/jpeg"), { upsert: true });
  return path;
}

// Moving a post to a different keep re-parents posts.keep_id, but the
// physical file still lives under the *old* keep_id in its storage path —
// and storage RLS (supabase/0001_init.sql §4) gates access by the keep_id
// segment in that path, not by joining back to posts.keep_id. So the file
// itself has to move too, or a member of the new keep simply can't see it
// (and, worse, access would still be governed by the old keep's
// membership). Storage .move() renames server-side, no re-upload needed.
export async function movePostMediaFile(oldPath: string, newKeepId: string): Promise<string> {
  const [, , postId, ...rest] = oldPath.split("/");
  const newPath = `posts/${newKeepId}/${postId}/${rest.join("/")}`;

  const { error } = await supabase.storage.from("media").move(oldPath, newPath);
  if (error) throw error;

  return newPath;
}

export function getAvatarUrl(path: string): string {
  return supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
}

// No dedicated "does this object exist" call in the storage API — a signed
// url is the cheapest read that fails distinctly (object-not-found) when it
// doesn't, without actually downloading anything. Used by
// queries.ts#reconcilePostMediaLocation to tell "file already relocated,
// just the DB pointer is stale" (this path exists) apart from "the move
// itself never happened" (it doesn't).
export async function mediaObjectExists(path: string): Promise<boolean> {
  const { error } = await supabase.storage.from("media").createSignedUrl(path, 60);
  return !error;
}

export async function getSignedMediaUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from("media")
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error) {
    // Signing failures were previously swallowed silently by the calling
    // useEffect/useQuery — a tile just stayed a placeholder forever with no
    // way to tell a permission error (e.g. stale keep_id in the path after
    // an interrupted move-to-keep) apart from a slow network. Surface it.
    console.warn(`[storage] failed to sign media url for "${path}":`, error.message);
    throw error;
  }
  return data.signedUrl;
}

// One request for a whole keep's worth of photos instead of one per tile —
// each individual sign is cheap, but on a cold open of a keep you've never
// viewed (nothing cached yet), N parallel round trips to the same endpoint
// still adds real latency over one. Failures are per-path (never throws for
// the whole batch); a path missing from the returned map just falls through
// to PostGridTile's own per-tile fetch as a fallback.
export async function getSignedMediaUrls(paths: string[]): Promise<Record<string, string>> {
  if (paths.length === 0) return {};
  const { data, error } = await supabase.storage.from("media").createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);
  if (error) {
    console.warn("[storage] batch signing failed:", error.message);
    return {};
  }
  const result: Record<string, string> = {};
  for (const entry of data) {
    if (entry.path && entry.signedUrl) {
      result[entry.path] = entry.signedUrl;
    } else {
      console.warn(`[storage] failed to sign media url for "${entry.path}":`, entry.error);
    }
  }
  return result;
}
