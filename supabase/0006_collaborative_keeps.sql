-- Collaborative keeps: a keep can have multiple co-owners instead of just
-- one. Co-owners have full parity — post, edit settings, invite/remove other
-- co-owners, delete the keep — there is no lesser "contributor" tier (the
-- old keep_members.role check allowed one, but no invite flow for it was
-- ever built, so it's dead weight left untouched here). Becoming a co-owner
-- requires an invite the invitee accepts, same shape as the keep-follow
-- request flow in 0004. keeps.owner_id stops being the permission gate and
-- becomes pure "who created it" provenance.
--
-- "Show on profile" also moves here: it was a single flag on keeps (one
-- owner, one preference); now that a keep can have several co-owners, each
-- of them needs to decide independently whether it shows on *their* own
-- profile, so it becomes a per-(keep, member) column instead.

alter table keep_members
  add column status text not null default 'approved' check (status in ('pending', 'approved'));

alter table keep_members
  add column hidden_from_profile boolean not null default false;

update keep_members km set hidden_from_profile = k.hidden_from_profile
from keeps k where k.id = km.keep_id;

-- is_keep_member becomes status-aware: a pending invite grants no access
-- (can't see posts, can't post, doesn't count as a co-owner) until accepted.
create or replace function is_keep_member(p_keep_id uuid, p_profile_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from keep_members
    where keep_id = p_keep_id and profile_id = p_profile_id and status = 'approved'
  );
$$;

-- keeps: settings/delete rights move from "the one owner_id" to "any
-- approved co-owner" — this is what makes co-owners as powerful as the
-- creator. select is untouched (still needs the owner_id fallback from
-- 0001 for the moment right after insert, before the keep_members row
-- exists).
drop policy if exists "keeps update - owner" on keeps;
create policy "keeps update - any co-owner" on keeps
  for update using (is_keep_member(id, auth.uid()));

drop policy if exists "keeps delete - owner" on keeps;
create policy "keeps delete - any co-owner" on keeps
  for delete using (is_keep_member(id, auth.uid()));

-- keep_members select: a pending invitee needs to see their own row (to
-- know they've been invited) even though is_keep_member now excludes them.
drop policy if exists "keep_members select" on keep_members;
create policy "keep_members select" on keep_members
  for select using (
    keep_is_public(keep_id)
    or is_keep_member(keep_id, auth.uid())
    or is_keep_owner(keep_id, auth.uid())
    or profile_id = auth.uid()
  );

-- keep_members insert: two distinct paths.
--   1. Keep creation seeding itself — the creator inserts their own row as
--      already-approved. Gated on is_keep_owner (keeps.owner_id), which is
--      only ever true for the creator, so this can't be used to self-approve
--      later; the primary key also means it only ever fires once.
--   2. Invites — any existing approved co-owner can insert a pending row for
--      someone else. It can only land as 'pending'; only the invitee
--      themselves can approve it (see the update policy below).
drop policy if exists "keep_members insert - keep owner" on keep_members;
create policy "keep_members insert - creator seeds self, or member invites" on keep_members
  for insert with check (
    (profile_id = auth.uid() and is_keep_owner(keep_id, auth.uid()) and status = 'approved')
    or (is_keep_member(keep_id, auth.uid()) and status = 'pending')
  );

-- keep_members update: covers both accepting your own invite (status
-- pending -> approved) and, once already approved, updating your own
-- hidden_from_profile preference (Milestone 2) — the with check only
-- constrains the *resulting* row, so an update that doesn't touch status
-- passes as long as the row was already approved. A still-pending invitee
-- can't set hidden_from_profile before accepting, since their unchanged
-- status would fail the check.
create policy "keep_members update - self" on keep_members
  for update using (profile_id = auth.uid())
  with check (profile_id = auth.uid() and status = 'approved');

-- keep_members delete: any approved co-owner can remove any row (covers
-- removing another co-owner, declining an invite you sent, and canceling
-- your own pending invite you're rescinding); self-delete always works too
-- (covers leaving, or an invitee declining). The "don't remove the last
-- co-owner" guard is enforced at the app layer (Milestone 4 of
-- collaborative_keeps_plan.md), not here.
drop policy if exists "keep_members delete - owner or self" on keep_members;
create policy "keep_members delete - any co-owner or self" on keep_members
  for delete using (is_keep_member(keep_id, auth.uid()) or profile_id = auth.uid());
