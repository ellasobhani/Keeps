-- Adds a timestamp to profile_followers so the Invites tab can show a
-- "new followers" feed ordered chronologically. Every other membership-ish
-- table in 0001 already has created_at (keep_followers, likes, favorites);
-- profile_followers was the one exception, since nothing needed an ordered
-- feed over it until now. Profile-following itself stays instant/open —
-- this is purely additive, no RLS or behavior change.
alter table profile_followers
  add column created_at timestamptz not null default now();
