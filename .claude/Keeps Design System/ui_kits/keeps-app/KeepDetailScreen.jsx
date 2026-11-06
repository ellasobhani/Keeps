function KeepDetailScreen({ keep, onBack, onOpenPost, onAddPost }) {
  const { IconButton } = window.KeepsDesignSystem_5fa74b;
  const { posts } = window.KeepsMockData;
  const keepPosts = posts.filter((p) => p.keep === keep.title);
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "var(--bg-page)", overflow: "hidden", position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", padding: "var(--space-sm) var(--space-md)" }}>
        <IconButton icon="ios-arrow-back" onClick={onBack} />
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "0 var(--space-lg) var(--space-lg)" }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: "var(--space-sm)" }}>
          <span style={{ flex: 1, fontSize: "var(--text-xl)", fontWeight: "var(--weight-bold)", color: "var(--text-primary)" }}>{keep.title}</span>
          {keep.isPrivate && <i className="icon ion-ios-lock" style={{ fontSize: 16, marginLeft: 4 }}></i>}
        </div>
        <div style={{ height: 1, background: "var(--border-hairline)", marginBottom: "var(--space-md)" }} />
        {keepPosts.length === 0 && <div style={{ fontSize: "var(--text-md)", color: "var(--text-secondary)" }}>No posts yet — tap + below to add the first one.</div>}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "var(--space-xs)" }}>
          {keepPosts.map((p) => (
            <div key={p.id} onClick={() => onOpenPost(p)} style={{ aspectRatio: 1, background: "var(--surface-card)", cursor: "pointer", position: "relative" }}>
              {p.mediaCount > 1 && <div style={{ position: "absolute", top: 4, right: 4, width: 20, height: 20, borderRadius: "50%", background: "var(--color-icon-badge)" }} />}
            </div>
          ))}
        </div>
      </div>
      <IconButton icon="ios-add" variant="solid" size={56} onClick={onAddPost} style={{ position: "absolute", right: "var(--space-lg)", bottom: "var(--space-lg)", boxShadow: "0 2px 4px rgba(0,0,0,0.2)" }} />
    </div>
  );
}
window.KeepDetailScreen = KeepDetailScreen;
