-- Lets a post's author move it to a different keep_id — the "Move to..."
-- picker in EditPost. This also closes a gap that predates the feature:
-- "posts update - author" only ever checked author_id, with no constraint
-- on keep_id, so nothing stopped a post's author from re-pointing keep_id
-- at a private keep they don't belong to (post_media, likes, comments all
-- follow via post_id, so this would have smuggled content — and everything
-- attached to it — into a keep whose membership never approved it). Adding
-- keep_id to the check closes that and is exactly the gate "move to a keep
-- I co-own" needs anyway.
drop policy if exists "posts update - author" on posts;
create policy "posts update - author, own keep" on posts
  for update using (author_id = auth.uid())
  with check (author_id = auth.uid() and is_keep_member(keep_id, auth.uid()));

-- storage.objects had select/insert/delete policies (0001 §4) but no update
-- policy at all — Supabase's storage .move() renames an object's `name` via
-- an update under the hood, RLS-checked like any other update. Without this,
-- lib/storage.ts#movePostMediaFile fails outright: using gates the source
-- path (must already be an approved member of the old keep), with check
-- gates the destination path (must be an approved member of the new keep) —
-- same "member of both sides" shape as the posts policy above.
create policy "media update - keep member" on storage.objects
  for update using (
    bucket_id = 'media' and is_keep_member((storage.foldername(name))[2]::uuid, auth.uid())
  )
  with check (
    bucket_id = 'media' and is_keep_member((storage.foldername(name))[2]::uuid, auth.uid())
  );
