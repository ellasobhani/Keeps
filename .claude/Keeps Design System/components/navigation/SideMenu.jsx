import React from "react";

export function SideMenu({ open, onClose, items = [], onSignOut }) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, fontFamily: "var(--font-system)" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "var(--color-scrim)" }} />
      <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 260, background: "var(--bg-page)", borderLeft: "1px solid var(--border-hairline)", padding: "var(--space-lg)", display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1 }}>
          {items.map((item) => (
            <div key={item.key} onClick={item.onClick} style={{ display: "flex", alignItems: "center", gap: "var(--space-md)", padding: "var(--space-md) 0", cursor: "pointer" }}>
              <i className={`icon ion-${item.icon}`} style={{ fontSize: 20, color: "var(--text-primary)" }}></i>
              <span style={{ fontSize: "var(--text-md)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>{item.label}</span>
            </div>
          ))}
        </div>
        <div onClick={onSignOut} style={{ display: "flex", alignItems: "center", gap: "var(--space-md)", padding: "var(--space-md) 0", cursor: "pointer" }}>
          <i className="icon ion-ios-log-out" style={{ fontSize: 20, color: "var(--danger)" }}></i>
          <span style={{ fontSize: "var(--text-md)", fontWeight: "var(--weight-medium)", color: "var(--danger)" }}>Sign out</span>
        </div>
      </div>
    </div>
  );
}
