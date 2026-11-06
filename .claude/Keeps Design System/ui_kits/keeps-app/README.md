# Keeps mobile app UI kit

Interactive recreation of the Keeps React Native app's core loop: sign in → profile (keeps grid) → feed → keep detail (post grid) → photo detail (likes/comments) → search, plus the create-keep flow. Built from `ellasobhani/Keeps` screen source (`app/screens/*.tsx`), not screenshots.

Composes the design system's `core`, `feed`, `navigation`, `social`, and `forms` components — no primitive is re-implemented here.

Not modeled (out of MVP scope per `mvp_spec.md`): public-mode counts/threaded replies, collaborative co-owner management, notifications/invites tabs, the multi-step AddPost media picker/editor. Content is fake/representative, not real data.
