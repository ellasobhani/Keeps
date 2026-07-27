-- Keep-level follow requests. Profile-following stays instant and open to
-- anyone (unchanged, see profile_followers below). Keep-following is what
-- changes: public keeps stay instant-follow, but following a *private* keep
-- now creates a pending request the keep owner must approve before that
-- follower gains read access to the keep's posts.
--
-- keep_followers previously only supported public keeps (app layer refused
-- private follows outright, per the original comment in 0001). This makes
-- that a real, enforced state instead of an app-layer convention.

alter table keep_followers
  add column status text not null default 'approved' check (status in ('pending', 'approved'));

-- ============================================================
-- Helper: mirrors is_keep_member/keep_is_public in 0001 — a single place
-- every visibility policy below can check "is this an approved follower."
-- ============================================================

create or replace function is_approved_keep_follower(p_keep_id uuid, p_profile_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from keep_followers
    where keep_id = p_keep_id and profile_id = p_profile_id and status = 'approved'
  );
$$;

-- ============================================================
-- keep_followers: replace the old public-keeps-only policies. Insert now
-- allows private keeps too, but only as a 'pending' row — only the owner
-- can flip a row to 'approved' (there's no self-approval path). Delete
-- covers both self (cancel a request / unfollow) and the owner (decline a
-- request / remove a follower).
-- ============================================================

drop policy if exists "keep_followers select" on keep_followers;
create policy "keep_followers select" on keep_followers
  for select using (
    keep_is_public(keep_id) or profile_id = auth.uid() or is_keep_owner(keep_id, auth.uid())
  );

drop policy if exists "keep_followers insert - self" on keep_followers;
create policy "keep_followers insert - self" on keep_followers
  for insert with check (
    profile_id = auth.uid()
    and (
      (keep_is_public(keep_id) and status = 'approved')
      or (not keep_is_public(keep_id) and status = 'pending')
    )
  );

create policy "keep_followers update - owner approves" on keep_followers
  for update using (is_keep_owner(keep_id, auth.uid()))
  with check (is_keep_owner(keep_id, auth.uid()));

drop policy if exists "keep_followers delete - self" on keep_followers;
create policy "keep_followers delete - self or owner" on keep_followers
  for delete using (profile_id = auth.uid() or is_keep_owner(keep_id, auth.uid()));

-- ============================================================
-- Visibility: approved followers of a private keep can now read it and its
-- posts/media/likes/comments, same as a member — but (per the existing
-- "contribution rights are separate from visibility" comment in 0001) they
-- still can't write posts/likes/comments, so the insert policies on those
-- tables are untouched.
-- ============================================================

drop policy if exists "keeps select - public or member" on keeps;
create policy "keeps select - public or member" on keeps
  for select using (
    privacy_mode = 'public'
    or owner_id = auth.uid()
    or is_keep_member(id, auth.uid())
    or is_approved_keep_follower(id, auth.uid())
  );

drop policy if exists "posts select - public or member" on posts;
create policy "posts select - public or member" on posts
  for select using (
    keep_is_public(keep_id)
    or is_keep_member(keep_id, auth.uid())
    or is_approved_keep_follower(keep_id, auth.uid())
  );

drop policy if exists "post_media select - via post" on post_media;
create policy "post_media select - via post" on post_media
  for select using (
    exists (
      select 1 from posts p
      where p.id = post_media.post_id
      and (
        keep_is_public(p.keep_id)
        or is_keep_member(p.keep_id, auth.uid())
        or is_approved_keep_follower(p.keep_id, auth.uid())
      )
    )
  );

drop policy if exists "likes select - via post" on likes;
create policy "likes select - via post" on likes
  for select using (
    exists (
      select 1 from posts p
      where p.id = likes.post_id
      and (
        keep_is_public(p.keep_id)
        or is_keep_member(p.keep_id, auth.uid())
        or is_approved_keep_follower(p.keep_id, auth.uid())
      )
    )
  );

drop policy if exists "comments select - via post" on comments;
create policy "comments select - via post" on comments
  for select using (
    exists (
      select 1 from posts p
      where p.id = comments.post_id
      and (
        keep_is_public(p.keep_id)
        or is_keep_member(p.keep_id, auth.uid())
        or is_approved_keep_follower(p.keep_id, auth.uid())
      )
    )
  );

drop policy if exists "media read - public or member" on storage.objects;
create policy "media read - public or member" on storage.objects
  for select using (
    bucket_id = 'media'
    and (
      keep_is_public((storage.foldername(name))[2]::uuid)
      or is_keep_member((storage.foldername(name))[2]::uuid, auth.uid())
      or is_approved_keep_follower((storage.foldername(name))[2]::uuid, auth.uid())
    )
  );
