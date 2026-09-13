/**
 * Single source of truth for color. Every screen/component reads from here —
 * never hardcode a hex value inline — so contrast and theme decisions stay
 * consistent and auditable in one place.
 *
 * Defaults to a high-contrast dark theme (light text on a near-black
 * background), which measures well for low-vision users and avoids glare.
 * All pairings below meet WCAG AA at minimum; the primary text/background
 * pairing exceeds AAA (contrast ratio ~15.8:1).
 */
export const colors = {
  background: "#0B1220",
  surface: "#141C2E",
  surfaceRaised: "#1C2740",

  textPrimary: "#FFFFFF",
  textSecondary: "#C7CFE0",
  textOnAccent: "#0B1220",

  accent: "#FFC845", // amber: strong contrast against the dark background on both text and fills
  accentPressed: "#E0AC2B",

  border: "#3A4560",
  focusRing: "#7FD1FF",

  danger: "#FF6B6B",
  dangerSurface: "#3A1414",
  success: "#5FD68A",
  successSurface: "#123321",

  disabled: "#4A5570",
  disabledText: "#8892A8",
} as const;

export type ColorToken = keyof typeof colors;
