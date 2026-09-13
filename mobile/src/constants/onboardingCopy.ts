import type {
  AnswerStyle,
  DevicePreference,
  InteractionPreference,
  VisionProfile,
} from "@/types/onboarding";

/**
 * All fixed onboarding/help copy lives here — one place to review or update
 * wording, and the source both the visual screens and any spoken prompt
 * read from. Per the onboarding spec (section 6), none of this requires an
 * OpenAI key or network call: it is spoken with on-device TTS or simply
 * read on screen by TalkBack/VoiceOver.
 */

export const STARTUP_WELCOME_MESSAGE =
  "Welcome back to Access AI. Explore the screen for Ask by voice, Camera assistance, Type a question, Repeat last answer, Help, and Settings.";

export const ONBOARDING_WELCOME_MESSAGE =
  "Welcome to Access AI. This setup can be completed without sight. To start spoken setup, activate Start spoken setup. If you use TalkBack or VoiceOver, navigate to Start spoken setup and double-tap.";

export const VISION_PROMPT =
  "First, choose the vision option that best describes how you want Access AI to assist you.";

export const VISION_PROFILE_LABELS: Record<VisionProfile, string> = {
  totally_blind: "Totally blind / no useful vision",
  severe_low_vision: "Severe low vision",
  low_vision: "Low vision",
  sighted_caregiver: "Sighted caregiver",
  prefer_not_to_say: "Prefer not to say",
};

export const VISION_PROFILE_ORDER: VisionProfile[] = [
  "totally_blind",
  "severe_low_vision",
  "low_vision",
  "sighted_caregiver",
  "prefer_not_to_say",
];

export const INTERACTION_PROMPT = "Next, choose how you want to interact with Access AI.";

export const INTERACTION_PREFERENCE_LABELS: Record<InteractionPreference, string> = {
  voice_first: "Voice first",
  screen_reader_touch: "Screen reader and touch",
  braille: "Refreshable Braille",
  large_text: "Large text",
  combination: "Combination",
};

export const INTERACTION_PREFERENCE_ORDER: InteractionPreference[] = [
  "voice_first",
  "screen_reader_touch",
  "braille",
  "large_text",
  "combination",
];

export const DEVICE_PROMPT = "Which device and screen reader do you mainly use?";

export const DEVICE_PREFERENCE_LABELS: Record<DevicePreference, string> = {
  android_talkback: "Android / TalkBack",
  iphone_voiceover: "iPhone / VoiceOver",
  windows_nvda: "Windows / NVDA",
  windows_jaws: "Windows / JAWS",
  mac_voiceover: "Mac / VoiceOver",
  other_not_sure: "Other / Not sure",
};

export const DEVICE_PREFERENCE_ORDER: DevicePreference[] = [
  "android_talkback",
  "iphone_voiceover",
  "windows_nvda",
  "windows_jaws",
  "mac_voiceover",
  "other_not_sure",
];

export const ANSWER_BEHAVIOR_PROMPT = "Choose how you'd like answers delivered.";

export const ANSWER_STYLE_LABELS: Record<AnswerStyle, string> = {
  short_direct: "Short and direct",
  step_by_step: "Step-by-step",
  detailed: "Detailed",
  conversational: "Conversational",
};

export const ANSWER_STYLE_ORDER: AnswerStyle[] = [
  "short_direct",
  "step_by_step",
  "detailed",
  "conversational",
];

export function buildConfirmationSummary(input: {
  visionProfile: VisionProfile | null;
  interactionPreference: InteractionPreference | null;
  devicePreference: DevicePreference | null;
  answerStyle: AnswerStyle | null;
  autoSpeakAnswers: boolean;
}): string {
  const parts: string[] = [];
  if (input.visionProfile) {
    parts.push(VISION_PROFILE_LABELS[input.visionProfile]);
  }
  if (input.interactionPreference) {
    parts.push(`${INTERACTION_PREFERENCE_LABELS[input.interactionPreference]} interaction`);
  }
  if (input.devicePreference) {
    parts.push(DEVICE_PREFERENCE_LABELS[input.devicePreference]);
  }
  parts.push(
    input.autoSpeakAnswers ? "automatic spoken answers on" : "automatic spoken answers off",
  );
  if (input.answerStyle) {
    parts.push(`${ANSWER_STYLE_LABELS[input.answerStyle]} responses`);
  }
  return `Access AI is set for ${parts.join(", ")}. Activate Finish setup to continue, or review settings to make changes.`;
}

export const HELP_MESSAGE =
  "This is Access AI. From the main screen you can Ask by voice, use Camera assistance, Type a question, Repeat last answer, open Help, or open Settings to change your accessibility setup.";
