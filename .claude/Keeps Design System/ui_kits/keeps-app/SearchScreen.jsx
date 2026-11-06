function SearchScreen({ onNavigate }) {
  const { BottomNavBar } = window.KeepsDesignSystem_5fa74b;
  const { keeps, profile } = window.KeepsMockData;
  const [q, setQ] = React.useState("");
  const results = q ? keeps.filter((k) => k.title.toLowerCase().includes(q.toLowerCase())) : [];
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "var(--bg-page)", overflow: "hidden" }}>
      <div style={{ flex: 1, overflowY: "auto", padding: "var(--space-lg)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)", border: "1px solid var(--border-hairline)", borderRadius: "var(--radius-xs)", padding: "0 var(--space-md)" }}>
          <i className="icon ion-ios-search" style={{ color: "var(--text-secondary)", fontSize: 16 }}></i>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search keeps and people" style={{ flex: 1, border: "none", padding: "var(--space-md) 0", fontSize: "var(--text-md)", fontFamily: "var(--font-system)", outline: "none" }} />
        </div>
        {q.length === 0 && <div style={{ marginTop: "var(--space-lg)", fontSize: "var(--text-md)", color: "var(--text-secondary)" }}>Search for a keep or a handle.</div>}
        {q.length > 0 && (
          <div style={{ marginTop: "var(--space-md)" }}>
            <div style={{ fontSize: "var(--text-sm)", fontWeight: "var(--weight-medium)", color: "var(--text-secondary)", marginBottom: "var(--space-xs)" }}>Keeps</div>
            {results.length === 0 && <div style={{ fontSize: "var(--text-md)", color: "var(--text-secondary)" }}>No results for "{q}".</div>}
            {results.map((k) => (
              <div key={k.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "var(--space-md) 0", borderBottom: "1px solid var(--border-hairline)" }}>
                <span style={{ fontSize: "var(--text-md)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>{k.title}</span>
                {k.isPrivate && <i className="icon ion-ios-lock" style={{ fontSize: 14, color: "var(--text-secondary)" }}></i>}
              </div>
            ))}
          </div>
        )}
      </div>
      <BottomNavBar active="search" onNavigate={onNavigate} />
    </div>
  );
}
window.SearchScreen = SearchScreen;
