function FeedScreen({ onOpenPost, onNavigate }) {
  const { Avatar, BottomNavBar } = window.KeepsDesignSystem_5fa74b;
  const { posts } = window.KeepsMockData;
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "var(--bg-page)", overflow: "hidden" }}>
      <div style={{ flex: 1, overflowY: "auto", padding: "var(--space-lg)" }}>
        {posts.map((p) => (
          <div key={p.id} onClick={() => onOpenPost(p)} style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)", paddingBottom: "var(--space-md)", marginBottom: "var(--space-md)", borderBottom: "1px solid var(--border-hairline)", cursor: "pointer" }}>
            <Avatar displayName={p.author} size={40} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "var(--text-sm)" }}>
                <span style={{ fontWeight: "var(--weight-bold)", color: "var(--text-primary)" }}>{p.author}</span>
                <span style={{ color: "var(--text-secondary)" }}> · {p.keep}</span>
              </div>
              {p.caption && <div style={{ fontSize: "var(--text-sm)", color: "var(--text-primary)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}><span style={{ fontWeight: "var(--weight-bold)" }}>{p.author} </span>{p.caption}</div>}
              <div style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)", marginTop: "var(--space-xs)" }}>{p.time}</div>
            </div>
            <div style={{ width: 56, height: 56, background: "var(--surface-card)", position: "relative", flexShrink: 0 }}>
              {p.mediaCount > 1 && <div style={{ position: "absolute", top: 4, right: 4, width: 18, height: 18, borderRadius: "50%", background: "var(--color-icon-badge)" }} />}
            </div>
          </div>
        ))}
      </div>
      <BottomNavBar active="feed" onNavigate={onNavigate} />
    </div>
  );
}
window.FeedScreen = FeedScreen;
