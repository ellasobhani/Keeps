Tiny swipe affordance overlaid on a horizontal media carousel (PhotoDetail, AddPost hero), pointing toward more content. Hide the chevron on whichever end has nothing further to reveal.

```jsx
<div style={{ position: "relative" }}>
  {media}
  {index > 0 && <CarouselChevron direction="left" />}
  {index < media.length - 1 && <CarouselChevron direction="right" />}
</div>
```
