-- Profile grids currently sort keeps by created_at, so a keep never moves
-- once made even if it's the one you're actively adding to. Adds a real
-- updated_at that's bumped by edits to the keep itself and by posts being
-- added to/removed from/moved out of it, so fetchOwnKeeps/fetchProfileKeeps
-- can sort by actual recency of activity.
alter table keeps add column updated_at timestamptz not null default now();
update keeps set updated_at = created_at;

create or replace function touch_keep_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger keeps_touch_updated_at
before update on keeps
for each row execute function touch_keep_updated_at();

-- Posts don't touch their own keep row on insert/delete/move, so this bumps
-- it on their behalf. On a keep_id change (the "Move to..." feature, see
-- 0008_move_posts_between_keeps.sql) both the old and new keep get touched.
create or replace function bump_keep_updated_at_from_post()
returns trigger as $$
begin
  if tg_op = 'DELETE' then
    update keeps set updated_at = now() where id = old.keep_id;
    return old;
  end if;

  update keeps set updated_at = now() where id = new.keep_id;
  if tg_op = 'UPDATE' and old.keep_id is distinct from new.keep_id then
    update keeps set updated_at = now() where id = old.keep_id;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger posts_bump_keep_updated_at
after insert or update or delete on posts
for each row execute function bump_keep_updated_at_from_post();
