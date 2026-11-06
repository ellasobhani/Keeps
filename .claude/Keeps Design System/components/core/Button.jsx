import React from "react";

const base = {
  borderRadius: "var(--radius-pill)",
  padding: "14px 28px",
  fontSize: "var(--text-md)",
  fontWeight: "var(--weight-bold)",
  border: "none",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: "var(--font-system)",
  transition: "transform .12s, background .12s",
};

const variants = {
  primary: { background: "var(--text-primary)", color: "var(--text-inverse)" },
  secondary: { background: "var(--surface-card)", color: "var(--text-primary)", border: "1px solid var(--border-hairline)", padding: "13px 27px" },
  text: { background: "transparent", color: "var(--accent)", padding: "8px 0", borderRadius: 0 },
  danger: { background: "var(--danger)", color: "var(--text-inverse)" },
};

const pressBg = {
  primary: "#3a3a38",
  secondary: "var(--accent-muted)",
  text: "transparent",
  danger: "#96201a",
};

export function Button({ label, variant = "primary", disabled, loading, onClick, style }) {
  const isDisabled = disabled || loading;
  const rest = variants[variant].background;
  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      style={{ ...base, ...variants[variant], opacity: isDisabled ? 0.4 : 1, ...style }}
      onMouseDown={(e) => { if (!isDisabled) { e.currentTarget.style.background = pressBg[variant]; e.currentTarget.style.transform = "scale(0.97)"; } }}
      onMouseUp={(e) => { if (!isDisabled) { e.currentTarget.style.background = rest; e.currentTarget.style.transform = "scale(1)"; } }}
      onMouseLeave={(e) => { if (!isDisabled) { e.currentTarget.style.background = rest; e.currentTarget.style.transform = "scale(1)"; } }}
    >
      {loading ? "…" : label}
    </button>
  );
}
