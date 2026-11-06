import React from "react";

export function IconButton({ icon, size = 40, variant = "plain", color, disabled, onClick, style }) {
  const isSolid = variant === "solid";
  const iconSize = Math.round(size * (isSolid ? 0.46 : 0.5));
  const restBg = isSolid ? "var(--text-primary)" : "var(--surface-card)";
  const pressBg = isSolid ? "var(--text-primary)" : "var(--accent-muted)";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: size, height: size, borderRadius: "50%",
        display: "flex", alignItems: "center", justifyContent: "center",
        border: isSolid ? "none" : "1px solid var(--border-hairline)",
        cursor: "pointer", padding: 0,
        background: restBg,
        opacity: disabled ? 0.4 : 1,
        transition: "background .12s, transform .12s",
        ...style,
      }}
      onMouseDown={(e) => { if (!disabled) { e.currentTarget.style.background = pressBg; e.currentTarget.style.transform = "scale(0.92)"; } }}
      onMouseUp={(e) => { if (!disabled) { e.currentTarget.style.background = restBg; e.currentTarget.style.transform = "scale(1)"; } }}
      onMouseLeave={(e) => { if (!disabled) { e.currentTarget.style.background = restBg; e.currentTarget.style.transform = "scale(1)"; } }}
    >
      <i className={`icon ion-${icon}`} style={{ fontSize: iconSize, color: color ?? (isSolid ? "var(--text-inverse)" : "var(--text-primary)"), lineHeight: 1 }}></i>
    </button>
  );
}
