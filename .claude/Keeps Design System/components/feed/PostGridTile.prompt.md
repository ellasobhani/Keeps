Square media tile used in a 3-column grid on KeepDetail and Favorites. A top-right "copy" badge indicates a multi-photo carousel; a bottom-left play badge indicates video.

```jsx
<PostGridTile src={url} mediaCount={3} onClick={openPost} />
<PostGridTile src={url} isVideo onClick={openPost} />
```

Sharp corners, no border unless empty. Badges are small translucent-black circles with a white glyph — the one recurring "badge on media" pattern in the system (also seen on CarouselChevron).
