import { createStore } from "@/utils/createStore";
import { readJson, writeJson } from "@/utils/storage";
import {
  DEFAULT_APP_STATE,
  getRecommendedDefaultsForProfile,
  ONBOARDING_STEP_ORDER,
  type AnswerStyle,
  type AppSettings,
  type DevicePreference,
  type InteractionPreference,
  type OnboardingStep,
  type PersistedAppState,
  type SetupRoute,
  type VisionProfile,
} from "@/types/onboarding";

export const APP_STATE_STORAGE_KEY = "accessai.appState.v1";

export interface AppStateSlice extends PersistedAppState {
  /** False until the persisted value (or its absence) has been read from disk. */
  hydrated: boolean;
}

const initialState: AppStateSlice = { ...DEFAULT_APP_STATE, hydrated: false };

/** The single persisted store for onboarding progress + settings. Import actions below rather than calling setState directly. */
export const appStateStore = createStore<AppStateSlice>(initialState);

let hasStartedHydration = false;

/** Call once, near app start (see app/_layout.tsx). Safe to call more than once — later calls are no-ops. */
export async function hydrateAppState(): Promise<void> {
  if (hasStartedHydration) {
    return;
  }
  hasStartedHydration = true;

  const persisted = await readJson<PersistedAppState>(APP_STATE_STORAGE_KEY);
  appStateStore.setState((prev) => ({
    onboarding: persisted?.onboarding ?? prev.onboarding,
    settings: persisted?.settings ?? prev.settings,
    hydrated: true,
  }));
}

async function persist(state: AppStateSlice): Promise<void> {
  const { hydrated: _hydrated, ...toPersist } = state;
  await writeJson<PersistedAppState>(APP_STATE_STORAGE_KEY, toPersist);
}

function update(updater: (prev: AppStateSlice) => AppStateSlice): void {
  appStateStore.setState(updater);
  void persist(appStateStore.getState());
}

export function chooseSetupRoute(route: SetupRoute): void {
  update((prev) => ({
    ...prev,
    onboarding: { ...prev.onboarding, setupRoute: route, currentStep: "vision" },
  }));
}

/** Applies the profile's recommended defaults immediately. Every value stays user-overridable on later steps or in Settings. */
export function chooseVisionProfile(profile: VisionProfile): void {
  const defaults = getRecommendedDefaultsForProfile(profile);
  update((prev) => ({
    ...prev,
    onboarding: {
      ...prev.onboarding,
      visionProfile: profile,
      interactionPreference: defaults.interactionPreference,
      answerStyle: defaults.answerStyle,
      currentStep: "interaction",
    },
    settings: { ...prev.settings, autoSpeakAnswers: defaults.autoSpeakAnswers },
  }));
}

/**
 * "Use recommended blind settings" shortcut (Welcome screen, requirement 2 of
 * the blind-first accessibility pass): configures a full totally-blind
 * profile in one action — spoken setup route, totally-blind vision,
 * voice-first interaction, Android/TalkBack, automatic spoken answers, and
 * short/direct responses — and jumps straight to Confirmation so the user
 * hears the whole profile read back immediately. Every value here remains
 * exactly as user-overridable afterward (via "Review settings" or Settings)
 * as if each screen had been stepped through individually.
 */
export function applyRecommendedBlindDefaults(): void {
  update((prev) => ({
    ...prev,
    onboarding: {
      ...prev.onboarding,
      setupRoute: "spoken",
      visionProfile: "totally_blind",
      interactionPreference: "voice_first",
      devicePreference: "android_talkback",
      answerStyle: "short_direct",
      currentStep: "confirmation",
    },
    settings: { ...prev.settings, autoSpeakAnswers: true },
  }));
}

export function chooseInteractionPreference(preference: InteractionPreference): void {
  update((prev) => ({
    ...prev,
    onboarding: { ...prev.onboarding, interactionPreference: preference, currentStep: "device" },
  }));
}

export function chooseDevicePreference(device: DevicePreference): void {
  update((prev) => ({
    ...prev,
    onboarding: { ...prev.onboarding, devicePreference: device, currentStep: "answer_behavior" },
  }));
}

export function chooseAnswerBehavior(answerStyle: AnswerStyle, autoSpeakAnswers: boolean): void {
  update((prev) => ({
    ...prev,
    onboarding: { ...prev.onboarding, answerStyle, currentStep: "confirmation" },
    settings: { ...prev.settings, autoSpeakAnswers },
  }));
}

export function goToOnboardingStep(step: OnboardingStep): void {
  update((prev) => ({ ...prev, onboarding: { ...prev.onboarding, currentStep: step } }));
}

export function advanceOnboardingStep(): void {
  update((prev) => {
    const currentIndex = ONBOARDING_STEP_ORDER.indexOf(prev.onboarding.currentStep);
    const nextStep =
      ONBOARDING_STEP_ORDER[Math.min(currentIndex + 1, ONBOARDING_STEP_ORDER.length - 1)] ??
      prev.onboarding.currentStep;
    return { ...prev, onboarding: { ...prev.onboarding, currentStep: nextStep } };
  });
}

export function completeOnboarding(): void {
  update((prev) => ({
    ...prev,
    onboarding: { ...prev.onboarding, completed: true, currentStep: "done" },
  }));
}

/** "Change accessibility setup": reopens the flow with today's choices preserved as the starting point. */
export function reopenOnboarding(): void {
  update((prev) => ({
    ...prev,
    onboarding: { ...prev.onboarding, completed: false, currentStep: "vision" },
  }));
}

export function updateSettings(partial: Partial<AppSettings>): void {
  update((prev) => ({ ...prev, settings: { ...prev.settings, ...partial } }));
}

/** Full reset for testing or an explicit "start over" action. Settings are left untouched — only onboarding progress resets. */
export function resetOnboardingProgress(): void {
  update((prev) => ({ ...prev, onboarding: DEFAULT_APP_STATE.onboarding }));
}
