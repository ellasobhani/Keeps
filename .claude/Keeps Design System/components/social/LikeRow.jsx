import React from "react";

export function LikeRow({ likedByNames = [], hasLiked, isFavorited, onToggleLike, onToggleFavorite, onNameClick }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)", fontFamily: "var(--font-system)" }}>
      <span onClick={onToggleLike} style={{ fontSize: "var(--text-xl)", color: hasLiked ? "var(--danger)" : "var(--text-secondary)", cursor: "pointer", lineHeight: 1 }}>{hasLiked ? "♥" : "♡"}</span>
      <span style={{ flex: 1, fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>
        {likedByNames.length === 0 ? "No likes yet" : (
          <React.Fragment>
            Liked by{" "}
            {likedByNames.map((name, i) => (
              <React.Fragment key={name}>
                <span onClick={() => onNameClick && onNameClick(name)} style={{ fontWeight: "var(--weight-medium)", color: "var(--text-primary)", cursor: "pointer" }}>{name}</span>
                {i < likedByNames.length - 2 ? ", " : i === likedByNames.length - 2 ? " and " : ""}
              </React.Fragment>
            ))}
          </React.Fragment>
        )}
      </span>
      <i onClick={onToggleFavorite} className="icon ion-ios-bookmark" style={{ fontSize: 22, color: isFavorited ? "var(--text-primary)" : "var(--text-secondary)", cursor: "pointer" }}></i>
    </div>
  );
}
