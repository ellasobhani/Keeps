Right-edge slide-in panel opened from the hamburger icon on Profile. A dark scrim behind it dismisses on tap. Sign out is pinned to the bottom in red, separated from the regular nav items above it.

```jsx
<SideMenu
  open={isOpen}
  onClose={() => setOpen(false)}
  items={[{ key: "notifications", label: "Notifications", icon: "ios-heart-outline", onClick: goNotifications }]}
  onSignOut={handleSignOut}
/>
```
