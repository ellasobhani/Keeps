function ProfileScreen({ onOpenKeep, onNavigate }) {
  const { Avatar, IconButton, KeepCoverCard, BottomNavBar, SideMenu } = window.KeepsDesignSystem_5fa74b;
  const { profile, keeps } = window.KeepsMockData;
  const [menuOpen, setMenuOpen] = React.useState(false);
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "var(--bg-page)", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4, padding: "var(--space-sm) var(--space-lg)" }}>
        <IconButton icon="ios-eye" />
        <IconButton icon="ios-menu" onClick={() => setMenuOpen(true)} />
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "0 var(--space-lg) var(--space-lg)" }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: "var(--space-md)" }}>
          <Avatar displayName={profile.displayName} size={76} />
          <div style={{ flex: 1, display: "flex", justifyContent: "space-around", marginLeft: "var(--space-lg)" }}>
            <div style={{ textAlign: "center" }}><div style={{ fontSize: "var(--text-lg)", fontWeight: "var(--weight-bold)", color: "var(--text-primary)" }}>{keeps.length}</div><div style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>keeps</div></div>
            <div style={{ textAlign: "center" }}><div style={{ fontSize: "var(--text-lg)", fontWeight: "var(--weight-bold)", color: "var(--text-primary)" }}>{profile.followerCount}</div><div style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>followers</div></div>
            <div style={{ textAlign: "center" }}><div style={{ fontSize: "var(--text-lg)", fontWeight: "var(--weight-bold)", color: "var(--text-primary)" }}>{profile.followingCount}</div><div style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>following</div></div>
          </div>
        </div>
        <div style={{ fontSize: "var(--text-md)", fontWeight: "var(--weight-bold)", color: "var(--text-primary)" }}>{profile.displayName}</div>
        <div style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)", marginTop: 2 }}>@{profile.handle}</div>
        <div style={{ fontSize: "var(--text-sm)", color: "var(--text-primary)", marginTop: "var(--space-sm)" }}>{profile.bio}</div>
        <div style={{ height: 1, background: "var(--border-hairline)", marginTop: "var(--space-lg)", marginBottom: "var(--space-md)" }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-sm)" }}>
          {keeps.map((k) => (
            <div key={k.id} style={{ width: "100%" }}>
              <div onClick={() => onOpenKeep(k)} style={{ cursor: "pointer" }}>
                <div style={{ width: "100%", aspectRatio: 1, background: k.color }} />
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: "var(--space-sm)" }}>
                  <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{k.title}</span>
                  {k.isPrivate && <i className="icon ion-ios-lock" style={{ fontSize: 12 }}></i>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <BottomNavBar active="profile" onNavigate={onNavigate} />
      <SideMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        items={[
          { key: "notifications", label: "Notifications", icon: "ios-heart", onClick: () => setMenuOpen(false) },
          { key: "favorites", label: "Favorites", icon: "ios-bookmark", onClick: () => setMenuOpen(false) },
          { key: "invites", label: "Invites", icon: "ios-people", onClick: () => setMenuOpen(false) },
          { key: "share", label: "Share profile", icon: "ios-share", onClick: () => setMenuOpen(false) },
          { key: "settings", label: "Profile settings", icon: "ios-settings", onClick: () => setMenuOpen(false) },
        ]}
        onSignOut={() => setMenuOpen(false)}
      />
    </div>
  );
}
window.ProfileScreen = ProfileScreen;
