import React from "react";

export function Avatar({ src, displayName = "", size = 72 }) {
  const initial = (displayName.trim().charAt(0) || "?").toUpperCase();
  const dim = { width: size, height: size, borderRadius: "50%" };
  return src ? (
    <img src={src} alt={displayName} style={{ ...dim, objectFit: "cover", background: "var(--surface-card)" }} />
  ) : (
    <div style={{ ...dim, background: "var(--surface-card)", border: "1px solid var(--border-hairline)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ fontSize: size * 0.4, fontWeight: "var(--weight-bold)", color: "var(--text-secondary)", fontFamily: "var(--font-system)" }}>{initial}</span>
    </div>
  );
}
