-- Favorites — private per-profile bookmarks on posts, distinct from `likes`
-- (which are a public, name-listed engagement). Mirrors `likes` in shape but
-- is only ever visible to the profile that saved it.

create table favorites (
  post_id uuid references posts(id) on delete cascade,
  profile_id uuid references profiles(id),
  created_at timestamptz default now(),
  primary key (post_id, profile_id)
);

alter table favorites enable row level security;

-- select: self only — favoriting is a personal bookmark, not a public signal.
create policy "favorites select - self" on favorites
  for select using (profile_id = auth.uid());

-- insert: any post you can already see (public keep or member), not gated to
-- keep membership like likes/comments — bookmarking a public post you don't
-- contribute to shouldn't require contribution rights.
create policy "favorites insert - visible post, self" on favorites
  for insert with check (
    profile_id = auth.uid()
    and exists (
      select 1 from posts p
      where p.id = favorites.post_id
      and (keep_is_public(p.keep_id) or is_keep_member(p.keep_id, auth.uid()))
    )
  );

create policy "favorites delete - self" on favorites
  for delete using (profile_id = auth.uid());
