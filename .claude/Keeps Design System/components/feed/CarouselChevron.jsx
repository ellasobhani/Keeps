import React from "react";

export function CarouselChevron({ direction = "right" }) {
  return (
    <div style={{ position: "absolute", top: "50%", marginTop: -12, [direction === "left" ? "left" : "right"]: "var(--space-sm)", width: 24, height: 24, borderRadius: "var(--radius-pill)", background: "var(--color-icon-badge)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <i className={`icon ion-ios-arrow-${direction === "left" ? "back" : "forward"}`} style={{ fontSize: 12, color: "#fff" }}></i>
    </div>
  );
}
