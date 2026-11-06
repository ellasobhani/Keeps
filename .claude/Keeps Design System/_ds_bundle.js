/* @ds-bundle: {"format":4,"namespace":"KeepsDesignSystem_5fa74b","components":[{"name":"Avatar","sourcePath":"components/core/Avatar.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"IconButton","sourcePath":"components/core/IconButton.jsx"},{"name":"CarouselChevron","sourcePath":"components/feed/CarouselChevron.jsx"},{"name":"KeepCoverCard","sourcePath":"components/feed/KeepCoverCard.jsx"},{"name":"PostGridTile","sourcePath":"components/feed/PostGridTile.jsx"},{"name":"CoverPhotoPicker","sourcePath":"components/forms/CoverPhotoPicker.jsx"},{"name":"BottomNavBar","sourcePath":"components/navigation/BottomNavBar.jsx"},{"name":"SideMenu","sourcePath":"components/navigation/SideMenu.jsx"},{"name":"CommentComposer","sourcePath":"components/social/CommentComposer.jsx"},{"name":"CommentThread","sourcePath":"components/social/CommentThread.jsx"},{"name":"LikeRow","sourcePath":"components/social/LikeRow.jsx"}],"sourceHashes":{"components/core/Avatar.jsx":"ce87508de7da","components/core/Button.jsx":"5cae61886f5f","components/core/IconButton.jsx":"6c2697f76d52","components/feed/CarouselChevron.jsx":"e9f4d96c4bdf","components/feed/KeepCoverCard.jsx":"2074e95f592d","components/feed/PostGridTile.jsx":"d65de6ab32de","components/forms/CoverPhotoPicker.jsx":"3543f6f51ad3","components/navigation/BottomNavBar.jsx":"02e0110576a2","components/navigation/SideMenu.jsx":"0b8d8eb4a389","components/social/CommentComposer.jsx":"5eb8c0976016","components/social/CommentThread.jsx":"ad0e0f25db2d","components/social/LikeRow.jsx":"cb03b0028f89","ui_kits/keeps-app/App.jsx":"b72788720b93","ui_kits/keeps-app/CreateKeepScreen.jsx":"c9d149580464","ui_kits/keeps-app/FeedScreen.jsx":"57f3858ad235","ui_kits/keeps-app/KeepDetailScreen.jsx":"77334bdbc9b2","ui_kits/keeps-app/PhotoDetailScreen.jsx":"f527939106d3","ui_kits/keeps-app/ProfileScreen.jsx":"8c5af01daffc","ui_kits/keeps-app/SearchScreen.jsx":"630dd5b82096","ui_kits/keeps-app/SignInScreen.jsx":"5433f1a6117e","ui_kits/keeps-app/mockData.js":"415233d3f7ed"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.KeepsDesignSystem_5fa74b = window.KeepsDesignSystem_5fa74b || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Avatar.jsx
try { (() => {
function Avatar({
  src,
  displayName = "",
  size = 72
}) {
  const initial = (displayName.trim().charAt(0) || "?").toUpperCase();
  const dim = {
    width: size,
    height: size,
    borderRadius: "50%"
  };
  return src ? /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: displayName,
    style: {
      ...dim,
      objectFit: "cover",
      background: "var(--surface-card)"
    }
  }) : /*#__PURE__*/React.createElement("div", {
    style: {
      ...dim,
      background: "var(--surface-card)",
      border: "1px solid var(--border-hairline)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: size * 0.4,
      fontWeight: "var(--weight-bold)",
      color: "var(--text-secondary)",
      fontFamily: "var(--font-system)"
    }
  }, initial));
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
const base = {
  borderRadius: "var(--radius-pill)",
  padding: "14px 28px",
  fontSize: "var(--text-md)",
  fontWeight: "var(--weight-bold)",
  border: "none",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: "var(--font-system)",
  transition: "transform .12s, background .12s"
};
const variants = {
  primary: {
    background: "var(--text-primary)",
    color: "var(--text-inverse)"
  },
  secondary: {
    background: "var(--surface-card)",
    color: "var(--text-primary)",
    border: "1px solid var(--border-hairline)",
    padding: "13px 27px"
  },
  text: {
    background: "transparent",
    color: "var(--accent)",
    padding: "8px 0",
    borderRadius: 0
  },
  danger: {
    background: "var(--danger)",
    color: "var(--text-inverse)"
  }
};
const pressBg = {
  primary: "#3a3a38",
  secondary: "var(--accent-muted)",
  text: "transparent",
  danger: "#96201a"
};
function Button({
  label,
  variant = "primary",
  disabled,
  loading,
  onClick,
  style
}) {
  const isDisabled = disabled || loading;
  const rest = variants[variant].background;
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    disabled: isDisabled,
    style: {
      ...base,
      ...variants[variant],
      opacity: isDisabled ? 0.4 : 1,
      ...style
    },
    onMouseDown: e => {
      if (!isDisabled) {
        e.currentTarget.style.background = pressBg[variant];
        e.currentTarget.style.transform = "scale(0.97)";
      }
    },
    onMouseUp: e => {
      if (!isDisabled) {
        e.currentTarget.style.background = rest;
        e.currentTarget.style.transform = "scale(1)";
      }
    },
    onMouseLeave: e => {
      if (!isDisabled) {
        e.currentTarget.style.background = rest;
        e.currentTarget.style.transform = "scale(1)";
      }
    }
  }, loading ? "…" : label);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/IconButton.jsx
try { (() => {
function IconButton({
  icon,
  size = 40,
  variant = "plain",
  color,
  disabled,
  onClick,
  style
}) {
  const isSolid = variant === "solid";
  const iconSize = Math.round(size * (isSolid ? 0.46 : 0.5));
  const restBg = isSolid ? "var(--text-primary)" : "var(--surface-card)";
  const pressBg = isSolid ? "var(--text-primary)" : "var(--accent-muted)";
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    disabled: disabled,
    style: {
      width: size,
      height: size,
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      border: isSolid ? "none" : "1px solid var(--border-hairline)",
      cursor: "pointer",
      padding: 0,
      background: restBg,
      opacity: disabled ? 0.4 : 1,
      transition: "background .12s, transform .12s",
      ...style
    },
    onMouseDown: e => {
      if (!disabled) {
        e.currentTarget.style.background = pressBg;
        e.currentTarget.style.transform = "scale(0.92)";
      }
    },
    onMouseUp: e => {
      if (!disabled) {
        e.currentTarget.style.background = restBg;
        e.currentTarget.style.transform = "scale(1)";
      }
    },
    onMouseLeave: e => {
      if (!disabled) {
        e.currentTarget.style.background = restBg;
        e.currentTarget.style.transform = "scale(1)";
      }
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: `icon ion-${icon}`,
    style: {
      fontSize: iconSize,
      color: color ?? (isSolid ? "var(--text-inverse)" : "var(--text-primary)"),
      lineHeight: 1
    }
  }));
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/feed/CarouselChevron.jsx
try { (() => {
function CarouselChevron({
  direction = "right"
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top: "50%",
      marginTop: -12,
      [direction === "left" ? "left" : "right"]: "var(--space-sm)",
      width: 24,
      height: 24,
      borderRadius: "var(--radius-pill)",
      background: "var(--color-icon-badge)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: `icon ion-ios-arrow-${direction === "left" ? "back" : "forward"}`,
    style: {
      fontSize: 12,
      color: "#fff"
    }
  }));
}
Object.assign(__ds_scope, { CarouselChevron });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feed/CarouselChevron.jsx", error: String((e && e.message) || e) }); }

// components/feed/KeepCoverCard.jsx
try { (() => {
function KeepCoverCard({
  title,
  coverSrc,
  isPrivate,
  hiddenFromProfile,
  onClick
}) {
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClick,
    style: {
      cursor: "pointer",
      width: 160,
      fontFamily: "var(--font-system)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 160,
      height: 160,
      background: "var(--surface-card)",
      border: coverSrc ? "none" : "1px solid var(--border-hairline)",
      backgroundImage: coverSrc ? `url(${coverSrc})` : "none",
      backgroundSize: "cover",
      backgroundPosition: "center"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 4,
      marginTop: "var(--space-sm)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--text-sm)",
      fontWeight: "var(--weight-medium)",
      color: "var(--text-primary)",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, title), isPrivate && /*#__PURE__*/React.createElement("i", {
    className: "icon ion-ios-lock",
    style: {
      fontSize: 12,
      color: "var(--text-primary)"
    }
  }), hiddenFromProfile && /*#__PURE__*/React.createElement("i", {
    className: "icon ion-ios-eye-off",
    style: {
      fontSize: 12,
      color: "var(--text-secondary)"
    }
  })));
}
Object.assign(__ds_scope, { KeepCoverCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feed/KeepCoverCard.jsx", error: String((e && e.message) || e) }); }

// components/feed/PostGridTile.jsx
try { (() => {
function PostGridTile({
  src,
  mediaCount = 1,
  isVideo,
  onClick
}) {
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClick,
    style: {
      position: "relative",
      width: "100%",
      aspectRatio: "1",
      background: "var(--surface-card)",
      cursor: "pointer",
      overflow: "hidden"
    }
  }, src && /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: "",
    style: {
      width: "100%",
      height: "100%",
      objectFit: "cover"
    }
  }), isVideo && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: "var(--space-xs)",
      bottom: "var(--space-xs)",
      width: 18,
      height: 18,
      borderRadius: "50%",
      background: "var(--color-icon-badge)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "icon ion-ios-play",
    style: {
      fontSize: 9,
      color: "#fff"
    }
  })), mediaCount > 1 && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top: "var(--space-xs)",
      right: "var(--space-xs)",
      width: 20,
      height: 20,
      borderRadius: "50%",
      background: "var(--color-icon-badge)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "icon ion-ios-copy",
    style: {
      fontSize: 11,
      color: "#fff"
    }
  })));
}
Object.assign(__ds_scope, { PostGridTile });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feed/PostGridTile.jsx", error: String((e && e.message) || e) }); }

// components/forms/CoverPhotoPicker.jsx
try { (() => {
function CoverPhotoPicker({
  src,
  onClick
}) {
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClick,
    style: {
      aspectRatio: "1",
      background: "var(--surface-card)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      position: "relative",
      cursor: "pointer",
      fontFamily: "var(--font-system)"
    }
  }, src ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: "",
    style: {
      width: "100%",
      height: "100%",
      objectFit: "cover"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      bottom: "var(--space-sm)",
      right: "var(--space-sm)",
      width: 24,
      height: 24,
      borderRadius: "var(--radius-pill)",
      background: "rgba(0,0,0,0.55)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "icon ion-ios-camera",
    style: {
      fontSize: 12,
      color: "#fff"
    }
  }))) : /*#__PURE__*/React.createElement("div", {
    style: {
      width: "100%",
      height: "100%",
      border: "1px dashed var(--border-hairline)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "var(--space-sm)"
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "icon ion-ios-images",
    style: {
      fontSize: 40,
      color: "var(--text-secondary)"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-secondary)",
      fontSize: "var(--text-md)"
    }
  }, "Add cover photo")));
}
Object.assign(__ds_scope, { CoverPhotoPicker });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/CoverPhotoPicker.jsx", error: String((e && e.message) || e) }); }

// components/navigation/BottomNavBar.jsx
try { (() => {
function BottomNavBar({
  active = "feed",
  onNavigate
}) {
  const tabs = [{
    key: "profile",
    icon: "ios-person"
  }, {
    key: "feed",
    icon: "ios-paper"
  }, {
    key: "search",
    icon: "ios-search"
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      borderTop: "1px solid var(--border-hairline)",
      background: "var(--bg-page)",
      paddingTop: "var(--space-sm)",
      paddingBottom: "var(--space-md)"
    }
  }, tabs.map(t => /*#__PURE__*/React.createElement("div", {
    key: t.key,
    onClick: () => onNavigate && onNavigate(t.key),
    style: {
      flex: 1,
      display: "flex",
      justifyContent: "center",
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: `icon ion-${t.icon}`,
    style: {
      fontSize: 24,
      color: active === t.key ? "var(--text-primary)" : "var(--text-secondary)"
    }
  }))));
}
Object.assign(__ds_scope, { BottomNavBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/BottomNavBar.jsx", error: String((e && e.message) || e) }); }

// components/navigation/SideMenu.jsx
try { (() => {
function SideMenu({
  open,
  onClose,
  items = [],
  onSignOut
}) {
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 50,
      fontFamily: "var(--font-system)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: onClose,
    style: {
      position: "absolute",
      inset: 0,
      background: "var(--color-scrim)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top: 0,
      right: 0,
      bottom: 0,
      width: 260,
      background: "var(--bg-page)",
      borderLeft: "1px solid var(--border-hairline)",
      padding: "var(--space-lg)",
      display: "flex",
      flexDirection: "column"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, items.map(item => /*#__PURE__*/React.createElement("div", {
    key: item.key,
    onClick: item.onClick,
    style: {
      display: "flex",
      alignItems: "center",
      gap: "var(--space-md)",
      padding: "var(--space-md) 0",
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: `icon ion-${item.icon}`,
    style: {
      fontSize: 20,
      color: "var(--text-primary)"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--text-md)",
      fontWeight: "var(--weight-medium)",
      color: "var(--text-primary)"
    }
  }, item.label)))), /*#__PURE__*/React.createElement("div", {
    onClick: onSignOut,
    style: {
      display: "flex",
      alignItems: "center",
      gap: "var(--space-md)",
      padding: "var(--space-md) 0",
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "icon ion-ios-log-out",
    style: {
      fontSize: 20,
      color: "var(--danger)"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--text-md)",
      fontWeight: "var(--weight-medium)",
      color: "var(--danger)"
    }
  }, "Sign out"))));
}
Object.assign(__ds_scope, { SideMenu });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/SideMenu.jsx", error: String((e && e.message) || e) }); }

// components/social/CommentComposer.jsx
try { (() => {
function CommentComposer({
  value = "",
  onChange,
  onSubmit,
  placeholder = "Add a comment..."
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-end",
      gap: "var(--space-sm)",
      padding: "var(--space-sm) var(--space-lg)",
      borderTop: "1px solid var(--border-hairline)",
      background: "var(--bg-page)",
      fontFamily: "var(--font-system)"
    }
  }, /*#__PURE__*/React.createElement("textarea", {
    value: value,
    onChange: e => onChange && onChange(e.target.value),
    placeholder: placeholder,
    rows: 1,
    style: {
      flex: 1,
      border: "1px solid var(--border-hairline)",
      borderRadius: "var(--radius-xs)",
      padding: "var(--space-sm) var(--space-md)",
      fontSize: "var(--text-sm)",
      color: "var(--text-primary)",
      fontFamily: "var(--font-system)",
      resize: "none",
      maxHeight: 100
    }
  }), /*#__PURE__*/React.createElement("span", {
    onClick: () => value.trim() && onSubmit && onSubmit(),
    style: {
      padding: "10px 4px",
      fontSize: "var(--text-sm)",
      fontWeight: "var(--weight-bold)",
      letterSpacing: "var(--tracking-wide)",
      textTransform: "uppercase",
      color: "var(--accent)",
      opacity: value.trim() ? 1 : 0.4,
      cursor: value.trim() ? "pointer" : "default"
    }
  }, "Post"));
}
Object.assign(__ds_scope, { CommentComposer });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/social/CommentComposer.jsx", error: String((e && e.message) || e) }); }

// components/social/CommentThread.jsx
try { (() => {
function CommentThread({
  comments = []
}) {
  if (comments.length === 0) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: "var(--text-sm)",
        color: "var(--text-secondary)",
        fontFamily: "var(--font-system)"
      }
    }, "No comments yet.");
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: "var(--space-sm)",
      fontFamily: "var(--font-system)"
    }
  }, comments.map((c, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      padding: "var(--space-xs) 0"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--text-sm)",
      fontWeight: "var(--weight-bold)",
      color: "var(--text-primary)"
    }
  }, c.author, " "), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--text-sm)",
      color: "var(--text-primary)"
    }
  }, c.body))));
}
Object.assign(__ds_scope, { CommentThread });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/social/CommentThread.jsx", error: String((e && e.message) || e) }); }

// components/social/LikeRow.jsx
try { (() => {
function LikeRow({
  likedByNames = [],
  hasLiked,
  isFavorited,
  onToggleLike,
  onToggleFavorite,
  onNameClick
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: "var(--space-sm)",
      fontFamily: "var(--font-system)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    onClick: onToggleLike,
    style: {
      fontSize: "var(--text-xl)",
      color: hasLiked ? "var(--danger)" : "var(--text-secondary)",
      cursor: "pointer",
      lineHeight: 1
    }
  }, hasLiked ? "♥" : "♡"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontSize: "var(--text-sm)",
      color: "var(--text-secondary)"
    }
  }, likedByNames.length === 0 ? "No likes yet" : /*#__PURE__*/React.createElement(React.Fragment, null, "Liked by", " ", likedByNames.map((name, i) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: name
  }, /*#__PURE__*/React.createElement("span", {
    onClick: () => onNameClick && onNameClick(name),
    style: {
      fontWeight: "var(--weight-medium)",
      color: "var(--text-primary)",
      cursor: "pointer"
    }
  }, name), i < likedByNames.length - 2 ? ", " : i === likedByNames.length - 2 ? " and " : "")))), /*#__PURE__*/React.createElement("i", {
    onClick: onToggleFavorite,
    className: "icon ion-ios-bookmark",
    style: {
      fontSize: 22,
      color: isFavorited ? "var(--text-primary)" : "var(--text-secondary)",
      cursor: "pointer"
    }
  }));
}
Object.assign(__ds_scope, { LikeRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/social/LikeRow.jsx", error: String((e && e.message) || e) }); }

// ui_kits/keeps-app/App.jsx
try { (() => {
function App() {
  const [session, setSession] = React.useState(false);
  const [tab, setTab] = React.useState("profile");
  const [route, setRoute] = React.useState({
    name: "tab"
  });
  if (!session) return /*#__PURE__*/React.createElement(SignInScreen, {
    onSignIn: () => setSession(true)
  });
  if (route.name === "keep") return /*#__PURE__*/React.createElement(KeepDetailScreen, {
    keep: route.keep,
    onBack: () => setRoute({
      name: "tab"
    }),
    onOpenPost: post => setRoute({
      name: "post",
      post
    }),
    onAddPost: () => setRoute({
      name: "addPost",
      keep: route.keep
    })
  });
  if (route.name === "post") return /*#__PURE__*/React.createElement(PhotoDetailScreen, {
    post: route.post,
    onBack: () => setRoute({
      name: "tab"
    })
  });
  if (route.name === "createKeep") return /*#__PURE__*/React.createElement(CreateKeepScreen, {
    onCancel: () => setRoute({
      name: "tab"
    }),
    onCreate: () => setRoute({
      name: "tab"
    })
  });
  if (route.name === "addPost") return /*#__PURE__*/React.createElement(CreateKeepScreen, {
    onCancel: () => setRoute({
      name: "keep",
      keep: route.keep
    }),
    onCreate: () => setRoute({
      name: "keep",
      keep: route.keep
    })
  });
  return /*#__PURE__*/React.createElement(React.Fragment, null, tab === "profile" && /*#__PURE__*/React.createElement(ProfileScreen, {
    onOpenKeep: keep => setRoute({
      name: "keep",
      keep
    }),
    onNavigate: setTab
  }), tab === "feed" && /*#__PURE__*/React.createElement(FeedScreen, {
    onOpenPost: post => setRoute({
      name: "post",
      post
    }),
    onNavigate: setTab
  }), tab === "search" && /*#__PURE__*/React.createElement(SearchScreen, {
    onNavigate: setTab
  }));
}
ReactDOM.createRoot(document.getElementById("root")).render(/*#__PURE__*/React.createElement(App, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/keeps-app/App.jsx", error: String((e && e.message) || e) }); }

// ui_kits/keeps-app/CreateKeepScreen.jsx
try { (() => {
function CreateKeepScreen({
  onCancel,
  onCreate
}) {
  const {
    Button,
    CoverPhotoPicker
  } = window.KeepsDesignSystem_5fa74b;
  const [title, setTitle] = React.useState("");
  const [privacy, setPrivacy] = React.useState("private");
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      background: "var(--bg-page)",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "var(--space-md) var(--space-lg) 0"
    }
  }, /*#__PURE__*/React.createElement("span", {
    onClick: onCancel,
    style: {
      fontSize: "var(--text-md)",
      color: "var(--text-secondary)",
      cursor: "pointer"
    }
  }, "Cancel"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--text-md)",
      fontWeight: "var(--weight-bold)",
      color: "var(--text-primary)"
    }
  }, "New keep"), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 46
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: "auto",
      padding: "var(--space-lg)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--text-sm)",
      fontWeight: "var(--weight-medium)",
      color: "var(--text-primary)",
      marginBottom: "var(--space-xs)"
    }
  }, "Title"), /*#__PURE__*/React.createElement("input", {
    value: title,
    onChange: e => setTitle(e.target.value),
    placeholder: "Spring Break 2026",
    style: {
      width: "100%",
      boxSizing: "border-box",
      border: "1px solid var(--border-hairline)",
      borderRadius: "var(--radius-xs)",
      padding: "var(--space-md)",
      fontSize: "var(--text-md)",
      marginBottom: "var(--space-md)",
      fontFamily: "var(--font-system)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--text-sm)",
      fontWeight: "var(--weight-medium)",
      color: "var(--text-primary)",
      marginBottom: "var(--space-xs)"
    }
  }, "Cover photo"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: "var(--space-md)"
    }
  }, /*#__PURE__*/React.createElement(CoverPhotoPicker, null)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--text-sm)",
      fontWeight: "var(--weight-medium)",
      color: "var(--text-primary)",
      marginBottom: "var(--space-xs)"
    }
  }, "Privacy"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: "var(--space-sm)",
      marginBottom: "var(--space-lg)"
    }
  }, ["private", "public"].map(mode => /*#__PURE__*/React.createElement("div", {
    key: mode,
    onClick: () => setPrivacy(mode),
    style: {
      flex: 1,
      textAlign: "center",
      border: `1px solid ${privacy === mode ? "var(--accent)" : "var(--border-hairline)"}`,
      background: privacy === mode ? "var(--accent-muted)" : "transparent",
      borderRadius: "var(--radius-xs)",
      padding: "var(--space-sm)",
      color: privacy === mode ? "var(--accent)" : "var(--text-secondary)",
      fontWeight: "var(--weight-medium)",
      cursor: "pointer",
      textTransform: "capitalize"
    }
  }, mode))), /*#__PURE__*/React.createElement(Button, {
    label: "Create keep",
    disabled: !title.trim(),
    onClick: () => title.trim() && onCreate()
  })));
}
window.CreateKeepScreen = CreateKeepScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/keeps-app/CreateKeepScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/keeps-app/FeedScreen.jsx
try { (() => {
function FeedScreen({
  onOpenPost,
  onNavigate
}) {
  const {
    Avatar,
    BottomNavBar
  } = window.KeepsDesignSystem_5fa74b;
  const {
    posts
  } = window.KeepsMockData;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      background: "var(--bg-page)",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: "auto",
      padding: "var(--space-lg)"
    }
  }, posts.map(p => /*#__PURE__*/React.createElement("div", {
    key: p.id,
    onClick: () => onOpenPost(p),
    style: {
      display: "flex",
      alignItems: "center",
      gap: "var(--space-sm)",
      paddingBottom: "var(--space-md)",
      marginBottom: "var(--space-md)",
      borderBottom: "1px solid var(--border-hairline)",
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    displayName: p.author,
    size: 40
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--text-sm)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: "var(--weight-bold)",
      color: "var(--text-primary)"
    }
  }, p.author), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-secondary)"
    }
  }, " \xB7 ", p.keep)), p.caption && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--text-sm)",
      color: "var(--text-primary)",
      marginTop: 2,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: "var(--weight-bold)"
    }
  }, p.author, " "), p.caption), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--text-xs)",
      color: "var(--text-secondary)",
      marginTop: "var(--space-xs)"
    }
  }, p.time)), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 56,
      height: 56,
      background: "var(--surface-card)",
      position: "relative",
      flexShrink: 0
    }
  }, p.mediaCount > 1 && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top: 4,
      right: 4,
      width: 18,
      height: 18,
      borderRadius: "50%",
      background: "var(--color-icon-badge)"
    }
  }))))), /*#__PURE__*/React.createElement(BottomNavBar, {
    active: "feed",
    onNavigate: onNavigate
  }));
}
window.FeedScreen = FeedScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/keeps-app/FeedScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/keeps-app/KeepDetailScreen.jsx
try { (() => {
function KeepDetailScreen({
  keep,
  onBack,
  onOpenPost,
  onAddPost
}) {
  const {
    IconButton
  } = window.KeepsDesignSystem_5fa74b;
  const {
    posts
  } = window.KeepsMockData;
  const keepPosts = posts.filter(p => p.keep === keep.title);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      background: "var(--bg-page)",
      overflow: "hidden",
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      padding: "var(--space-sm) var(--space-md)"
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    icon: "ios-arrow-back",
    onClick: onBack
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: "auto",
      padding: "0 var(--space-lg) var(--space-lg)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      marginBottom: "var(--space-sm)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontSize: "var(--text-xl)",
      fontWeight: "var(--weight-bold)",
      color: "var(--text-primary)"
    }
  }, keep.title), keep.isPrivate && /*#__PURE__*/React.createElement("i", {
    className: "icon ion-ios-lock",
    style: {
      fontSize: 16,
      marginLeft: 4
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 1,
      background: "var(--border-hairline)",
      marginBottom: "var(--space-md)"
    }
  }), keepPosts.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--text-md)",
      color: "var(--text-secondary)"
    }
  }, "No posts yet \u2014 tap + below to add the first one."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(3,1fr)",
      gap: "var(--space-xs)"
    }
  }, keepPosts.map(p => /*#__PURE__*/React.createElement("div", {
    key: p.id,
    onClick: () => onOpenPost(p),
    style: {
      aspectRatio: 1,
      background: "var(--surface-card)",
      cursor: "pointer",
      position: "relative"
    }
  }, p.mediaCount > 1 && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top: 4,
      right: 4,
      width: 20,
      height: 20,
      borderRadius: "50%",
      background: "var(--color-icon-badge)"
    }
  }))))), /*#__PURE__*/React.createElement(IconButton, {
    icon: "ios-add",
    variant: "solid",
    size: 56,
    onClick: onAddPost,
    style: {
      position: "absolute",
      right: "var(--space-lg)",
      bottom: "var(--space-lg)",
      boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
    }
  }));
}
window.KeepDetailScreen = KeepDetailScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/keeps-app/KeepDetailScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/keeps-app/PhotoDetailScreen.jsx
try { (() => {
function PhotoDetailScreen({
  post,
  onBack
}) {
  const {
    IconButton,
    LikeRow,
    CommentThread,
    CommentComposer
  } = window.KeepsDesignSystem_5fa74b;
  const [liked, setLiked] = React.useState(post.likes.length > 0);
  const [likes, setLikes] = React.useState(post.likes);
  const [favorited, setFavorited] = React.useState(false);
  const [draft, setDraft] = React.useState("");
  const [comments, setComments] = React.useState(post.comments);
  const submit = () => {
    if (!draft.trim()) return;
    setComments([...comments, {
      author: "You",
      body: draft.trim()
    }]);
    setDraft("");
  };
  const toggleLike = () => {
    setLiked(!liked);
    setLikes(liked ? likes.filter(n => n !== "You") : [...likes, "You"]);
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      background: "var(--bg-page)",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      padding: "var(--space-sm) var(--space-md)"
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    icon: "ios-arrow-back",
    onClick: onBack
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: "auto"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: "100%",
      aspectRatio: 1,
      background: "var(--surface-card)",
      position: "relative"
    }
  }, post.mediaCount > 1 && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top: "50%",
      right: "var(--space-sm)",
      marginTop: -12,
      width: 24,
      height: 24,
      borderRadius: "50%",
      background: "var(--color-icon-badge)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "icon ion-ios-arrow-forward",
    style: {
      fontSize: 12,
      color: "#fff"
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "var(--space-sm) var(--space-lg) var(--space-lg)",
      display: "flex",
      flexDirection: "column",
      gap: "var(--space-md)"
    }
  }, /*#__PURE__*/React.createElement(LikeRow, {
    likedByNames: likes,
    hasLiked: liked,
    isFavorited: favorited,
    onToggleLike: toggleLike,
    onToggleFavorite: () => setFavorited(!favorited)
  }), post.caption && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--text-sm)",
      color: "var(--text-primary)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: "var(--weight-bold)"
    }
  }, post.author, " "), post.caption), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 1,
      background: "var(--border-hairline)"
    }
  }), /*#__PURE__*/React.createElement(CommentThread, {
    comments: comments
  }))), /*#__PURE__*/React.createElement(CommentComposer, {
    value: draft,
    onChange: setDraft,
    onSubmit: submit
  }));
}
window.PhotoDetailScreen = PhotoDetailScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/keeps-app/PhotoDetailScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/keeps-app/ProfileScreen.jsx
try { (() => {
function ProfileScreen({
  onOpenKeep,
  onNavigate
}) {
  const {
    Avatar,
    IconButton,
    KeepCoverCard,
    BottomNavBar,
    SideMenu
  } = window.KeepsDesignSystem_5fa74b;
  const {
    profile,
    keeps
  } = window.KeepsMockData;
  const [menuOpen, setMenuOpen] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      background: "var(--bg-page)",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-end",
      gap: 4,
      padding: "var(--space-sm) var(--space-lg)"
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    icon: "ios-eye"
  }), /*#__PURE__*/React.createElement(IconButton, {
    icon: "ios-menu",
    onClick: () => setMenuOpen(true)
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: "auto",
      padding: "0 var(--space-lg) var(--space-lg)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      marginBottom: "var(--space-md)"
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    displayName: profile.displayName,
    size: 76
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: "flex",
      justifyContent: "space-around",
      marginLeft: "var(--space-lg)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--text-lg)",
      fontWeight: "var(--weight-bold)",
      color: "var(--text-primary)"
    }
  }, keeps.length), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--text-sm)",
      color: "var(--text-secondary)"
    }
  }, "keeps")), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--text-lg)",
      fontWeight: "var(--weight-bold)",
      color: "var(--text-primary)"
    }
  }, profile.followerCount), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--text-sm)",
      color: "var(--text-secondary)"
    }
  }, "followers")), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--text-lg)",
      fontWeight: "var(--weight-bold)",
      color: "var(--text-primary)"
    }
  }, profile.followingCount), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--text-sm)",
      color: "var(--text-secondary)"
    }
  }, "following")))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--text-md)",
      fontWeight: "var(--weight-bold)",
      color: "var(--text-primary)"
    }
  }, profile.displayName), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--text-sm)",
      color: "var(--text-secondary)",
      marginTop: 2
    }
  }, "@", profile.handle), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--text-sm)",
      color: "var(--text-primary)",
      marginTop: "var(--space-sm)"
    }
  }, profile.bio), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 1,
      background: "var(--border-hairline)",
      marginTop: "var(--space-lg)",
      marginBottom: "var(--space-md)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "var(--space-sm)"
    }
  }, keeps.map(k => /*#__PURE__*/React.createElement("div", {
    key: k.id,
    style: {
      width: "100%"
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: () => onOpenKeep(k),
    style: {
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: "100%",
      aspectRatio: 1,
      background: k.color
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 4,
      marginTop: "var(--space-sm)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--text-sm)",
      fontWeight: "var(--weight-medium)",
      color: "var(--text-primary)",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, k.title), k.isPrivate && /*#__PURE__*/React.createElement("i", {
    className: "icon ion-ios-lock",
    style: {
      fontSize: 12
    }
  }))))))), /*#__PURE__*/React.createElement(BottomNavBar, {
    active: "profile",
    onNavigate: onNavigate
  }), /*#__PURE__*/React.createElement(SideMenu, {
    open: menuOpen,
    onClose: () => setMenuOpen(false),
    items: [{
      key: "notifications",
      label: "Notifications",
      icon: "ios-heart",
      onClick: () => setMenuOpen(false)
    }, {
      key: "favorites",
      label: "Favorites",
      icon: "ios-bookmark",
      onClick: () => setMenuOpen(false)
    }, {
      key: "invites",
      label: "Invites",
      icon: "ios-people",
      onClick: () => setMenuOpen(false)
    }, {
      key: "share",
      label: "Share profile",
      icon: "ios-share",
      onClick: () => setMenuOpen(false)
    }, {
      key: "settings",
      label: "Profile settings",
      icon: "ios-settings",
      onClick: () => setMenuOpen(false)
    }],
    onSignOut: () => setMenuOpen(false)
  }));
}
window.ProfileScreen = ProfileScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/keeps-app/ProfileScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/keeps-app/SearchScreen.jsx
try { (() => {
function SearchScreen({
  onNavigate
}) {
  const {
    BottomNavBar
  } = window.KeepsDesignSystem_5fa74b;
  const {
    keeps,
    profile
  } = window.KeepsMockData;
  const [q, setQ] = React.useState("");
  const results = q ? keeps.filter(k => k.title.toLowerCase().includes(q.toLowerCase())) : [];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      background: "var(--bg-page)",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: "auto",
      padding: "var(--space-lg)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: "var(--space-sm)",
      border: "1px solid var(--border-hairline)",
      borderRadius: "var(--radius-xs)",
      padding: "0 var(--space-md)"
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "icon ion-ios-search",
    style: {
      color: "var(--text-secondary)",
      fontSize: 16
    }
  }), /*#__PURE__*/React.createElement("input", {
    value: q,
    onChange: e => setQ(e.target.value),
    placeholder: "Search keeps and people",
    style: {
      flex: 1,
      border: "none",
      padding: "var(--space-md) 0",
      fontSize: "var(--text-md)",
      fontFamily: "var(--font-system)",
      outline: "none"
    }
  })), q.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: "var(--space-lg)",
      fontSize: "var(--text-md)",
      color: "var(--text-secondary)"
    }
  }, "Search for a keep or a handle."), q.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: "var(--space-md)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--text-sm)",
      fontWeight: "var(--weight-medium)",
      color: "var(--text-secondary)",
      marginBottom: "var(--space-xs)"
    }
  }, "Keeps"), results.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--text-md)",
      color: "var(--text-secondary)"
    }
  }, "No results for \"", q, "\"."), results.map(k => /*#__PURE__*/React.createElement("div", {
    key: k.id,
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "var(--space-md) 0",
      borderBottom: "1px solid var(--border-hairline)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--text-md)",
      fontWeight: "var(--weight-medium)",
      color: "var(--text-primary)"
    }
  }, k.title), k.isPrivate && /*#__PURE__*/React.createElement("i", {
    className: "icon ion-ios-lock",
    style: {
      fontSize: 14,
      color: "var(--text-secondary)"
    }
  }))))), /*#__PURE__*/React.createElement(BottomNavBar, {
    active: "search",
    onNavigate: onNavigate
  }));
}
window.SearchScreen = SearchScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/keeps-app/SearchScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/keeps-app/SignInScreen.jsx
try { (() => {
function SignInScreen({
  onSignIn
}) {
  const [email, setEmail] = React.useState("");
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      padding: "var(--space-lg)",
      background: "var(--bg-page)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--text-xxl)",
      fontWeight: "var(--weight-bold)",
      color: "var(--text-primary)",
      marginBottom: "var(--space-sm)"
    }
  }, "Keeps"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--text-md)",
      color: "var(--text-secondary)",
      marginBottom: "var(--space-lg)"
    }
  }, "Enter your email and we'll send you a sign-in code."), /*#__PURE__*/React.createElement("input", {
    value: email,
    onChange: e => setEmail(e.target.value),
    placeholder: "you@example.com",
    style: {
      border: "1px solid var(--border-hairline)",
      borderRadius: "var(--radius-md)",
      padding: "var(--space-md)",
      fontSize: "var(--text-md)",
      color: "var(--text-primary)",
      marginBottom: "var(--space-md)",
      fontFamily: "var(--font-system)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    onClick: () => email && onSignIn(),
    style: {
      background: "var(--accent)",
      borderRadius: "var(--radius-md)",
      padding: "var(--space-md)",
      textAlign: "center",
      color: "var(--text-inverse)",
      fontSize: "var(--text-md)",
      fontWeight: "var(--weight-medium)",
      cursor: "pointer",
      opacity: email ? 1 : 0.5
    }
  }, "Send code"));
}
window.SignInScreen = SignInScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/keeps-app/SignInScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/keeps-app/mockData.js
try { (() => {
// Shared fake data for the Keeps UI kit prototype.
window.KeepsMockData = {
  profile: {
    displayName: "Ella Sobhani",
    handle: "ellasobhani",
    bio: "nyc & san diego",
    keepsCount: 6,
    followerCount: 1212,
    followingCount: 1171
  },
  keeps: [{
    id: "k1",
    title: "Spring Break 2026",
    isPrivate: true,
    hidden: false,
    cover: null,
    color: "#DDE7DC"
  }, {
    id: "k2",
    title: "Sunday dinners",
    isPrivate: false,
    hidden: false,
    cover: null,
    color: "#F5F4F1"
  }, {
    id: "k3",
    title: "Maya's wedding",
    isPrivate: true,
    hidden: true,
    cover: null,
    color: "#E4E1DA"
  }, {
    id: "k4",
    title: "NYC weekends",
    isPrivate: false,
    hidden: false,
    cover: null,
    color: "#DDE7DC"
  }],
  posts: [{
    id: "p1",
    author: "Ella Sobhani",
    keep: "Spring Break 2026",
    caption: "last night in tulum \u2600\ufe0f",
    time: "2h",
    mediaCount: 3,
    likes: ["Maya Barr", "Shawn Hussain", "Iulia S"],
    comments: [{
      author: "Maya Barr",
      body: "this is so cute!!"
    }, {
      author: "Shawn Hussain",
      body: "wish I was there"
    }]
  }, {
    id: "p2",
    author: "Maya Barr",
    keep: "Sunday dinners",
    caption: "week 12 of the pasta project",
    time: "5h",
    mediaCount: 1,
    likes: ["Ella Sobhani"],
    comments: []
  }, {
    id: "p3",
    author: "Iulia S",
    keep: "NYC weekends",
    caption: "",
    time: "1d",
    mediaCount: 2,
    likes: [],
    comments: [{
      author: "Ella Sobhani",
      body: "where is this??"
    }]
  }]
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/keeps-app/mockData.js", error: String((e && e.message) || e) }); }

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.CarouselChevron = __ds_scope.CarouselChevron;

__ds_ns.KeepCoverCard = __ds_scope.KeepCoverCard;

__ds_ns.PostGridTile = __ds_scope.PostGridTile;

__ds_ns.CoverPhotoPicker = __ds_scope.CoverPhotoPicker;

__ds_ns.BottomNavBar = __ds_scope.BottomNavBar;

__ds_ns.SideMenu = __ds_scope.SideMenu;

__ds_ns.CommentComposer = __ds_scope.CommentComposer;

__ds_ns.CommentThread = __ds_scope.CommentThread;

__ds_ns.LikeRow = __ds_scope.LikeRow;

})();
