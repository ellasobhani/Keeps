# Collaborative keeps — implementation plan

A keep is either **solo** (one owner) or **collaborative** (multiple co-owners).
Co-owners have full parity with the creator: they can post, edit keep settings,
invite/remove other co-owners, and delete the keep. Becoming a co-owner requires
an invite the invitee accepts — it's not instant, since it grants powerful
rights. Each co-owner independently decides whether the keep shows on *their*
own profile; there is no single shared "show on profile" flag anymore. The
existing `role` column on `keep_members` (`'owner' | 'contributor'`) is dead
weight — no contributor-invite flow was ever built — so this plan doesn't
touch it; membership itself now means co-owner. `keeps.owner_id` stops being
the permission gate and becomes pure "who created it" provenance.

Decided while scoping (see conversation): invite+accept (not instant add),
fully equal rights (not creator-reserved powers), co-owners only (no
contributor tier).

## Milestone 1 — Schema: invite/accept + per-member visibility

New file: `supabase/0006_collaborative_keeps.sql`

```sql
-- keep_members gets the same pending/approved pattern 0004 gave keep_followers.
-- Existing rows (today, only the creator) default to 'approved' so nothing breaks.
alter table keep_members
  add column status text not null default 'approved' check (status in ('pending', 'approved'));

-- "Show on profile" moves from a single keeps-level flag to a per-(keep, member)
-- preference, since each co-owner now decides independently.
alter table keep_members
  add column hidden_from_profile boolean not null default false;

update keep_members km set hidden_from_profile = k.hidden_from_profile
from keeps k where k.id = km.keep_id;

-- is_keep_member becomes status-aware: a pending invite grants no access yet.
create or replace function is_keep_member(p_keep_id uuid, p_profile_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from keep_members
    where keep_id = p_keep_id and profile_id = p_profile_id and status = 'approved'
  );
$$;
```

RLS changes (same file):

- `keeps update` / `keeps delete`: change `owner_id = auth.uid()` →
  `is_keep_member(id, auth.uid())`. This is the line that grants "as much
  ownership over settings as you do."
- `keep_members insert`: allow an existing approved member to insert a
  `pending` row for someone else (the invite). Keep the
  `profile_id = auth.uid(), status = 'approved'` self-insert path only for
  the creator at keep-creation time.
- `keep_members update`: only the invited profile can flip their own row
  `pending → approved` (accept). No self-approval bypass for others.
- `keep_members delete`: any approved co-owner can delete any row
  (decline/leave/remove — fully equal); self-delete already covered.
  Edge case to handle in Milestone 4: don't allow removing the last
  remaining co-owner of a keep.

**Test before moving on:** apply the migration locally, exercise
invite → accept via the SQL editor / `psql`, confirm RLS denies a pending
member read/write access and confirms an approved member gets full access.

## Milestone 2 — Query layer (`app/lib/queries.ts`)

- `inviteCoOwner(keepId, profileId)` — insert pending `keep_members` row.
- `acceptCoOwnerInvite(keepId)` / `declineCoOwnerInvite(keepId)` — update/delete
  on own row.
- `removeCoOwner(keepId, profileId)`
- `fetchKeepCoOwners(keepId)`
- `fetchPendingCoOwnerInvites(profileId)` — invites addressed to me, across
  all keeps.
- `fetchOwnKeeps`: currently `.eq("owner_id", ownerId)`. Rework to join
  `keep_members` (`status = 'approved'`) so co-owned keeps appear too,
  filtered by that member row's `hidden_from_profile = false`.
- `updateKeep`: split `hiddenFromProfile` out of the `keeps` update into an
  update on the caller's own `keep_members` row; `privacyMode`/`title` stay
  on `keeps`.

**Test before moving on:** exercise each function against the dev Supabase
project (scratch script or a temporary debug screen) before wiring any UI.

## Milestone 3 — Permission checks in existing screens

- `KeepDetail.tsx`: replace `isOwner = keep.owner_id === session.user.id`
  with membership-derived `isCoOwner` (from `fetchKeepMembership`,
  `status = 'approved'`), and rename downstream usages — it currently gates
  the edit button, follow-requests button, and pending-follow-requests query.
- Gate the currently-ungated "add post" FAB on membership too (existing gap
  that would otherwise carry into the collaborative model).

**Test before moving on:** as a co-owner (not the creator), confirm the edit
button, FAB, and follow-request controls all appear correctly; as a non-member,
confirm they don't.

## Milestone 4 — Collaborators UI (new)

- New screen `ManageCoOwners` (`{ keepId }`): list current co-owners,
  invite-by-handle input, pending invites out, remove button per co-owner
  (with confirmation + the "can't remove the last co-owner" guard from
  Milestone 1).
- Invitee-facing side: a pending-invites list so someone can accept/decline.
  Check whether `Notifications.tsx` already aggregates this kind of thing
  before building a separate entry point.
- `CreateKeep.tsx`: v1 default is invite-after-creation only (not during
  creation) — simpler, and the invite/accept flow needs the keep to already
  exist.
- `EditKeep.tsx`: the "Show on profile" switch (already built) needs to read/
  write the caller's own `keep_members` row instead of `keeps.hidden_from_profile`
  once Milestone 2 lands. Add a "Manage collaborators" entry point.

**Test before moving on:** full loop with two real accounts — invite, accept,
both post, both edit settings, one removes the other, last-co-owner guard
holds.

## Milestone 5 — Cleanup

Once nothing reads `keeps.hidden_from_profile` anymore, drop it in a
follow-up migration (`0007`) rather than in the same migration that adds the
replacement — keeps each migration reversible/testable on its own.

_(Milestones 1–4 are built and verified — schema replayed + RLS-simulated
locally, query layer, KeepDetail permission checks, ManageCoOwners/Invites
screens. Milestone 5 is intentionally on hold until 0006 is applied to the
real Supabase project and tested live.)_

## Milestone 6 — Bottom tab navigation

Add `@react-navigation/bottom-tabs` (same v7 line as the installed
`@react-navigation/native`/`native-stack`). Nest a `Tab.Navigator` (Profile,
Search) as a single screen inside the existing root `AppStack`, in place of
today's direct `Profile` screen. Every other existing screen
(`KeepDetail`, `EditKeep`, etc.) stays registered on the root stack exactly
as today — `navigation.navigate` bubbles up from a nested tab screen to a
parent stack automatically in React Navigation v7, so none of those screens
need to change. This is the lowest-churn way to get a persistent
Profile/Search tab bar without touching the dozen screens that already work.

## Milestone 7 — Public profile screen

New `PublicProfile.tsx` (`{ profileId }`): read-only name/handle/bio, their
visible keeps (reuse the same "approved co-owner, not hidden" shape as
`fetchOwnKeeps`, but for someone else — hidden-from-profile keeps must
never appear here, unlike the self-view), follower/following counts, and a
follow/unfollow button. Profile-following stays instant/open (no schema
change — confirmed while scoping this). New query functions needed:
`fetchProfileById`, `fetchProfileKeeps(profileId)` (public/approved-member-
visible keeps only, via the same RLS the `keeps` table already enforces),
`isFollowingProfile`, `followProfile`, `unfollowProfile` — the last three
don't exist anywhere yet since no profile-follow UI has been built before
now.

## Milestone 8 — Search

New `Search.tsx`: a text input searching keeps (by title) and profiles (by
handle/display name), each result row navigating to `KeepDetail` or the new
`PublicProfile`. Privacy is enforced for free — querying `keeps` through the
normal Supabase client is already RLS-gated (public, or a keep you're an
approved member/follower of), so a private keep you don't belong to simply
won't appear in results without any extra filtering logic. Profiles are
already always-public per the existing model.

## Milestone 9 — Invites tab consolidation

Three sections in one screen, all under the existing "Invites" entry:

1. **Co-owner invites** (already built) — accept/decline.
2. **New followers of your profile** — informational only (profile-
   following stays instant, per Milestone 7's scoping decision). A feed of
   "X started following you," nothing to approve.
3. **Follow requests on your keeps** — aggregated across every keep you
   co-own, one row per keep with a pending-request count, tapping through to
   the existing `FollowRequests.tsx` (per-keep approve/decline screen,
   unchanged) rather than duplicating that UI inline.

New query: something like `fetchPendingFollowRequestsForOwnKeeps(profileId)`
to aggregate section 3 across every keep the caller co-owns.

## Milestone 10 — KeepDetail: repurpose the follow-requests icon

The person-icon button in the `KeepDetail` header currently opens the
per-keep `FollowRequests` screen. That flow moves entirely into the Invites
tab (Milestone 9), so this button gets repurposed instead of removed: same
icon and position, now opens `ManageCoOwners` for that keep. Badge count
switches from pending-follow-requests to pending-co-owner-invites-sent, so
it still means "something here needs a look."

## Milestone 11 — EditKeep: drop the now-redundant button

Remove the "Manage collaborators" button added to `EditKeep` in Milestone 4
— it's superseded by the repurposed KeepDetail icon from Milestone 10, so
keeping both would be two paths to the same screen for no reason.

## Milestone 12 — Notifications: no-op check

`Notifications.tsx`/`fetchNotificationsForProfile` already only aggregate
likes and comments — confirming this stays true is the only "work" here.
