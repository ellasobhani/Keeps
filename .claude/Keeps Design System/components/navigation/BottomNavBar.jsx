import React from "react";

export function BottomNavBar({ active = "feed", onNavigate }) {
  const tabs = [
    { key: "profile", icon: "ios-person" },
    { key: "feed", icon: "ios-paper" },
    { key: "search", icon: "ios-search" },
  ];
  return (
    <div style={{ display: "flex", borderTop: "1px solid var(--border-hairline)", background: "var(--bg-page)", paddingTop: "var(--space-sm)", paddingBottom: "var(--space-md)" }}>
      {tabs.map((t) => (
        <div key={t.key} onClick={() => onNavigate && onNavigate(t.key)} style={{ flex: 1, display: "flex", justifyContent: "center", cursor: "pointer" }}>
          <i className={`icon ion-${t.icon}`} style={{ fontSize: 24, color: active === t.key ? "var(--text-primary)" : "var(--text-secondary)" }}></i>
        </div>
      ))}
    </div>
  );
}
