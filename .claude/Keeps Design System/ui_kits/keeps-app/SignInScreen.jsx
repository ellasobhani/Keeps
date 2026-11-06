function SignInScreen({ onSignIn }) {
  const [email, setEmail] = React.useState("");
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "var(--space-lg)", background: "var(--bg-page)" }}>
      <div style={{ fontSize: "var(--text-xxl)", fontWeight: "var(--weight-bold)", color: "var(--text-primary)", marginBottom: "var(--space-sm)" }}>Keeps</div>
      <div style={{ fontSize: "var(--text-md)", color: "var(--text-secondary)", marginBottom: "var(--space-lg)" }}>Enter your email and we'll send you a sign-in code.</div>
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        style={{ border: "1px solid var(--border-hairline)", borderRadius: "var(--radius-md)", padding: "var(--space-md)", fontSize: "var(--text-md)", color: "var(--text-primary)", marginBottom: "var(--space-md)", fontFamily: "var(--font-system)" }}
      />
      <div
        onClick={() => email && onSignIn()}
        style={{ background: "var(--accent)", borderRadius: "var(--radius-md)", padding: "var(--space-md)", textAlign: "center", color: "var(--text-inverse)", fontSize: "var(--text-md)", fontWeight: "var(--weight-medium)", cursor: "pointer", opacity: email ? 1 : 0.5 }}
      >Send code</div>
    </div>
  );
}
window.SignInScreen = SignInScreen;
