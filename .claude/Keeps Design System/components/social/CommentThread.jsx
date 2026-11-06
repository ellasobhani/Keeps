import React from "react";

export function CommentThread({ comments = [] }) {
  if (comments.length === 0) {
    return <div style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)", fontFamily: "var(--font-system)" }}>No comments yet.</div>;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)", fontFamily: "var(--font-system)" }}>
      {comments.map((c, i) => (
        <div key={i} style={{ padding: "var(--space-xs) 0" }}>
          <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--weight-bold)", color: "var(--text-primary)" }}>{c.author} </span>
          <span style={{ fontSize: "var(--text-sm)", color: "var(--text-primary)" }}>{c.body}</span>
        </div>
      ))}
    </div>
  );
}
