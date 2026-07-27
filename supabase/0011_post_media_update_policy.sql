-- post_media had select/insert/delete policies (0001 §4 above) but no update
-- policy at all. 0008's move-to-keep feature relies on
-- lib/queries.ts#updatePostMediaUrl to repoint media_url at the file's new
-- path after lib/storage.ts#movePostMediaFile relocates it server-side (0008
-- already added the update policy storage.objects itself needed for that
-- move) — but without a post_media update policy, that follow-up update
-- matches zero rows under RLS and Postgrest returns success with no error
-- (the call site doesn't chain `.select()` to notice). The file moves, the
-- DB row keeps pointing at the old, now-nonexistent path, and the photo
-- never loads again for anyone in the destination keep. Same "author owns
-- the post" shape as the existing insert/delete policies.
create policy "post_media update - via own post" on post_media
  for update using (
    exists (select 1 from posts p where p.id = post_media.post_id and p.author_id = auth.uid())
  )
  with check (
    exists (select 1 from posts p where p.id = post_media.post_id and p.author_id = auth.uid())
  );
