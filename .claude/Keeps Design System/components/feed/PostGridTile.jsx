import React from "react";

export function PostGridTile({ src, mediaCount = 1, isVideo, onClick }) {
  return (
    <div onClick={onClick} style={{ position: "relative", width: "100%", aspectRatio: "1", background: "var(--surface-card)", cursor: "pointer", overflow: "hidden" }}>
      {src && <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
      {isVideo && (
        <div style={{ position: "absolute", left: "var(--space-xs)", bottom: "var(--space-xs)", width: 18, height: 18, borderRadius: "50%", background: "var(--color-icon-badge)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <i className="icon ion-ios-play" style={{ fontSize: 9, color: "#fff" }}></i>
        </div>
      )}
      {mediaCount > 1 && (
        <div style={{ position: "absolute", top: "var(--space-xs)", right: "var(--space-xs)", width: 20, height: 20, borderRadius: "50%", background: "var(--color-icon-badge)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <i className="icon ion-ios-copy" style={{ fontSize: 11, color: "#fff" }}></i>
        </div>
      )}
    </div>
  );
}
