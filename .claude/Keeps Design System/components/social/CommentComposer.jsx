import React from "react";

export function CommentComposer({ value = "", onChange, onSubmit, placeholder = "Add a comment..." }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "var(--space-sm)", padding: "var(--space-sm) var(--space-lg)", borderTop: "1px solid var(--border-hairline)", background: "var(--bg-page)", fontFamily: "var(--font-system)" }}>
      <textarea
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
        placeholder={placeholder}
        rows={1}
        style={{ flex: 1, border: "1px solid var(--border-hairline)", borderRadius: "var(--radius-xs)", padding: "var(--space-sm) var(--space-md)", fontSize: "var(--text-sm)", color: "var(--text-primary)", fontFamily: "var(--font-system)", resize: "none", maxHeight: 100 }}
      />
      <span onClick={() => value.trim() && onSubmit && onSubmit()} style={{ padding: "10px 4px", fontSize: "var(--text-sm)", fontWeight: "var(--weight-bold)", letterSpacing: "var(--tracking-wide)", textTransform: "uppercase", color: "var(--accent)", opacity: value.trim() ? 1 : 0.4, cursor: value.trim() ? "pointer" : "default" }}>Post</span>
    </div>
  );
}
