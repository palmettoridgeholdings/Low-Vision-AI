/**
 * Font sizes run larger than typical mobile defaults across the whole app,
 * per the accessibility-first brief ("extremely large... controls"). These
 * are the floor, not a starting point to shrink from.
 */
export const fontSize = {
  body: 20,
  label: 18,
  button: 24,
  heading: 30,
  display: 38,
} as const;

export const lineHeight = {
  body: 28,
  label: 24,
  button: 30,
  heading: 38,
  display: 46,
} as const;

export const fontWeight = {
  regular: "400",
  medium: "500",
  bold: "700",
} as const;

export type FontSizeToken = keyof typeof fontSize;
