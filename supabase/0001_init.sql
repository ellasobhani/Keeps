-- Keeps MVP — initial schema + RLS
-- Run this once in the Supabase SQL editor for a fresh project.
-- Mirrors mvp_spec.md §2 (schema) and §3 (privacy model / RLS).

-- ============================================================
-- 1. Tables (verbatim from spec §2)
-- ============================================================

create table profiles (
  id uuid primary key references auth.users,
  handle text unique not null,
  display_name text not null,
  bio text,
  avatar_url text,
  created_at timestamptz default now()
);

create table keeps (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) not null,
  title text not null,
  cover_photo_url text,
  privacy_mode text not null default 'private' check (privacy_mode in ('private','public')),
  hidden_from_profile boolean default false,
  is_ongoing boolean default true,
  created_at timestamptz default now()
);

create table keep_members (
  keep_id uuid references keeps(id) on delete cascade,
  profile_id uuid references profiles(id),
  role text default 'contributor' check (role in ('owner','contributor')),
  primary key (keep_id, profile_id)
);

create table keep_followers (
  keep_id uuid references keeps(id) on delete cascade,
  profile_id uuid references profiles(id),
  primary key (keep_id, profile_id)
);

create table profile_followers (
  profile_id uuid references profiles(id),
  follower_id uuid references profiles(id),
  primary key (profile_id, follower_id)
);

create table posts (
  id uuid primary key default gen_random_uuid(),
  keep_id uuid references keeps(id) on delete cascade,
  author_id uuid references profiles(id) not null,
  caption text,
  song_title text,
  song_artist text,
  song_url text,
  location_label text,
  created_at timestamptz default now()
);

-- media_url stores a Storage *object path*, not a public URL — see lib/storage.ts.
-- Private-keep media lives in a private bucket and is resolved to a
-- short-lived signed URL client-side; a public media_url here would let
-- anyone with the string bypass every policy below.
create table post_media (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references posts(id) on delete cascade,
  media_url text not null,
  position int not null default 0
);

create table likes (
  post_id uuid references posts(id) on delete cascade,
  profile_id uuid references profiles(id),
  created_at timestamptz default now(),
  primary key (post_id, profile_id)
);

-- parent_id should only be set by the app when the parent keep is public
-- (flat notes in private keeps, threaded replies in public ones) — this is
-- enforced in lib/queries.ts, not the database, per spec §3.
create table comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references posts(id) on delete cascade,
  author_id uuid references profiles(id) not null,
  parent_id uuid references comments(id),
  body text not null,
  created_at timestamptz default now()
);

-- ============================================================
-- 2. Helper functions
--
-- Policies on keep_members would otherwise reference keep_members from
-- within its own SELECT policy. security definer functions sidestep that
-- and give every other table a single place to express "is this person
-- allowed to see/touch this keep."
-- ============================================================

create or replace function is_keep_owner(p_keep_id uuid, p_profile_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from keeps where id = p_keep_id and owner_id = p_profile_id
  );
$$;

create or replace function is_keep_member(p_keep_id uuid, p_profile_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from keep_members where keep_id = p_keep_id and profile_id = p_profile_id
  );
$$;

create or replace function keep_is_public(p_keep_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from keeps where id = p_keep_id and privacy_mode = 'public'
  );
$$;

-- ============================================================
-- 3. Row Level Security
-- ============================================================

alter table profiles enable row level security;
alter table keeps enable row level security;
alter table keep_members enable row level security;
alter table keep_followers enable row level security;
alter table profile_followers enable row level security;
alter table posts enable row level security;
alter table post_media enable row level security;
alter table likes enable row level security;
alter table comments enable row level security;

-- profiles: always publicly readable, only the owner can write their own row.
create policy "profiles select - public" on profiles
  for select using (true);
create policy "profiles insert - self" on profiles
  for insert with check (id = auth.uid());
create policy "profiles update - self" on profiles
  for update using (id = auth.uid());

-- keeps: visible if public, you own it, or you're a member. The owner check
-- matters at creation time: insert().select() runs before the keep_members
-- row exists, so is_keep_member alone would make a fresh private keep
-- invisible to its own owner.
create policy "keeps select - public or member" on keeps
  for select using (
    privacy_mode = 'public' or owner_id = auth.uid() or is_keep_member(id, auth.uid())
  );
create policy "keeps insert - owner" on keeps
  for insert with check (owner_id = auth.uid());
create policy "keeps update - owner" on keeps
  for update using (owner_id = auth.uid());
create policy "keeps delete - owner" on keeps
  for delete using (owner_id = auth.uid());

-- keep_members: visible to the keep's members/owner or if the keep is public;
-- only the owner adds/removes members (including seeding themselves as owner
-- on keep creation, which passes since the keeps row already exists by then).
create policy "keep_members select" on keep_members
  for select using (
    keep_is_public(keep_id) or is_keep_member(keep_id, auth.uid()) or is_keep_owner(keep_id, auth.uid())
  );
create policy "keep_members insert - keep owner" on keep_members
  for insert with check (is_keep_owner(keep_id, auth.uid()));
create policy "keep_members delete - owner or self" on keep_members
  for delete using (is_keep_owner(keep_id, auth.uid()) or profile_id = auth.uid());

-- keep_followers: public-keeps-only feature; app layer should refuse to
-- follow a private keep. Follow lists are readable like any public
-- engagement; you can only (un)follow as yourself.
create policy "keep_followers select" on keep_followers
  for select using (keep_is_public(keep_id));
create policy "keep_followers insert - self" on keep_followers
  for insert with check (profile_id = auth.uid());
create policy "keep_followers delete - self" on keep_followers
  for delete using (profile_id = auth.uid());

-- profile_followers: profiles are always public.
create policy "profile_followers select - public" on profile_followers
  for select using (true);
create policy "profile_followers insert - self" on profile_followers
  for insert with check (follower_id = auth.uid());
create policy "profile_followers delete - self" on profile_followers
  for delete using (follower_id = auth.uid());

-- posts / post_media / likes / comments: select follows keep visibility;
-- writes require keep membership regardless of privacy (contribution rights
-- are separate from visibility, per spec §3).
create policy "posts select - public or member" on posts
  for select using (keep_is_public(keep_id) or is_keep_member(keep_id, auth.uid()));
create policy "posts insert - keep member" on posts
  for insert with check (author_id = auth.uid() and is_keep_member(keep_id, auth.uid()));
create policy "posts update - author" on posts
  for update using (author_id = auth.uid());
create policy "posts delete - author" on posts
  for delete using (author_id = auth.uid());

create policy "post_media select - via post" on post_media
  for select using (
    exists (
      select 1 from posts p
      where p.id = post_media.post_id
      and (keep_is_public(p.keep_id) or is_keep_member(p.keep_id, auth.uid()))
    )
  );
create policy "post_media insert - via own post" on post_media
  for insert with check (
    exists (select 1 from posts p where p.id = post_media.post_id and p.author_id = auth.uid())
  );
create policy "post_media delete - via own post" on post_media
  for delete using (
    exists (select 1 from posts p where p.id = post_media.post_id and p.author_id = auth.uid())
  );

create policy "likes select - via post" on likes
  for select using (
    exists (
      select 1 from posts p
      where p.id = likes.post_id
      and (keep_is_public(p.keep_id) or is_keep_member(p.keep_id, auth.uid()))
    )
  );
create policy "likes insert - member, self" on likes
  for insert with check (
    profile_id = auth.uid()
    and exists (
      select 1 from posts p
      where p.id = likes.post_id and is_keep_member(p.keep_id, auth.uid())
    )
  );
create policy "likes delete - self" on likes
  for delete using (profile_id = auth.uid());

create policy "comments select - via post" on comments
  for select using (
    exists (
      select 1 from posts p
      where p.id = comments.post_id
      and (keep_is_public(p.keep_id) or is_keep_member(p.keep_id, auth.uid()))
    )
  );
create policy "comments insert - member, self" on comments
  for insert with check (
    author_id = auth.uid()
    and exists (
      select 1 from posts p
      where p.id = comments.post_id and is_keep_member(p.keep_id, auth.uid())
    )
  );
create policy "comments delete - self" on comments
  for delete using (author_id = auth.uid());

-- ============================================================
-- 4. Storage
--
-- Two areas: a public "avatars" bucket (profiles are always public) and a
-- private "media" bucket for keep covers + post images, gated by policies
-- that mirror the table RLS above. Path convention:
--   avatars/{profile_id}/{filename}
--   media:covers/{keep_id}/{filename}
--   media:posts/{keep_id}/{post_id}/{filename}
-- storage.foldername(name)[2] is the keep_id in both media path shapes.
-- ============================================================

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true), ('media', 'media', false)
on conflict (id) do nothing;

create policy "avatars read - public" on storage.objects
  for select using (bucket_id = 'avatars');
create policy "avatars write - own folder" on storage.objects
  for insert with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars update - own folder" on storage.objects
  for update using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars delete - own folder" on storage.objects
  for delete using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "media read - public or member" on storage.objects
  for select using (
    bucket_id = 'media'
    and (
      keep_is_public((storage.foldername(name))[2]::uuid)
      or is_keep_member((storage.foldername(name))[2]::uuid, auth.uid())
    )
  );
create policy "media write - keep member" on storage.objects
  for insert with check (
    bucket_id = 'media' and is_keep_member((storage.foldername(name))[2]::uuid, auth.uid())
  );
create policy "media delete - own upload" on storage.objects
  for delete using (bucket_id = 'media' and owner = auth.uid());
