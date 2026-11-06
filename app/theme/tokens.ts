// Single source of truth for styling. Nothing outside this file should
// hardcode a hex value, font size, spacing value, or radius.

export const colors = {
  background: "#FFFFFF",
  surface: "#F5F4F1",
  border: "#E4E1DA",
  textPrimary: "#1A1A1A",
  textSecondary: "#6B6B68",
  textInverse: "#FFFFFF",
  accent: "#2F5233",
  accentMuted: "#DDE7DC",
  danger: "#B3261E",
  // Dark scrim hosting a white icon over arbitrary photo/video content —
  // grid badges, carousel chevrons, the cover-photo edit badge.
  scrim: "rgba(0,0,0,0.55)",
  // Lighter variant, side-menu backdrop only.
  scrimLight: "rgba(0,0,0,0.3)",
  // PhotoEditor is the one full-screen dark-chrome surface in the app.
  editorBackground: "#000000",
  editorFrame: "#111111",
  editorControlBackground: "rgba(255,255,255,0.15)",
  editorHint: "rgba(255,255,255,0.6)",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radii = {
  none: 0,
  xs: 4,
  sm: 6,
  md: 12,
  lg: 20,
  pill: 999,
} as const;

export const typography = {
  family: {
    regular: "System",
    medium: "System",
    bold: "System",
    // The one deliberate departure from system-font-only — a warm display
    // serif for keep/screen titles, loaded via @expo-google-fonts/lora
    // (see App.tsx's useFonts call). Body text stays System everywhere.
    serif: "Lora_600SemiBold",
  },
  size: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
  },
  weight: {
    regular: "400",
    medium: "500",
    bold: "700",
  },
  letterSpacing: {
    normal: 0,
    wide: 0.4,
    wider: 1.1,
    otp: 4,
  },
} as const;

// Ionicons renders as a single glyph inside a Text node, sized by the
// font's own line-height metrics — which run taller (and asymmetrically,
// with extra reserved descent) than the glyph's visible ink. Flexbox still
// centers that oversized box correctly; the box's ink just isn't centered
// within itself, so every icon-only button in the app read a few px high.
// Pinning lineHeight to the glyph's own size gives it a tight, symmetric
// box. `textAlignVertical` doesn't help here — it's Android-only.
export function iconGlyphFix(size: number) {
  return { lineHeight: size, includeFontPadding: false } as const;
}

export const tokens = { colors, spacing, radii, typography };

export default tokens;
