import React from "react";

export function CoverPhotoPicker({ src, onClick }) {
  return (
    <div onClick={onClick} style={{ aspectRatio: "1", background: "var(--surface-card)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative", cursor: "pointer", fontFamily: "var(--font-system)" }}>
      {src ? (
        <React.Fragment>
          <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{ position: "absolute", bottom: "var(--space-sm)", right: "var(--space-sm)", width: 24, height: 24, borderRadius: "var(--radius-pill)", background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <i className="icon ion-ios-camera" style={{ fontSize: 12, color: "#fff" }}></i>
          </div>
        </React.Fragment>
      ) : (
        <div style={{ width: "100%", height: "100%", border: "1px dashed var(--border-hairline)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "var(--space-sm)" }}>
          <i className="icon ion-ios-images" style={{ fontSize: 40, color: "var(--text-secondary)" }}></i>
          <span style={{ color: "var(--text-secondary)", fontSize: "var(--text-md)" }}>Add cover photo</span>
        </div>
      )}
    </div>
  );
}
