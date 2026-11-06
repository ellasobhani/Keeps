-- Likes/comments could only ever be written by a keep_member — that matched
-- the visibility rules back when only members could see a keep at all, but
-- public keeps (and their followers, who explicitly aren't members) have
-- been visible via keep_is_public since 0001. A follower could see a public
-- post (posts/likes/comments select policies already allow this) but
-- couldn't like or comment on it, since the insert policies never got the
-- same public-keep carve-out their select counterparts have. Bringing write
-- access in line with read access: if you can see the post, you can engage
-- with it.
drop policy if exists "likes insert - member, self" on likes;
create policy "likes insert - member or public keep, self" on likes
  for insert with check (
    profile_id = auth.uid()
    and exists (
      select 1 from posts p
      where p.id = likes.post_id
      and (keep_is_public(p.keep_id) or is_keep_member(p.keep_id, auth.uid()))
    )
  );

drop policy if exists "comments insert - member, self" on comments;
create policy "comments insert - member or public keep, self" on comments
  for insert with check (
    author_id = auth.uid()
    and exists (
      select 1 from posts p
      where p.id = comments.post_id
      and (keep_is_public(p.keep_id) or is_keep_member(p.keep_id, auth.uid()))
    )
  );
