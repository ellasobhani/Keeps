-- Lets PostGridTile/KeepCoverCard/PhotoDetail render a blurred placeholder
-- (via expo-image's `placeholder` prop) the instant a tile mounts, instead
-- of a blank box while the signed url resolves and the photo downloads.
-- Computed on-device at upload time (see app/lib/blurhash.ts) — best-effort,
-- so existing photos just keep null here until they're re-uploaded and fall
-- back to the plain placeholder in the meantime.
alter table post_media add column blurhash text;
alter table keeps add column cover_blurhash text;
