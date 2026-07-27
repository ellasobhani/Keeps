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
  },
} as const;

export const tokens = { colors, spacing, radii, typography };

export default tokens;
