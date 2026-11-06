import { supabase } from "./supabase";
import { mediaObjectExists, movePostMediaFile } from "./storage";
import type {
  Comment,
  CommentWithProfile,
  Keep,
  KeepFollowStatus,
  KeepFollowerWithProfile,
  KeepMember,
  KeepMemberRole,
  KeepMemberStatus,
  KeepMemberWithProfile,
  LikeWithProfile,
  MediaType,
  Post,
  PostMedia,
  PostWithMedia,
  PostWithMediaAndAuthor,
  PrivacyMode,
  Profile,
} from "../types/database";

export async function createProfile(input: {
  id: string;
  handle: string;
  displayName: string;
}): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .insert({ id: input.id, handle: input.handle, display_name: input.displayName })
    .select()
    .single();
  if (error) throw error;
  return data as Profile;
}

export async function updateProfile(
  profileId: string,
  input: { displayName: string; bio: string | null; handle?: string; avatarUrl?: string }
): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: input.displayName,
      bio: input.bio,
      ...(input.handle !== undefined ? { handle: input.handle } : {}),
      ...(input.avatarUrl !== undefined ? { avatar_url: input.avatarUrl } : {}),
    })
    .eq("id", profileId);
  if (error) throw error;
}

// Deletes the profiles row and, via the cascades added in
// supabase/0005_profile_cascade_delete.sql, everything that points at it
// (owned keeps and their posts/media/likes/comments, plus this profile's
// own comments/likes/favorites/follows elsewhere). Does not remove the
// underlying auth.users row — see that migration's header comment for why.
export async function deleteOwnAccount(profileId: string): Promise<void> {
  const { error } = await supabase.from("profiles").delete().eq("id", profileId);
  if (error) throw error;
}

// Both rely entirely on RLS for privacy: keeps' own select policy already
// restricts results to public keeps or ones the caller belongs to, so a
// private keep the caller can't see simply never appears — no extra
// filtering needed here. Profiles are always public per the existing model.
export async function searchKeeps(query: string): Promise<Keep[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const { data, error } = await supabase.from("keeps").select("*").ilike("title", `%${trimmed}%`).limit(20);
  if (error) throw error;
  return data as Keep[];
}

export async function searchProfiles(query: string): Promise<Profile[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .or(`handle.ilike.%${trimmed}%,display_name.ilike.%${trimmed}%`)
    .limit(20);
  if (error) throw error;
  return data as Profile[];
}

export async function fetchProfileById(profileId: string): Promise<Profile> {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", profileId).single();
  if (error) throw error;
  return data as Profile;
}

interface ProfileKeepMembershipRow {
  keeps: Keep | null;
}

// Someone else's profile grid — unlike fetchOwnKeeps, this always excludes
// hidden_from_profile keeps (that's the point of the flag), and relies on
// keeps' own RLS to drop anything the viewer isn't allowed to see: PostgREST
// embeds are a left join, so a private keep the viewer can't access comes
// back as `keeps: null` here rather than being blocked outright.
export async function fetchProfileKeeps(profileId: string): Promise<Keep[]> {
  const { data, error } = await supabase
    .from("keep_members")
    .select("keeps(*)")
    .eq("profile_id", profileId)
    .eq("status", "approved")
    .eq("hidden_from_profile", false)
    .order("updated_at", { foreignTable: "keeps", ascending: false });
  if (error) throw error;
  return (data as unknown as ProfileKeepMembershipRow[])
    .map((row) => row.keeps)
    .filter((keep): keep is Keep => keep !== null)
    // Every row here was already filtered to this member's hidden_from_profile
    // = false, so force it here too rather than trust the stale keeps-level
    // column (dead since Milestone 2's updateKeep stopped writing it) —
    // KeepCoverCard's "hidden" badge is a self-view concept anyway and
    // shouldn't render on someone else's profile.
    .map((keep) => ({ ...keep, hidden_from_profile: false }));
}

// Profile-following stays instant/open (no request step) — see
// supabase/0001_init.sql's profile_followers policies. These three didn't
// exist before because no UI called them yet.
export async function isFollowingProfile(profileId: string, followerId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("profile_followers")
    .select("profile_id")
    .eq("profile_id", profileId)
    .eq("follower_id", followerId)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

export async function followProfile(profileId: string, followerId: string): Promise<void> {
  const { error } = await supabase
    .from("profile_followers")
    .insert({ profile_id: profileId, follower_id: followerId });
  if (error) throw error;
}

export async function unfollowProfile(profileId: string, followerId: string): Promise<void> {
  const { error } = await supabase
    .from("profile_followers")
    .delete()
    .eq("profile_id", profileId)
    .eq("follower_id", followerId);
  if (error) throw error;
}

export interface ProfileFollowerEvent {
  follower_id: string;
  created_at: string;
  profiles: Pick<Profile, "id" | "display_name" | "handle" | "avatar_url">;
}

// Informational only — profile-following stays instant/open (no request
// step), so this is a feed for the Invites tab, not something to approve.
// profile_followers has two FKs into profiles (profile_id, follower_id), so
// the embed needs the constraint name to disambiguate which side to join.
export async function fetchRecentProfileFollowers(profileId: string): Promise<ProfileFollowerEvent[]> {
  const { data, error } = await supabase
    .from("profile_followers")
    .select("follower_id, created_at, profiles!profile_followers_follower_id_fkey(id, display_name, handle, avatar_url)")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  return data as unknown as ProfileFollowerEvent[];
}

export interface ProfileConnection {
  profile_id: string;
  created_at: string;
  profiles: Pick<Profile, "id" | "display_name" | "handle">;
}

// Full followers/following lists for the browsable list screen — unlike
// fetchRecentProfileFollowers (capped at 20, feeds the Invites tab), these
// have no cap since they back a dedicated scrollable list.
export async function fetchProfileFollowersList(profileId: string): Promise<ProfileConnection[]> {
  const { data, error } = await supabase
    .from("profile_followers")
    .select("follower_id, created_at, profiles!profile_followers_follower_id_fkey(id, display_name, handle)")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as unknown as { follower_id: string; created_at: string; profiles: ProfileConnection["profiles"] }[]).map(
    (row) => ({ profile_id: row.follower_id, created_at: row.created_at, profiles: row.profiles })
  );
}

export async function fetchProfileFollowingList(profileId: string): Promise<ProfileConnection[]> {
  const { data, error } = await supabase
    .from("profile_followers")
    .select("profile_id, created_at, profiles!profile_followers_profile_id_fkey(id, display_name, handle)")
    .eq("follower_id", profileId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as unknown as ProfileConnection[];
}

export async function fetchFollowerCount(profileId: string): Promise<number> {
  const { count, error } = await supabase
    .from("profile_followers")
    .select("*", { count: "exact", head: true })
    .eq("profile_id", profileId);
  if (error) throw error;
  return count ?? 0;
}

export async function fetchFollowingCount(profileId: string): Promise<number> {
  const { count, error } = await supabase
    .from("profile_followers")
    .select("*", { count: "exact", head: true })
    .eq("follower_id", profileId);
  if (error) throw error;
  return count ?? 0;
}

interface OwnKeepMembershipRow {
  hidden_from_profile: boolean;
  keeps: Keep;
}

// A profile's own keeps grid: every keep they're an approved co-owner of
// (solo-owned or collaborative). This is always a self-view (there's no
// other-profile grid screen yet), so hidden keeps still appear here — the
// hidden_from_profile on each row is overridden with *this* member's own
// preference (see supabase/0006_collaborative_keeps.sql) rather than the
// old single flag on keeps, so KeepCoverCard's existing "hidden" badge stays
// accurate without needing to change.
export async function fetchOwnKeeps(profileId: string): Promise<Keep[]> {
  const { data, error } = await supabase
    .from("keep_members")
    .select("hidden_from_profile, keeps(*)")
    .eq("profile_id", profileId)
    .eq("status", "approved")
    .order("updated_at", { foreignTable: "keeps", ascending: false });
  if (error) throw error;
  return (data as unknown as OwnKeepMembershipRow[]).map((row) => ({
    ...row.keeps,
    hidden_from_profile: row.hidden_from_profile,
  }));
}

export async function createKeep(input: {
  ownerId: string;
  title: string;
  privacyMode: PrivacyMode;
  hiddenFromProfile?: boolean;
}): Promise<Keep> {
  const { data: keep, error: keepError } = await supabase
    .from("keeps")
    .insert({ owner_id: input.ownerId, title: input.title, privacy_mode: input.privacyMode })
    .select()
    .single();
  if (keepError) throw keepError;

  const { error: memberError } = await supabase.from("keep_members").insert({
    keep_id: keep.id,
    profile_id: input.ownerId,
    role: "owner",
    status: "approved",
    hidden_from_profile: input.hiddenFromProfile ?? false,
  });
  if (memberError) throw memberError;

  return keep as Keep;
}

// hiddenFromProfile writes to the caller's own keep_members row, not the
// keeps row — see fetchOwnKeeps above for why it's per-member now.
export async function updateKeep(
  keepId: string,
  profileId: string,
  input: { title: string; privacyMode: PrivacyMode; hiddenFromProfile: boolean }
): Promise<void> {
  const { error: keepError } = await supabase
    .from("keeps")
    .update({ title: input.title, privacy_mode: input.privacyMode })
    .eq("id", keepId);
  if (keepError) throw keepError;

  const { error: memberError } = await supabase
    .from("keep_members")
    .update({ hidden_from_profile: input.hiddenFromProfile })
    .eq("keep_id", keepId)
    .eq("profile_id", profileId);
  if (memberError) throw memberError;
}

// Only the owner can do this — see "keeps delete - owner" RLS policy.
// keep_members/posts (and everything cascading from posts: post_media,
// likes, comments, favorites) all reference keeps(id) on delete cascade,
// so this one call is enough to unwind the whole keep.
export async function deleteKeep(keepId: string): Promise<void> {
  const { error } = await supabase.from("keeps").delete().eq("id", keepId);
  if (error) throw error;
}

export async function updateKeepCoverPhoto(
  keepId: string,
  coverPhotoPath: string,
  coverBlurhash: string | null
): Promise<void> {
  const { error } = await supabase
    .from("keeps")
    .update({ cover_photo_url: coverPhotoPath, cover_blurhash: coverBlurhash })
    .eq("id", keepId);
  if (error) throw error;
}

export async function fetchKeepById(keepId: string): Promise<Keep> {
  const { data, error } = await supabase.from("keeps").select("*").eq("id", keepId).single();
  if (error) throw error;
  return data as Keep;
}

export async function fetchKeepMembership(
  keepId: string,
  profileId: string
): Promise<{ role: KeepMemberRole; status: KeepMemberStatus; hidden_from_profile: boolean } | null> {
  const { data, error } = await supabase
    .from("keep_members")
    .select("role, status, hidden_from_profile")
    .eq("keep_id", keepId)
    .eq("profile_id", profileId)
    .maybeSingle();
  if (error) throw error;
  return data as { role: KeepMemberRole; status: KeepMemberStatus; hidden_from_profile: boolean } | null;
}

// Co-owners: approved keep_members rows, excluding pending invites.
export async function fetchKeepCoOwners(keepId: string): Promise<KeepMemberWithProfile[]> {
  const { data, error } = await supabase
    .from("keep_members")
    .select("*, profiles(id, display_name, handle, avatar_url)")
    .eq("keep_id", keepId)
    .eq("status", "approved");
  if (error) throw error;
  return data as KeepMemberWithProfile[];
}

// Pending invites *sent* for a keep — shown to its co-owners.
export async function fetchPendingCoOwnerInvites(keepId: string): Promise<KeepMemberWithProfile[]> {
  const { data, error } = await supabase
    .from("keep_members")
    .select("*, profiles(id, display_name, handle)")
    .eq("keep_id", keepId)
    .eq("status", "pending");
  if (error) throw error;
  return data as KeepMemberWithProfile[];
}

export interface PendingInviteWithKeep extends KeepMember {
  // Nullable: PostgREST embeds are a left join, so this comes back null if
  // RLS denies the keeps row for any reason (e.g. against an unmigrated
  // database, or the keep having been deleted in a race) — see
  // supabase/0009_pending_invite_keep_visibility.sql.
  keeps: Pick<Keep, "id" | "title"> | null;
}

// Pending invites *addressed to* a profile, across every keep — shown to the invitee.
export async function fetchMyPendingCoOwnerInvites(profileId: string): Promise<PendingInviteWithKeep[]> {
  const { data, error } = await supabase
    .from("keep_members")
    .select("*, keeps(id, title)")
    .eq("profile_id", profileId)
    .eq("status", "pending");
  if (error) throw error;
  return data as unknown as PendingInviteWithKeep[];
}

export async function inviteCoOwner(keepId: string, profileId: string): Promise<void> {
  const { error } = await supabase
    .from("keep_members")
    .insert({ keep_id: keepId, profile_id: profileId, status: "pending" });
  if (error) throw error;
}

export async function acceptCoOwnerInvite(keepId: string, profileId: string): Promise<void> {
  const { error } = await supabase
    .from("keep_members")
    .update({ status: "approved" })
    .eq("keep_id", keepId)
    .eq("profile_id", profileId);
  if (error) throw error;
}

// Also covers declining an invite (self) and removing a co-owner (any
// existing co-owner can remove any row) — same delete, different actor, per
// the "fully equal" rights model in supabase/0006_collaborative_keeps.sql.
export async function removeCoOwner(keepId: string, profileId: string): Promise<void> {
  const { error } = await supabase
    .from("keep_members")
    .delete()
    .eq("keep_id", keepId)
    .eq("profile_id", profileId);
  if (error) throw error;
}

// Keep-following (see supabase/0004_keep_follow_requests.sql): public keeps
// are instant-follow ('approved'); private keeps start 'pending' until the
// owner approves. Profile-following has no such request step — it's always
// instant, handled separately below.
export async function fetchKeepFollowStatus(
  keepId: string,
  profileId: string
): Promise<KeepFollowStatus | null> {
  const { data, error } = await supabase
    .from("keep_followers")
    .select("status")
    .eq("keep_id", keepId)
    .eq("profile_id", profileId)
    .maybeSingle();
  if (error) throw error;
  return (data as { status: KeepFollowStatus } | null)?.status ?? null;
}

export async function followKeep(keepId: string, profileId: string, isPublic: boolean): Promise<void> {
  const { error } = await supabase
    .from("keep_followers")
    .insert({ keep_id: keepId, profile_id: profileId, status: isPublic ? "approved" : "pending" });
  if (error) throw error;
}

// Also used by a keep owner to decline a pending request — same row, same
// delete, different actor (RLS allows both self and the keep's owner).
export async function unfollowKeep(keepId: string, profileId: string): Promise<void> {
  const { error } = await supabase
    .from("keep_followers")
    .delete()
    .eq("keep_id", keepId)
    .eq("profile_id", profileId);
  if (error) throw error;
}

export async function fetchPendingFollowRequests(keepId: string): Promise<KeepFollowerWithProfile[]> {
  const { data, error } = await supabase
    .from("keep_followers")
    .select("*, profiles(id, display_name, handle)")
    .eq("keep_id", keepId)
    .eq("status", "pending");
  if (error) throw error;
  return data as KeepFollowerWithProfile[];
}

export interface KeepFollowRequestSummary {
  keep_id: string;
  keep_title: string;
  pending_count: number;
}

interface PendingFollowerRow {
  keep_id: string;
  keeps: Pick<Keep, "title">;
}

// Aggregated across every keep the caller co-owns, for the Invites tab
// (Milestone 9 of collaborative_keeps_plan.md) — one summary row per keep
// with a pending count, rather than duplicating FollowRequests.tsx's
// approve/decline UI inline. Two round trips (my keeps, then their pending
// followers) since there's no Postgres function to do this join RLS-safely
// in one client call; fine at this scale.
export async function fetchPendingFollowRequestsForOwnKeeps(profileId: string): Promise<KeepFollowRequestSummary[]> {
  const { data: memberships, error: membershipError } = await supabase
    .from("keep_members")
    .select("keep_id")
    .eq("profile_id", profileId)
    .eq("status", "approved");
  if (membershipError) throw membershipError;

  const keepIds = (memberships as { keep_id: string }[]).map((m) => m.keep_id);
  if (keepIds.length === 0) return [];

  const { data, error } = await supabase
    .from("keep_followers")
    .select("keep_id, keeps(title)")
    .in("keep_id", keepIds)
    .eq("status", "pending");
  if (error) throw error;

  const counts = new Map<string, KeepFollowRequestSummary>();
  for (const row of data as unknown as PendingFollowerRow[]) {
    const existing = counts.get(row.keep_id);
    if (existing) {
      existing.pending_count += 1;
    } else {
      counts.set(row.keep_id, { keep_id: row.keep_id, keep_title: row.keeps.title, pending_count: 1 });
    }
  }
  return Array.from(counts.values());
}

export async function approveFollowRequest(keepId: string, profileId: string): Promise<void> {
  const { error } = await supabase
    .from("keep_followers")
    .update({ status: "approved" })
    .eq("keep_id", keepId)
    .eq("profile_id", profileId);
  if (error) throw error;
}

export async function fetchPostsForKeep(keepId: string): Promise<PostWithMedia[]> {
  const { data, error } = await supabase
    .from("posts")
    .select("*, post_media(*)")
    .eq("keep_id", keepId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as PostWithMedia[];
}

export interface FeedPost extends PostWithMedia {
  profiles: Pick<Profile, "id" | "display_name" | "handle" | "avatar_url">;
  keeps: Pick<Keep, "id" | "title">;
}

interface FeedKeepIdRow {
  keep_id: string;
}

// "mine" is keeps the caller co-owns; "all" adds in approved-follow keeps
// on top of that — the toggle above the Feed list.
export type FeedScope = "mine" | "all";

// Feed scope: keeps the caller is an approved co-owner of, or (when scope is
// "all") an approved follower of too — pending follows/invites don't count,
// deliberately narrower than profile_followers, per the Feed tab's spec.
// show_in_feed lets a poster opt a post out (0014_post_feed_visibility.sql)
// without hiding it from the keep page itself, and author_id is excluded
// since you already saw your own post the moment you made it. `since` is a
// device-local "last seen" cursor (see lib/feedSeen.ts) — omit it for a
// first-ever fetch.
export async function fetchFeed(
  profileId: string,
  since: string | null,
  scope: FeedScope = "all"
): Promise<FeedPost[]> {
  const [membershipsRes, followsRes] = await Promise.all([
    supabase.from("keep_members").select("keep_id").eq("profile_id", profileId).eq("status", "approved"),
    supabase.from("keep_followers").select("keep_id").eq("profile_id", profileId).eq("status", "approved"),
  ]);
  if (membershipsRes.error) throw membershipsRes.error;
  if (followsRes.error) throw followsRes.error;

  const membershipIds = (membershipsRes.data as FeedKeepIdRow[]).map((row) => row.keep_id);
  const keepIds =
    scope === "mine"
      ? membershipIds
      : Array.from(new Set([...membershipIds, ...(followsRes.data as FeedKeepIdRow[]).map((row) => row.keep_id)]));
  if (keepIds.length === 0) return [];

  let query = supabase
    .from("posts")
    // Same ambiguous-embed fix as fetchPostById — posts has three
    // relationships to profiles, so the FK must be named explicitly.
    .select(
      "*, post_media(*), profiles!posts_author_id_fkey(id, display_name, handle, avatar_url), keeps(id, title)"
    )
    .in("keep_id", keepIds)
    .eq("show_in_feed", true)
    .neq("author_id", profileId)
    .order("created_at", { ascending: false });
  if (since) query = query.gt("created_at", since);

  const { data, error } = await query;
  if (error) throw error;
  return data as unknown as FeedPost[];
}

export async function createPost(input: {
  keepId: string;
  authorId: string;
  caption: string | null;
  songTitle: string | null;
  songArtist: string | null;
  songUrl: string | null;
  locationLabel: string | null;
  showInFeed: boolean;
}): Promise<Post> {
  const { data, error } = await supabase
    .from("posts")
    .insert({
      keep_id: input.keepId,
      author_id: input.authorId,
      caption: input.caption,
      song_title: input.songTitle,
      song_artist: input.songArtist,
      song_url: input.songUrl,
      location_label: input.locationLabel,
      show_in_feed: input.showInFeed,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Post;
}

export async function updatePost(
  postId: string,
  input: {
    caption: string | null;
    songTitle: string | null;
    songArtist: string | null;
    songUrl: string | null;
    locationLabel: string | null;
    showInFeed: boolean;
  }
): Promise<void> {
  const { error } = await supabase
    .from("posts")
    .update({
      caption: input.caption,
      song_title: input.songTitle,
      song_artist: input.songArtist,
      song_url: input.songUrl,
      location_label: input.locationLabel,
      show_in_feed: input.showInFeed,
    })
    .eq("id", postId);
  if (error) throw error;
}

export async function deletePost(postId: string): Promise<void> {
  const { error } = await supabase.from("posts").delete().eq("id", postId);
  if (error) throw error;
}

// The keep_id half of a move — see storage.ts#movePostMediaFile for why the
// underlying files also have to physically relocate, not just this column.
// RLS (0008) requires the caller to be an approved member of newKeepId.
export async function movePostToKeep(postId: string, newKeepId: string): Promise<void> {
  const { error } = await supabase.from("posts").update({ keep_id: newKeepId }).eq("id", postId);
  if (error) throw error;
}

export async function updatePostMediaUrl(
  mediaId: string,
  mediaUrl: string,
  blurhash?: string | null
): Promise<void> {
  const { data, error } = await supabase
    .from("post_media")
    .update(blurhash === undefined ? { media_url: mediaUrl } : { media_url: mediaUrl, blurhash })
    .eq("id", mediaId)
    .select("id");
  if (error) throw error;
  // RLS filtering an update down to zero matching rows returns success with
  // no error, not a thrown one (see supabase/0011_post_media_update_policy.sql
  // for how that silently broke photos after every move-to-keep). Fail loudly
  // instead of pretending the write happened.
  if (!data || data.length === 0) {
    throw new Error(`updatePostMediaUrl: no post_media row updated for id ${mediaId}`);
  }
}

// A post's media file always lives at posts/{keepId}/{postId}/{filename} —
// the keepId segment must match the post's own keep_id. It only drifts out
// of sync if a move-to-keep (MoveToKeep.tsx) gets interrupted mid-operation
// (app backgrounded, network drop) between relocating a file and recording
// its new path, since posts.keep_id only flips once every media item's move
// has succeeded. supabase/0011_post_media_update_policy.sql closed the one
// bug that made this happen on *every* move; this is the backstop for the
// rare case of a genuine interruption, so a stuck post repairs itself the
// next time its author views it instead of staying broken until someone
// notices and manually digs through storage. Treats post.keep_id as the
// source of truth: if the file already made it to that keep's folder (the
// DB pointer just never got updated — exactly what 0011 fixed), only the
// pointer needs fixing; otherwise the move itself never completed, so redo
// it. Returns whether anything needed fixing, so callers know to refetch.
export async function reconcilePostMediaLocation(post: PostWithMedia): Promise<boolean> {
  let fixedAny = false;
  for (const media of post.post_media) {
    const segments = media.media_url.split("/");
    if (segments[1] === post.keep_id) continue;

    const expectedPath = [segments[0], post.keep_id, ...segments.slice(2)].join("/");
    const newPath = (await mediaObjectExists(expectedPath))
      ? expectedPath
      : await movePostMediaFile(media.media_url, post.keep_id);
    await updatePostMediaUrl(media.id, newPath);
    fixedAny = true;
  }
  return fixedAny;
}

export async function deletePostMedia(mediaId: string): Promise<void> {
  const { data, error } = await supabase.from("post_media").delete().eq("id", mediaId).select("id");
  if (error) throw error;
  // Same silent-zero-rows trap as updatePostMediaUrl/reorderPostMedia.
  if (!data || data.length === 0) {
    throw new Error(`deletePostMedia: no post_media row deleted for id ${mediaId}`);
  }
}

export async function addPostMedia(
  postId: string,
  mediaUrl: string,
  position: number,
  mediaType: MediaType,
  blurhash: string | null
): Promise<PostMedia> {
  const { data, error } = await supabase
    .from("post_media")
    .insert({ post_id: postId, media_url: mediaUrl, position, media_type: mediaType, blurhash })
    .select()
    .single();
  if (error) throw error;
  return data as PostMedia;
}

// Persists a new drag-reordered sequence for a post's media — position is
// zero-based, same as at upload time (addPostMedia). Every consumer that
// picks a "cover" thumbnail (PostGridTile via fetchPostsForKeep,
// fetchPostsForKeepPrewarmed's batch-signing) sorts by this column, so
// reordering can also change which photo represents the post in a keep's
// grid.
export async function reorderPostMedia(orderedMediaIds: string[]): Promise<void> {
  const results = await Promise.all(
    orderedMediaIds.map((id, position) =>
      supabase.from("post_media").update({ position }).eq("id", id).select("id")
    )
  );
  const failed = results.find((result) => result.error);
  if (failed?.error) throw failed.error;
  // Same RLS-filtered-to-zero-rows trap updatePostMediaUrl guards against
  // (see supabase/0011_post_media_update_policy.sql) — a matching id that
  // isn't actually reorderable under RLS updates nothing and reports
  // success, so the drag looks like it saved but silently didn't.
  const noRowsUpdated = results.some((result) => !result.data || result.data.length === 0);
  if (noRowsUpdated) {
    throw new Error("reorderPostMedia: one or more post_media rows failed to update");
  }
}

export async function fetchPostById(postId: string): Promise<PostWithMediaAndAuthor> {
  const { data, error } = await supabase
    .from("posts")
    // posts has three relationships to profiles (author_id, plus
    // many-to-many through likes and favorites) — PostgREST can't infer
    // which one a bare `profiles(...)` means and errors with PGRST201, so
    // the FK name must be spelled out here.
    .select("*, post_media(*), profiles!posts_author_id_fkey(id, display_name, handle)")
    .eq("id", postId)
    .single();
  if (error) throw error;
  return data as PostWithMediaAndAuthor;
}

export async function fetchLikesForPost(postId: string): Promise<LikeWithProfile[]> {
  const { data, error } = await supabase
    .from("likes")
    .select("*, profiles(id, display_name, handle)")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data as LikeWithProfile[];
}

export async function likePost(postId: string, profileId: string): Promise<void> {
  const { error } = await supabase.from("likes").insert({ post_id: postId, profile_id: profileId });
  if (error) throw error;
}

export async function unlikePost(postId: string, profileId: string): Promise<void> {
  const { error } = await supabase
    .from("likes")
    .delete()
    .eq("post_id", postId)
    .eq("profile_id", profileId);
  if (error) throw error;
}

// Flat comments only for MVP private keeps — parent_id stays null (see spec §3).
export async function fetchCommentsForPost(postId: string): Promise<CommentWithProfile[]> {
  const { data, error } = await supabase
    .from("comments")
    .select("*, profiles(id, display_name, handle)")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data as CommentWithProfile[];
}

export async function addComment(input: {
  postId: string;
  authorId: string;
  body: string;
}): Promise<Comment> {
  const { data, error } = await supabase
    .from("comments")
    .insert({ post_id: input.postId, author_id: input.authorId, body: input.body })
    .select()
    .single();
  if (error) throw error;
  return data as Comment;
}

export type PostNotification =
  | {
      id: string;
      type: "like";
      createdAt: string;
      postId: string;
      actor: Pick<Profile, "id" | "display_name" | "handle" | "avatar_url">;
    }
  | {
      id: string;
      type: "comment";
      createdAt: string;
      postId: string;
      actor: Pick<Profile, "id" | "display_name" | "handle" | "avatar_url">;
      commentBody: string;
    };

interface LikeNotificationRow {
  post_id: string;
  profile_id: string;
  created_at: string;
  profiles: Pick<Profile, "id" | "display_name" | "handle" | "avatar_url">;
}

interface CommentNotificationRow {
  id: string;
  post_id: string;
  author_id: string;
  body: string;
  created_at: string;
  profiles: Pick<Profile, "id" | "display_name" | "handle" | "avatar_url">;
}

// Likes/comments on posts I authored, newest first — the `posts!inner(...)`
// hint is required for the `.eq("posts.author_id", ...)` filter to drop
// non-matching top-level rows rather than just nulling out the embed.
export async function fetchNotificationsForProfile(profileId: string): Promise<PostNotification[]> {
  const [likesRes, commentsRes] = await Promise.all([
    supabase
      .from("likes")
      .select("post_id, profile_id, created_at, profiles(id, display_name, handle, avatar_url), posts!inner(author_id)")
      .eq("posts.author_id", profileId),
    supabase
      .from("comments")
      .select(
        "id, post_id, author_id, body, created_at, profiles(id, display_name, handle, avatar_url), posts!inner(author_id)"
      )
      .eq("posts.author_id", profileId),
  ]);
  if (likesRes.error) throw likesRes.error;
  if (commentsRes.error) throw commentsRes.error;

  const likeNotifications: PostNotification[] = (likesRes.data as unknown as LikeNotificationRow[])
    .filter((row) => row.profile_id !== profileId)
    .map((row) => ({
      id: `like-${row.post_id}-${row.profile_id}`,
      type: "like",
      createdAt: row.created_at,
      postId: row.post_id,
      actor: row.profiles,
    }));

  const commentNotifications: PostNotification[] = (commentsRes.data as unknown as CommentNotificationRow[])
    .filter((row) => row.author_id !== profileId)
    .map((row) => ({
      id: `comment-${row.id}`,
      type: "comment",
      createdAt: row.created_at,
      postId: row.post_id,
      actor: row.profiles,
      commentBody: row.body,
    }));

  return [...likeNotifications, ...commentNotifications].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

// Favorites are a private bookmark (see supabase/0003_favorites.sql) — unlike
// likes, never shown to anyone but the profile that saved the post.
export async function fetchIsFavorited(postId: string, profileId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("favorites")
    .select("post_id")
    .eq("post_id", postId)
    .eq("profile_id", profileId)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

export async function favoritePost(postId: string, profileId: string): Promise<void> {
  const { error } = await supabase.from("favorites").insert({ post_id: postId, profile_id: profileId });
  if (error) throw error;
}

export async function unfavoritePost(postId: string, profileId: string): Promise<void> {
  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("post_id", postId)
    .eq("profile_id", profileId);
  if (error) throw error;
}

interface FavoritedPostRow {
  posts: PostWithMedia;
}

export async function fetchFavoritedPosts(profileId: string): Promise<PostWithMedia[]> {
  const { data, error } = await supabase
    .from("favorites")
    .select("created_at, posts(*, post_media(*))")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as unknown as FavoritedPostRow[]).map((row) => row.posts);
}
