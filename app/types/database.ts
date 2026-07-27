// Hand-written row types mirroring supabase/0001_init.sql. Cheap to swap for
// `supabase gen types typescript` later if the schema starts changing often.

export type PrivacyMode = "private" | "public";
export type KeepMemberRole = "owner" | "contributor";
export type KeepMemberStatus = "pending" | "approved";

export interface Profile {
  id: string;
  handle: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Keep {
  id: string;
  owner_id: string;
  title: string;
  cover_photo_url: string | null;
  cover_blurhash: string | null;
  privacy_mode: PrivacyMode;
  hidden_from_profile: boolean;
  is_ongoing: boolean;
  created_at: string;
  updated_at: string;
}

export interface KeepMember {
  keep_id: string;
  profile_id: string;
  role: KeepMemberRole;
  status: KeepMemberStatus;
  hidden_from_profile: boolean;
}

export interface KeepMemberWithProfile extends KeepMember {
  profiles: Pick<Profile, "id" | "display_name" | "handle">;
}

export type KeepFollowStatus = "pending" | "approved";

// Public keeps: rows are always 'approved' (instant follow). Private keeps:
// a row starts 'pending' until the owner approves it — see
// supabase/0004_keep_follow_requests.sql.
export interface KeepFollower {
  keep_id: string;
  profile_id: string;
  status: KeepFollowStatus;
}

export interface KeepFollowerWithProfile extends KeepFollower {
  profiles: Pick<Profile, "id" | "display_name" | "handle">;
}

export interface ProfileFollower {
  profile_id: string;
  follower_id: string;
}

export interface Post {
  id: string;
  keep_id: string;
  author_id: string;
  caption: string | null;
  song_title: string | null;
  song_artist: string | null;
  song_url: string | null;
  location_label: string | null;
  show_in_feed: boolean;
  created_at: string;
}

export type MediaType = "image" | "video";

// media_url is a Storage object path, not a public URL — resolve with
// lib/storage.ts before rendering. See supabase/0001_init.sql for why.
export interface PostMedia {
  id: string;
  post_id: string;
  media_url: string;
  media_type: MediaType;
  position: number;
  blurhash: string | null;
}

export interface PostWithMedia extends Post {
  post_media: PostMedia[];
}

// fetchPostById's shape — the single-post detail view needs the author's
// handle to attribute the caption, unlike the grid-fetching queries
// (fetchPostsForKeep, fetchFavoritedPosts) which don't join profiles.
export interface PostWithMediaAndAuthor extends PostWithMedia {
  profiles: Pick<Profile, "id" | "display_name" | "handle">;
}

export interface Like {
  post_id: string;
  profile_id: string;
  created_at: string;
}

export interface LikeWithProfile extends Like {
  profiles: Pick<Profile, "id" | "display_name" | "handle">;
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  parent_id: string | null;
  body: string;
  created_at: string;
}

export interface CommentWithProfile extends Comment {
  profiles: Pick<Profile, "id" | "display_name" | "handle">;
}
