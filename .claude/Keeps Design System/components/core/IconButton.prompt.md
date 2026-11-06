Icon-only tappable control, used throughout headers and overlays. `solid` is a filled black circle — the primary affordance (add keep, add post FAB). `plain` sits on a soft hairline-bordered surface-tint circle (not a bare floating glyph) so every icon button reads as a real tappable target, even over photo content. Press state fills the circle with the muted accent tint and dips scale slightly.

```jsx
<IconButton icon="ios-add" variant="solid" size={56} onClick={addPost} />
<IconButton icon="ios-menu" onClick={openMenu} />
```

Icons come from Ionicons v4 (`ion-ios-<name>` class, e.g. `ios-heart`, `ios-search`, `ios-log-out`) — most glyphs have only one style, so active/inactive state is conveyed by color, not by swapping to an "-outline" variant (few icons have one). Press state dims to 60% opacity; disabled to 40%.
