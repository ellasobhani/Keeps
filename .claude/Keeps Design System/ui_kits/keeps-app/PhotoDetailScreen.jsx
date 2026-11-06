function PhotoDetailScreen({ post, onBack }) {
  const { IconButton, LikeRow, CommentThread, CommentComposer } = window.KeepsDesignSystem_5fa74b;
  const [liked, setLiked] = React.useState(post.likes.length > 0);
  const [likes, setLikes] = React.useState(post.likes);
  const [favorited, setFavorited] = React.useState(false);
  const [draft, setDraft] = React.useState("");
  const [comments, setComments] = React.useState(post.comments);
  const submit = () => { if (!draft.trim()) return; setComments([...comments, { author: "You", body: draft.trim() }]); setDraft(""); };
  const toggleLike = () => { setLiked(!liked); setLikes(liked ? likes.filter((n) => n !== "You") : [...likes, "You"]); };
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "var(--bg-page)", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", padding: "var(--space-sm) var(--space-md)" }}>
        <IconButton icon="ios-arrow-back" onClick={onBack} />
      </div>
      <div style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ width: "100%", aspectRatio: 1, background: "var(--surface-card)", position: "relative" }}>
          {post.mediaCount > 1 && <div style={{ position: "absolute", top: "50%", right: "var(--space-sm)", marginTop: -12, width: 24, height: 24, borderRadius: "50%", background: "var(--color-icon-badge)", display: "flex", alignItems: "center", justifyContent: "center" }}><i className="icon ion-ios-arrow-forward" style={{ fontSize: 12, color: "#fff" }}></i></div>}
        </div>
        <div style={{ padding: "var(--space-sm) var(--space-lg) var(--space-lg)", display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
          <LikeRow likedByNames={likes} hasLiked={liked} isFavorited={favorited} onToggleLike={toggleLike} onToggleFavorite={() => setFavorited(!favorited)} />
          {post.caption && <div style={{ fontSize: "var(--text-sm)", color: "var(--text-primary)" }}><span style={{ fontWeight: "var(--weight-bold)" }}>{post.author} </span>{post.caption}</div>}
          <div style={{ height: 1, background: "var(--border-hairline)" }} />
          <CommentThread comments={comments} />
        </div>
      </div>
      <CommentComposer value={draft} onChange={setDraft} onSubmit={submit} />
    </div>
  );
}
window.PhotoDetailScreen = PhotoDetailScreen;
