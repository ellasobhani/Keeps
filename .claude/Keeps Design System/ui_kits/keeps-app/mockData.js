// Shared fake data for the Keeps UI kit prototype.
window.KeepsMockData = {
  profile: {
    displayName: "Ella Sobhani",
    handle: "ellasobhani",
    bio: "nyc & san diego",
    keepsCount: 6,
    followerCount: 1212,
    followingCount: 1171,
  },
  keeps: [
    { id: "k1", title: "Spring Break 2026", isPrivate: true, hidden: false, cover: null, color: "#DDE7DC" },
    { id: "k2", title: "Sunday dinners", isPrivate: false, hidden: false, cover: null, color: "#F5F4F1" },
    { id: "k3", title: "Maya's wedding", isPrivate: true, hidden: true, cover: null, color: "#E4E1DA" },
    { id: "k4", title: "NYC weekends", isPrivate: false, hidden: false, cover: null, color: "#DDE7DC" },
  ],
  posts: [
    { id: "p1", author: "Ella Sobhani", keep: "Spring Break 2026", caption: "last night in tulum \u2600\ufe0f", time: "2h", mediaCount: 3, likes: ["Maya Barr", "Shawn Hussain", "Iulia S"], comments: [{ author: "Maya Barr", body: "this is so cute!!" }, { author: "Shawn Hussain", body: "wish I was there" }] },
    { id: "p2", author: "Maya Barr", keep: "Sunday dinners", caption: "week 12 of the pasta project", time: "5h", mediaCount: 1, likes: ["Ella Sobhani"], comments: [] },
    { id: "p3", author: "Iulia S", keep: "NYC weekends", caption: "", time: "1d", mediaCount: 2, likes: [], comments: [{ author: "Ella Sobhani", body: "where is this??" }] },
  ],
};
