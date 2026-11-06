repo: ellasobhani/Keeps
branch: main
## Last sync
date: 2026-08-03T14:51:08Z
### Updated in this project
- Initial design system build: tokens (colors/type/spacing/radii) from `app/theme/tokens.ts`
- 12 components recreated 1:1 from `app/components/*.tsx`
- Interactive mobile app UI kit covering sign-in, profile, feed, keep detail, photo detail, search, create-keep
- Brand mark copied from `assets/` (icon.png / android-icon-foreground.png)

## Screen map
| Project screen | Repo files |
|---|---|
| ui_kits/keeps-app SignInScreen | app/screens/SignInScreen.tsx |
| ui_kits/keeps-app ProfileScreen | app/screens/Profile.tsx, app/components/{Avatar,KeepCoverCard,SideMenu,BottomNavBar}.tsx |
| ui_kits/keeps-app FeedScreen | app/screens/Feed.tsx |
| ui_kits/keeps-app SearchScreen | app/screens/Search.tsx |
| ui_kits/keeps-app KeepDetailScreen | app/screens/KeepDetail.tsx, app/components/PostGridTile.tsx |
| ui_kits/keeps-app PhotoDetailScreen | app/screens/PhotoDetail.tsx, app/components/{LikeRow,CommentThread,CommentComposer,CarouselChevron}.tsx |
| ui_kits/keeps-app CreateKeepScreen | app/screens/CreateKeep.tsx, app/components/CoverPhotoPicker.tsx |
| tokens/*.css | app/theme/tokens.ts |
