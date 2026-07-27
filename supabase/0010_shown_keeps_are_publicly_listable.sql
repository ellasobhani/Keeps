-- Fixes: private keeps weren't appearing on their owner's profile page for
-- outside viewers, even with "show on profile" on. fetchProfileKeeps joins
-- keep_members -> keeps, and keeps' RLS had no clause for "anyone can see
-- this keep is shown on a profile" — only members/owner/followers/pending
-- invitees could read a private keep's row at all, so the embed came back
-- null and got filtered out, identical in shape to 0009's bug.
--
-- "Show on profile" should mean the keep's tile (title, cover, lock icon)
-- is visible to anyone browsing that profile, private or public — the same
-- way a private Instagram account's posts still show as locked tiles.
-- Content itself (posts/comments/likes) is unaffected: those still require
-- is_keep_member/is_approved_keep_follower exactly as before, so a stranger
-- sees that the keep exists but still can't see what's inside it.
create or replace function keep_is_shown_on_profile(p_keep_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from keep_members
    where keep_id = p_keep_id and status = 'approved' and hidden_from_profile = false
  );
$$;

drop policy if exists "keeps select - public or member" on keeps;
create policy "keeps select - public or member" on keeps
  for select using (
    privacy_mode = 'public'
    or owner_id = auth.uid()
    or is_keep_member(id, auth.uid())
    or is_approved_keep_follower(id, auth.uid())
    or has_pending_keep_invite(id, auth.uid())
    or keep_is_shown_on_profile(id)
  );

-- fetchProfileKeeps queries *from* keep_members (keeps is just the embed),
-- so keep_members' own select policy gates the base rows before the keeps
-- fix above even comes into play — without this, a stranger still can't
-- read the keep_members row at all for a private keep, and the embed never
-- gets a chance to resolve. Same condition as above: an approved,
-- not-hidden-from-profile row is exactly the public "shown on profile" set.
drop policy if exists "keep_members select" on keep_members;
create policy "keep_members select" on keep_members
  for select using (
    keep_is_public(keep_id)
    or is_keep_member(keep_id, auth.uid())
    or is_keep_owner(keep_id, auth.uid())
    or profile_id = auth.uid()
    or (status = 'approved' and hidden_from_profile = false)
  );
