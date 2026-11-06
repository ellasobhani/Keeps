import { Ionicons } from "@expo/vector-icons";
import type { PrivacyMode } from "../types/database";

// Shared between CreateKeep and EditKeep so the two screens can't drift out
// of sync on copy/icons for the same two options.
export const PRIVACY_OPTIONS: {
  value: PrivacyMode;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description: string;
}[] = [
  { value: "private", icon: "lock-closed", label: "Private", description: "Only invited co-owners" },
  { value: "public", icon: "globe-outline", label: "Public", description: "Anyone can find it" },
];
