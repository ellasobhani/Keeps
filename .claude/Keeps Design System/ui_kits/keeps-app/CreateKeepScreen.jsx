function CreateKeepScreen({ onCancel, onCreate }) {
  const { Button, CoverPhotoPicker } = window.KeepsDesignSystem_5fa74b;
  const [title, setTitle] = React.useState("");
  const [privacy, setPrivacy] = React.useState("private");
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "var(--bg-page)", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--space-md) var(--space-lg) 0" }}>
        <span onClick={onCancel} style={{ fontSize: "var(--text-md)", color: "var(--text-secondary)", cursor: "pointer" }}>Cancel</span>
        <span style={{ fontSize: "var(--text-md)", fontWeight: "var(--weight-bold)", color: "var(--text-primary)" }}>New keep</span>
        <span style={{ width: 46 }} />
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "var(--space-lg)" }}>
        <div style={{ fontSize: "var(--text-sm)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", marginBottom: "var(--space-xs)" }}>Title</div>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Spring Break 2026" style={{ width: "100%", boxSizing: "border-box", border: "1px solid var(--border-hairline)", borderRadius: "var(--radius-xs)", padding: "var(--space-md)", fontSize: "var(--text-md)", marginBottom: "var(--space-md)", fontFamily: "var(--font-system)" }} />
        <div style={{ fontSize: "var(--text-sm)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", marginBottom: "var(--space-xs)" }}>Cover photo</div>
        <div style={{ marginBottom: "var(--space-md)" }}><CoverPhotoPicker /></div>
        <div style={{ fontSize: "var(--text-sm)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", marginBottom: "var(--space-xs)" }}>Privacy</div>
        <div style={{ display: "flex", gap: "var(--space-sm)", marginBottom: "var(--space-lg)" }}>
          {["private", "public"].map((mode) => (
            <div key={mode} onClick={() => setPrivacy(mode)} style={{ flex: 1, textAlign: "center", border: `1px solid ${privacy === mode ? "var(--accent)" : "var(--border-hairline)"}`, background: privacy === mode ? "var(--accent-muted)" : "transparent", borderRadius: "var(--radius-xs)", padding: "var(--space-sm)", color: privacy === mode ? "var(--accent)" : "var(--text-secondary)", fontWeight: "var(--weight-medium)", cursor: "pointer", textTransform: "capitalize" }}>{mode}</div>
          ))}
        </div>
        <Button label="Create keep" disabled={!title.trim()} onClick={() => title.trim() && onCreate()} />
      </div>
    </div>
  );
}
window.CreateKeepScreen = CreateKeepScreen;
