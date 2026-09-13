import type { ScreenReaderStatus } from "@/services/accessibility/screenReaderStatusService";

/**
 * Copy for the TalkBack/Explore-by-Touch first-launch instructions and the
 * "Open Android accessibility settings" control (blind-first accessibility
 * pass, requirements 3, 4, and 8). Kept separate from onboardingCopy.ts,
 * which predates screen-reader detection and covers the rest of the
 * onboarding flow.
 */

export const OPEN_ACCESSIBILITY_SETTINGS_LABEL = "Open Android accessibility settings";

export const OPEN_ACCESSIBILITY_SETTINGS_HINT =
  "Opens your device's Accessibility settings, where you can turn on TalkBack or another accessibility service yourself";

export const RETURNED_FROM_ACCESSIBILITY_SETTINGS_MESSAGE =
  "Returned from Accessibility settings.";

export const CANNOT_AUTO_ENABLE_TALKBACK_STATEMENT =
  "Access AI cannot turn on TalkBack or any other Android accessibility service automatically — you have to turn it on yourself, in Settings.";

/**
 * Spoken/read through TalkBack itself when it's already on (requirement 3):
 * standard Explore-by-Touch mechanics, in the exact order specified. No
 * custom gesture is introduced or described here — these are the gestures
 * TalkBack already owns.
 */
export const TALKBACK_ENABLED_EXPLORE_INSTRUCTIONS =
  "TalkBack is on. Drag one finger around the screen to hear what's underneath it. Swipe right or left to move between controls in order. Lift your finger after hearing the control you want, then double-tap anywhere on the screen to activate the last one you heard. Use Repeat instructions to hear this again.";

/**
 * Delivered through offline device TTS when TalkBack is off (requirement
 * 3): explains the off state plainly, mentions — without promising it's
 * configured — the volume-button accessibility shortcut, and points at the
 * in-app control that opens the real settings screen.
 */
export const TALKBACK_DISABLED_INSTRUCTIONS =
  "TalkBack is currently off. Access AI cannot turn on Android accessibility services automatically. On some devices, holding both volume buttons for about three seconds activates the accessibility shortcut you've configured — but this isn't set up on every device. Use Open Android accessibility settings to turn on TalkBack yourself. Use Repeat instructions to hear this again.";

/**
 * The Welcome screen's first-launch message, branched on screen-reader
 * status. Leads with the TalkBack/Explore-by-Touch mechanics relevant to
 * the user's actual situation, then the rest of the existing welcome
 * content (what setup does, the recommended-blind-settings shortcut, the
 * manual spoken-setup route, and the Repeat/Stop controls).
 */
export const TALKBACK_ENABLED_WELCOME_MESSAGE =
  `${TALKBACK_ENABLED_EXPLORE_INSTRUCTIONS} Welcome to Access AI — this entire setup can be completed without sight. The first control, Use recommended blind settings, immediately sets up totally blind use, voice-first interaction, and short, direct spoken answers; every one of those choices stays reviewable and changeable afterward. To choose each setting yourself instead, use Start spoken setup. If you ever need to adjust TalkBack itself, use Open Android accessibility settings.`;

export const TALKBACK_DISABLED_WELCOME_MESSAGE =
  `Welcome to Access AI. This entire setup can be completed without sight, and this introduction is being read aloud automatically. ${TALKBACK_DISABLED_INSTRUCTIONS} If TalkBack is turned on later, swipe right or left to move between items on this screen, and double-tap an item to activate it. The first item, Use recommended blind settings, immediately sets up Access AI for totally blind use with voice-first interaction and short, direct spoken answers — every one of those choices can still be reviewed or changed afterward. To choose each setting yourself instead, use Start spoken setup. To stop the speech, use Stop speech.`;

/** Picks the right first-launch Welcome message for the current (possibly still-resolving) screen-reader status. */
export function getOnboardingWelcomeMessage(status: ScreenReaderStatus): string {
  return status === "enabled" ? TALKBACK_ENABLED_WELCOME_MESSAGE : TALKBACK_DISABLED_WELCOME_MESSAGE;
}

/** The Help screen's TalkBack/Explore-by-Touch section (requirement 8) — always shown, regardless of current screen-reader status, since Help is exactly where a user goes to learn how to turn TalkBack on in the first place. */
export const TALKBACK_HELP_SECTION = `Using TalkBack: ${TALKBACK_ENABLED_EXPLORE_INSTRUCTIONS} ${CANNOT_AUTO_ENABLE_TALKBACK_STATEMENT} Use Open Android accessibility settings on this screen to turn it on.`;
