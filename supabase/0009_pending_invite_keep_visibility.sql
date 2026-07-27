-- Fixes a real bug: Invites.tsx renders the title of a keep you've been
-- invited to co-own (item.invite.keeps.title), via a join from keep_members
-- to keeps. But is_keep_member requires status = 'approved' (0006), and a
-- pending invitee is by definition not approved yet — so for a private
-- keep, RLS silently returned keeps: null for that embed (the invite row
-- itself is visible, the keep it points to wasn't), crashing the Invites
-- screen with "Cannot read property 'title' of null."
--
-- You should be able to see what you're being invited to before deciding
-- whether to accept. This grants read access to the keep's own row (title,
-- cover photo, privacy_mode, etc.) to a pending invitee — nothing more:
-- is_keep_member still requires 'approved', so posts/comments/likes on the
-- keep stay invisible until they actually accept.
create or replace function has_pending_keep_invite(p_keep_id uuid, p_profile_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from keep_members
    where keep_id = p_keep_id and profile_id = p_profile_id and status = 'pending'
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
  );
