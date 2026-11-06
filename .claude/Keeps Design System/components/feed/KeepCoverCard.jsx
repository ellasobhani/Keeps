import React from "react";

export function KeepCoverCard({ title, coverSrc, isPrivate, hiddenFromProfile, onClick }) {
  return (
    <div onClick={onClick} style={{ cursor: "pointer", width: 160, fontFamily: "var(--font-system)" }}>
      <div style={{ width: 160, height: 160, background: "var(--surface-card)", border: coverSrc ? "none" : "1px solid var(--border-hairline)", backgroundImage: coverSrc ? `url(${coverSrc})` : "none", backgroundSize: "cover", backgroundPosition: "center" }} />
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: "var(--space-sm)" }}>
        <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</span>
        {isPrivate && <i className="icon ion-ios-lock" style={{ fontSize: 12, color: "var(--text-primary)" }}></i>}
        {hiddenFromProfile && <i className="icon ion-ios-eye-off" style={{ fontSize: 12, color: "var(--text-secondary)" }}></i>}
      </div>
    </div>
  );
}
