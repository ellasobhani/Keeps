function App() {
  const [session, setSession] = React.useState(false);
  const [tab, setTab] = React.useState("profile");
  const [route, setRoute] = React.useState({ name: "tab" });

  if (!session) return <SignInScreen onSignIn={() => setSession(true)} />;

  if (route.name === "keep") return <KeepDetailScreen keep={route.keep} onBack={() => setRoute({ name: "tab" })} onOpenPost={(post) => setRoute({ name: "post", post })} onAddPost={() => setRoute({ name: "addPost", keep: route.keep })} />;
  if (route.name === "post") return <PhotoDetailScreen post={route.post} onBack={() => setRoute({ name: "tab" })} />;
  if (route.name === "createKeep") return <CreateKeepScreen onCancel={() => setRoute({ name: "tab" })} onCreate={() => setRoute({ name: "tab" })} />;
  if (route.name === "addPost") return <CreateKeepScreen onCancel={() => setRoute({ name: "keep", keep: route.keep })} onCreate={() => setRoute({ name: "keep", keep: route.keep })} />;

  return (
    <React.Fragment>
      {tab === "profile" && <ProfileScreen onOpenKeep={(keep) => setRoute({ name: "keep", keep })} onNavigate={setTab} />}
      {tab === "feed" && <FeedScreen onOpenPost={(post) => setRoute({ name: "post", post })} onNavigate={setTab} />}
      {tab === "search" && <SearchScreen onNavigate={setTab} />}
    </React.Fragment>
  );
}
ReactDOM.createRoot(document.getElementById("root")).render(<App />);
