-- Adds video support to posts: each post_media row now records whether it's
-- an image or a video, so PhotoDetail knows whether to render an <Image> or
-- a video player. Existing rows default to 'image' (all media before this
-- migration was photos). See mvp_spec.md M-video note.

alter table post_media
  add column media_type text not null default 'image' check (media_type in ('image', 'video'));
