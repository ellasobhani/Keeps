Primary call-to-action control — bold uppercase label, sharp 4px corners, used for the single main action on a screen (Create keep, Send code, Share, Post).

```jsx
<Button label="Create keep" onClick={handleSubmit} />
<Button label="Cancel" variant="secondary" onClick={handleCancel} />
```

Variants: `primary` (solid ink fill, white text — the default action), `secondary` (outline, ink text — the paired/lesser action), `text` (no border, accent-green text, left-aligned — used for tiny inline actions like "Post" in the comment composer), `danger` (solid red — destructive, e.g. "Delete account"). `loading` shows a spinner glyph in place of the label. `disabled`/`loading` both drop opacity to 0.4.
