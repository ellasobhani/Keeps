-- Makes a `profiles` row (and everything that references it) deletable in
-- one call, so account deletion can be a single client-side delete instead
-- of manually unwinding every table by hand. Every FK pointing at
-- profiles(id) becomes `on delete cascade`; FKs pointing at posts(id)/
-- keeps(id) already cascade from 0001/0003, so deleting a profile's keeps
-- and posts already sweeps their comments/likes/favorites/media with them.
--
-- This does NOT delete the underlying auth.users row — that requires the
-- Supabase service-role/admin API, which must never live in a mobile client.
-- See lib/queries.ts#deleteOwnAccount for what this actually accomplishes.

alter table keeps
  drop constraint keeps_owner_id_fkey,
  add constraint keeps_owner_id_fkey foreign key (owner_id) references profiles(id) on delete cascade;

alter table keep_members
  drop constraint keep_members_profile_id_fkey,
  add constraint keep_members_profile_id_fkey foreign key (profile_id) references profiles(id) on delete cascade;

alter table keep_followers
  drop constraint keep_followers_profile_id_fkey,
  add constraint keep_followers_profile_id_fkey foreign key (profile_id) references profiles(id) on delete cascade;

alter table profile_followers
  drop constraint profile_followers_profile_id_fkey,
  add constraint profile_followers_profile_id_fkey foreign key (profile_id) references profiles(id) on delete cascade,
  drop constraint profile_followers_follower_id_fkey,
  add constraint profile_followers_follower_id_fkey foreign key (follower_id) references profiles(id) on delete cascade;

alter table posts
  drop constraint posts_author_id_fkey,
  add constraint posts_author_id_fkey foreign key (author_id) references profiles(id) on delete cascade;

alter table likes
  drop constraint likes_profile_id_fkey,
  add constraint likes_profile_id_fkey foreign key (profile_id) references profiles(id) on delete cascade;

alter table comments
  drop constraint comments_author_id_fkey,
  add constraint comments_author_id_fkey foreign key (author_id) references profiles(id) on delete cascade;

alter table favorites
  drop constraint favorites_profile_id_fkey,
  add constraint favorites_profile_id_fkey foreign key (profile_id) references profiles(id) on delete cascade;

-- profiles had no delete policy at all (select/insert/update only) — RLS
-- denies by default, so self-deletion needs an explicit grant.
create policy "profiles delete - self" on profiles
  for delete using (id = auth.uid());
