# Keeps Design System

Keeps is a mobile app (React Native + Expo, iOS/Android) for **living, collaborative multimedia scrapbooks** called "keeps" — private or public photo/video collections that friends co-own and post into together, with likes-as-names, flat comments, songs, and locations attached to each post. Built solo by Ella Sobhani; backend on Supabase (Postgres + Auth + Storage + Row Level Security).

Core loop: create a keep (title, cover photo, private/public), invite co-owners, post photos/videos/carousels into it, friends like (by name, not count — private mode) and comment. A personal Feed aggregates posts from keeps you follow; Search finds keeps and people; Profile shows your own keep grid.

One product surface today — the mobile app. No marketing site or docs site exists yet in the source repo.

## Sources
- GitHub: [ellasobhani/Keeps](https://github.com/ellasobhani/Keeps) (private) — the single source of truth for every token, component, and screen in this design system. Explore `app/theme/tokens.ts` (the literal design tokens), `app/components/`, `app/screens/`, and `mvp_spec.md` / `collaborative_keeps_plan.md` for product scope and reasoning. If you have access, read the real screen source there before extending this system — it's more precise than this snapshot.

This design system was built by reading that repo's actual token file, component source, and screen implementations — not from screenshots.

## Index
- `styles.css` — root stylesheet, imports everything under `tokens/`
- `tokens/` — colors.css, typography.css, spacing.css, radii.css (all from `app/theme/tokens.ts`, 1:1)
- `assets/` — `logo-mark.png` (transparent chevron mark), `app-icon.png` (full app icon incl. light-blue background)
- `guidelines/` — 10 foundation specimen cards (Colors, Type, Spacing, Brand groups) — see the Design System tab
- `components/core/` — Button, IconButton, Avatar
- `components/feed/` — KeepCoverCard, PostGridTile, CarouselChevron
- `components/navigation/` — BottomNavBar, SideMenu
- `components/social/` — LikeRow, CommentThread, CommentComposer
- `components/forms/` — CoverPhotoPicker
- `ui_kits/keeps-app/` — interactive click-through recreation of the mobile app (sign in → profile → feed → keep detail → photo detail → search → create keep)
- `SKILL.md` — portable skill definition for use in Claude Code

### Components
Button, IconButton, Avatar, KeepCoverCard, PostGridTile, CarouselChevron, BottomNavBar, SideMenu, LikeRow, CommentThread, CommentComposer, CoverPhotoPicker.

This is the app's actual primitive inventory (`app/components/*.tsx`) — nothing added beyond it, except IconButton/Button/Avatar which already existed 1:1 in source.

## Content fundamentals

**Voice:** plain, warm, understated. Short sentences, no exclamation-heavy marketing copy. Talks to "you" directly in empty states and prompts (*"tap + below to add the first one"*, *"we'll send you a sign-in code"*), but post/comment content is written in first person by users, not the app.

**Casing:** sentence case everywhere in UI copy (never Title Case buttons/labels) — "Create keep", "Add cover photo", "Send code". The one exception is button *labels themselves*, which render uppercase via letter-spacing/text-transform as a visual treatment, not as written casing — the underlying string ("Create keep") is still sentence case.

**Tone examples straight from source:**
- Empty states: *"No posts yet — tap + below to add the first one."* / *"No keeps yet — tap + above to create your first one."* / *"Search for a keep or a handle."*
- Confirmations read as real conversation, not legalese: *"Sign out?" / "Are you sure you want to sign out?"* and *"Delete account?" / "This permanently deletes your keeps, posts, comments, likes, and profile. This can't be undone."*
- Positive/completion state: *"You're all caught up" / "Nothing new since your last visit."*
- Placeholder copy leans specific and human, not generic: cover-photo title placeholder is literally `"Spring Break 2026"`, not "My Trip".
- Zero emoji anywhere in app chrome, labels, or system copy. The only emoji-adjacent characters are literal glyphs used as inline content markers in a post body — a musical note `♪` before a song title, a pin `📍` before a location — and those are rendered inline with real user content, not decorative UI emoji.

**Vibe:** intimate and low-key — a scrapbook for a specific friend group, not a public content platform. Copy never hypes ("share your moments!"); it just describes what will happen next.

## Visual foundations

**Palette:** off-white background (`#FFFFFF`) and a warm parchment-gray surface tint (`#F5F4F1`) sit under everything; borders are a soft warm gray (`#E4E1DA`). Text is near-black (`#1A1A1A`) primary / warm gray (`#6B6B68`) secondary — never pure black, never blue-gray. One accent color: a muted forest green (`#2F5233`), used sparingly for the privacy toggle's active state, the "Post" comment action, and loading spinners — never as a big color block. A pale sage tint (`#DDE7DC`) is the accent's "muted"/selected-background pairing. Danger red (`#B3261E`) is reserved for destructive actions only (delete, unlike-heart). The **brand mark** (blue gradient chevron) is the one place blue appears — it does not otherwise leak into UI chrome. Max 2 colors carry any real UI weight (ink + accent green); everything else is neutral.

**Type:** system font stack only (San Francisco on iOS, Roboto on Android) — no custom/display typeface. One scale, six steps (12/14/16/20/24/32). Weights are regular/medium/bold only — no light or black weights. Button labels are the one place type gets a distinct treatment: bold, uppercase via `text-transform`, with +0.4px letter-spacing — everything else is normal-case, normal-tracking.

**Backgrounds:** flat, solid colors only. No gradients, no photographic full-bleed backgrounds, no repeating patterns/textures behind UI chrome — the only imagery is user-generated content (cover photos, post media) filling their own tiles. No illustration system exists in the app.

**Corners & shape:** media (post tiles, keep covers, photo carousels) is always sharp-cornered (`radius: none`) — photos read as real photos, not soft app cards. Interactive controls (buttons, inputs, toggle segments) use a small 4px radius. The one larger radius (12px) is reserved for the sign-in screen's email input/button, a slightly softer, more "welcoming" first-run treatment. Avatars, the FAB, and small badges are full pill/circle.

**Cards:** there is no elevated "card" pattern in this system — no drop shadows, no colored borders. A keep/post surface is either a flat media tile (no border) or, if empty, a 1px hairline border (dashed for photo pickers, solid for empty grid placeholders). The single exception is the floating add-post FAB, which is the *only* element in the whole app that casts a shadow (`0 2px 4px rgba(0,0,0,0.2)`) — reserved for that one "floating over content" affordance.

**Depth & blur:** no glass/blur effects anywhere. The one translucency pattern is small circular badges over media (video-play glyph, carousel-count, carousel chevrons, cover-photo edit badge) at `rgba(0,0,0,0.35–0.55)` — a dark scrim just strong enough to host a white icon on top of arbitrary photo content. The side-menu backdrop uses the same idea at a lighter `rgba(0,0,0,0.3)`.

**Animation:** minimal and functional, never decorative. The one explicit animation is the side menu's slide-in/out (`Animated.timing`, 220ms open / 180ms close, no bounce/spring — a straight linear-ish ease). Everything else is instant state change; there's no page-transition system, no stagger, no skeleton shimmer (loading uses a plain spinner).

**Interaction states:** press = opacity drop to ~0.6–0.7 (never a color shift, never a scale/shrink). Disabled = opacity 0.4. No hover states exist in the source (native mobile app, touch-only) — treat hover in the web/DS context as identical to the press state (opacity dip), not a separate color.

**Imagery vibe:** the app has no stock/brand photography of its own — all imagery is real user photos/videos. Blurhash placeholders (soft blurred color swatches) show while real media loads, so the system tolerates arbitrary color/warmth in content without a fixed "brand photography" look.

**Layout rules:** bottom-fixed 3-tab nav (Profile / Feed / Search) present on browsing screens; a floating add FAB (bottom-right, only on screens where posting is possible) is the sole persistently-fixed action button. Grids are fixed-column (2-up keep covers, 3-up post tiles) with small consistent gaps (spacing `xs`–`sm`), not responsive masonry. Comment composers pin to the screen bottom, above the keyboard, rather than scrolling with content.

**Transparency/blur usage — when:** only ever over photo/video content, to keep a small icon legible against unpredictable imagery — never as a stylistic surface treatment on chrome (no frosted nav bars, no blurred modals).

## Iconography

Icons come from **Ionicons** (`@expo/vector-icons`'s `Ionicons` set) — the app's only icon system, used for every glyph: navigation tabs, header actions, like/bookmark/lock/play/camera/trash glyphs, etc. No custom icon font, no PNG icon set, no SVG icon library of its own.
- This design system links the Ionicons v4 web font from cdnjs (`ion-<name>` classes) as the closest CDN-installable equivalent to the app's `@expo/vector-icons` glyphs — same visual family, outline + filled variants per glyph (e.g. `heart` / `heart-outline`).
- Unicode/plain-text glyphs occasionally substitute for an icon *inside user content*, not chrome: `♥/♡` for the like heart (a deliberate choice over an icon-font heart, per `LikeRow.tsx`), `♪` before a song title, `📍` before a location label.
- No emoji is used anywhere in system/UI copy.
- Outline vs. filled Ionicon variants mark active/inactive state (bottom-tab icons, like/bookmark toggle) rather than a color change alone.

## Intentional additions
None beyond the app's own component inventory — `Button`, `IconButton`, and `Avatar` already exist 1:1 in `app/components/`, so no substitute primitives were invented.

## Caveats / open questions for you
- **No web/marketing surface exists in the source repo** — this system covers the mobile app only. If Keeps grows a website, that would need its own exploration pass.
- **Fonts:** the app deliberately uses the OS system font (see `theme/tokens.ts`'s comment "Nothing outside this file should hardcode..."), so no webfont substitution was needed or made.
- **Icon set:** Ionicons v4 is loaded from a public CDN as an approximation of the exact `@expo/vector-icons` build the app ships — glyph names match, but flag if a specific glyph looks off and I can adjust.
- The screenshot `IMG_6052.PNG` attached to the repo turned out to be an unrelated Instagram screenshot, not a Keeps app screen — it was not used as a source for anything here.

**Please iterate with me** — tell me if the accent green, the sharp-corner media treatment, or any component reads wrong against the real app, and I'll tighten it up.
