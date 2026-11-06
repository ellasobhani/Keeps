Private-keep engagement is names, not counts — "Liked by Maya and 3 others" reads as a real social signal among friends; a bare number wouldn't. Each name is individually tappable to that person's profile. Bookmark icon on the right is a personal favorite, independent from liking.

```jsx
<LikeRow likedByNames={["Maya", "Shawn"]} hasLiked isFavorited={false} onToggleLike={toggle} />
```

Heart glyphs are plain serif ♥/♡ characters (not an icon-font heart) — filled red when liked, outline gray otherwise.
