/**
 * Onboarding domain types, modeled directly on
 * docs/BLIND_FIRST_ONBOARDING_SPEC.md (states A-F). Stable string values are
 * used everywhere — never infer behavior by matching a visible label — per
 * the spec's explicit warning against substring-matching the profile label.
 */

export type VisionProfile =
  | "totally_blind"
  | "severe_low_vision"
  | "low_vision"
  | "sighted_caregiver"
  | "prefer_not_to_say";

export type InteractionPreference =
  | "voice_first"
  | "screen_reader_touch"
  | "braille"
  | "large_text"
  | "combination";

export type DevicePreference =
  | "android_talkback"
  | "iphone_voiceover"
  | "windows_nvda"
  | "windows_jaws"
  | "mac_voiceover"
  | "other_not_sure";

export type AnswerStyle = "short_direct" | "step_by_step" | "detailed" | "conversational";

export type SetupRoute = "spoken" | "visual";

export type OnboardingStep =
  | "welcome"
  | "vision"
  | "interaction"
  | "device"
  | "answer_behavior"
  | "confirmation"
  | "done";

export const ONBOARDING_STEP_ORDER: OnboardingStep[] = [
  "welcome",
  "vision",
  "interaction",
  "device",
  "answer_behavior",
  "confirmation",
  "done",
];

export interface OnboardingProgress {
  completed: boolean;
  currentStep: OnboardingStep;
  setupRoute: SetupRoute | null;
  visionProfile: VisionProfile | null;
  interactionPreference: InteractionPreference | null;
  devicePreference: DevicePreference | null;
  answerStyle: AnswerStyle | null;
}

/** Persisted app-wide settings. Some are seeded by onboarding but stay user-editable afterward from Settings. */
export interface AppSettings {
  autoSpeakAnswers: boolean;
  startupSpeechEnabled: boolean;
}

export interface PersistedAppState {
  onboarding: OnboardingProgress;
  settings: AppSettings;
}

export const DEFAULT_ONBOARDING_PROGRESS: OnboardingProgress = {
  completed: false,
  currentStep: "welcome",
  setupRoute: null,
  visionProfile: null,
  interactionPreference: null,
  devicePreference: null,
  answerStyle: null,
};

/** Recommended defaults, not locked settings — the spec requires every one of these to stay user-overridable. */
export const DEFAULT_SETTINGS: AppSettings = {
  autoSpeakAnswers: false,
  startupSpeechEnabled: true,
};

export const DEFAULT_APP_STATE: PersistedAppState = {
  onboarding: DEFAULT_ONBOARDING_PROGRESS,
  settings: DEFAULT_SETTINGS,
};

export interface VisionProfileDefaults {
  interactionPreference: InteractionPreference;
  answerStyle: AnswerStyle;
  autoSpeakAnswers: boolean;
}

/**
 * Recommended defaults per vision profile (spec section 3, totally-blind
 * profile). These are suggestions applied to a fresh selection — the user
 * can change every one of them afterward, in onboarding or in Settings.
 */
export function getRecommendedDefaultsForProfile(profile: VisionProfile): VisionProfileDefaults {
  switch (profile) {
    case "totally_blind":
      return {
        interactionPreference: "voice_first",
        answerStyle: "short_direct",
        autoSpeakAnswers: true,
      };
    case "severe_low_vision":
      return {
        interactionPreference: "voice_first",
        answerStyle: "short_direct",
        autoSpeakAnswers: true,
      };
    case "low_vision":
      return {
        interactionPreference: "large_text",
        answerStyle: "conversational",
        autoSpeakAnswers: false,
      };
    case "sighted_caregiver":
    case "prefer_not_to_say":
      return {
        interactionPreference: "combination",
        answerStyle: "conversational",
        autoSpeakAnswers: false,
      };
  }
}
