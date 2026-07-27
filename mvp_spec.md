# Keeps — MVP build brief

For handoff to Claude Code. Scope is deliberately cut down from the full product
spec (`scrapbook-app-spec.md`) to the smallest version that can be tested with a
real friend group. Public mode, discovery, physical goods, and monetization are
all explicitly out of scope for this milestone — see §5.

## 1. Stack

- **App:** React Native + Expo (managed workflow). Reuses existing React/TS
  experience; Expo Go gives instant friend-testing with zero App Store friction,
  EAS Build handles a real TestFlight beta later.
- **Backend:** Supabase — Postgres, Auth, Storage, Row Level Security. Same
  stack as Data Mirror, so no new backend paradigm to learn.
- **Design tokens:** all colors, type, spacing, radii live in one
  `theme/tokens.ts` file. Every component imports from it — nothing hardcodes a
  hex value or font size directly. This is what makes the visual redesign cheap
  later: change the tokens file, not forty components.

## 2. Data model (Supabase / Postgres)

```sql
-- profiles: one row per user, mirrors auth.users
profiles (
  id uuid primary key references auth.users,
  handle text unique not null,
  display_name text not null,
  bio text,
  avatar_url text,
  created_at timestamptz default now()
)

-- keeps: the core collection object
keeps (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) not null,
  title text not null,
  cover_photo_url text,
  privacy_mode text not null default 'private' check (privacy_mode in ('private','public')),
  hidden_from_profile boolean default false,
  is_ongoing boolean default true,
  created_at timestamptz default now()
)

-- keep_members: who can contribute (private) or who owns/admins (public)
keep_members (
  keep_id uuid references keeps(id) on delete cascade,
  profile_id uuid references profiles(id),
  role text default 'contributor' check (role in ('owner','contributor')),
  primary key (keep_id, profile_id)
)

-- keep_followers: for public keeps only
keep_followers (
  keep_id uuid references keeps(id) on delete cascade,
  profile_id uuid references profiles(id),
  primary key (keep_id, profile_id)
)

-- profile_followers: profiles are always public
profile_followers (
  profile_id uuid references profiles(id),
  follower_id uuid references profiles(id),
  primary key (profile_id, follower_id)
)

-- posts: an entry inside a keep
posts (
  id uuid primary key default gen_random_uuid(),
  keep_id uuid references keeps(id) on delete cascade,
  author_id uuid references profiles(id) not null,
  caption text,
  song_title text,
  song_artist text,
  song_url text,          -- link/preview card only, no playback for MVP
  location_label text,    -- plain text, no live map SDK for MVP
  created_at timestamptz default now()
)

-- post_media: supports carousels (1..N images per post)
post_media (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references posts(id) on delete cascade,
  media_url text not null,
  position int not null default 0
)

-- likes
likes (
  post_id uuid references posts(id) on delete cascade,
  profile_id uuid references profiles(id),
  created_at timestamptz default now(),
  primary key (post_id, profile_id)
)

-- comments: flat for private keeps, threaded (parent_id) for public
comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references posts(id) on delete cascade,
  author_id uuid references profiles(id) not null,
  parent_id uuid references comments(id),  -- null unless public-keep reply
  body text not null,
  created_at timestamptz default now()
)
```

## 3. Row Level Security — the privacy model, enforced at the database

- `keeps`: select allowed if `privacy_mode = 'public'` OR the user is in
  `keep_members`. Insert/update restricted to `owner_id`.
- `posts` / `post_media` / `comments` / `likes`: select allowed if the parent
  keep is public, or the user is a member of the keep. Insert restricted to
  keep members (contributors), regardless of keep privacy — visibility and
  contribution rights are separate.
- `comments.parent_id`: application layer should only allow non-null values
  when the parent keep's `privacy_mode = 'public'` — flat notes only in private
  keeps, threaded replies only in public ones.
- `profiles`: always publicly readable (name, handle, bio, avatar) per the
  "profiles are always public" rule. Never join keep contents into a public
  profile query — enforce that at the query layer, not just RLS, so a bug can't
  accidentally leak private keep content through a profile fetch.

## 4. Repo structure

```
/app
  /screens
    Profile.tsx
    KeepDetail.tsx
    PhotoDetail.tsx
    CreateKeep.tsx
    AddPost.tsx
    PrivacySettings.tsx
  /components
    KeepCoverCard.tsx
    PostGridTile.tsx
    PlaylistTile.tsx
    VoiceNoteTile.tsx
    PinnedLocationTile.tsx
    LikeRow.tsx          -- renders name-list or count depending on keep mode
    CommentThread.tsx     -- renders flat or threaded depending on keep mode
    Avatar.tsx
  /theme
    tokens.ts             -- single source of truth for all styling
  /lib
    supabase.ts            -- client init
    queries.ts              -- typed data-fetching functions
  /navigation
    AppNavigator.tsx
```

## 5. Milestones

**M0 — setup**
Expo project, Supabase project, auth (email or magic link), theme tokens file,
navigation shell.

**M1 — profile + keep creation**
Profile screen (own profile only), create-keep flow (title, cover photo,
privacy toggle), keep grid on profile.

**M2 — posting**
Add-post flow: photo/video carousel upload to Supabase Storage, caption,
optional song link, optional location text. Keep detail grid rendering photo
tiles + utility tiles. Videos are capped at 60s and play with native controls
in the photo detail view; voice notes are deferred (see below) — `VoiceNoteTile.tsx`
in §4 is a placeholder for that work, not yet built.

**M3 — private engagement loop**
Photo detail view, likes-as-names, flat comments. This is the core loop to
test with friends — get this in front of real people before building anything
past it.

**M4 — friend testing**
Distribute via Expo Go to a small group (3–6 people). Watch for: does anyone
actually post without prompting, does the add-flow feel fast enough, is
private-mode engagement (names not counts) legible.

**M5 — public mode** (only after M4 shows the private loop works)
Public/private toggle behavior, counts, threaded replies, follow (profiles +
public keeps).

Explicitly deferred past M5: discovery/search, physical keepsakes, creator
monetization, in-app music/map playback, voice notes on posts — matches the
cut line in the main product spec.

**Future idea (not scoped to a milestone yet):** drag-and-drop a post from
one keep into another. A post currently belongs to exactly one `keep_id`;
this would mean re-parenting a post (and its media) across keeps from within
the UI, most naturally from the owner's profile view where multiple keep
grids are visible at once.

## 6. Note on design iteration

Because all screens pull from `theme/tokens.ts` and reusable components
(`PostGridTile`, `KeepCoverCard`, etc.) rather than one-off inline styles,
swapping the visual direction later — colors, type, grid gutter treatment —
should mean editing the tokens file and a handful of shared components, not
touching business logic or screen-by-screen styling. Worth confirming this
holds as the app grows; if new screens start hardcoding styles instead of
using the shared components, that discipline erodes fast.