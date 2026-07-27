-- Per-post opt-out from other people's Feed tab. A post always stays
-- visible on its own keep page regardless of this flag — it only gates
-- what fetchFeed (app/lib/queries.ts) selects client-side, same as
-- hidden_from_profile gates a keep's profile grid. Existing posts backfill
-- to true so nothing already posted changes behavior.
alter table posts add column show_in_feed boolean not null default true;
