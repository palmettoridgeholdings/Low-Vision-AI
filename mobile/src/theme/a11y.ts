/**
 * Touch-target and accessibility sizing constants.
 *
 * Android's accessibility guidance sets 48x48dp as the minimum touch target
 * (https://support.google.com/accessibility/android/answer/7101858). This
 * app treats that as a floor, not a target: primary home-screen controls are
 * sized well above it so they are easy to find and hit without precision.
 */
export const ANDROID_MIN_TOUCH_TARGET_DP = 48;

/** Minimum touch target used anywhere in this app — already above the Android floor. */
export const MIN_TOUCH_TARGET = 56;

/** Height of primary, "extremely large" home-screen controls. */
export const PRIMARY_CONTROL_HEIGHT = 96;

/** Height of secondary controls (e.g. Settings, Help) — still well above the floor. */
export const SECONDARY_CONTROL_HEIGHT = 72;

/** Width of the visible focus ring drawn around a focused control for sighted keyboard users. */
export const FOCUS_RING_WIDTH = 3;
