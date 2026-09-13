import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  APP_STATE_STORAGE_KEY,
  appStateStore,
  chooseAnswerBehavior,
  chooseDevicePreference,
  chooseInteractionPreference,
  chooseSetupRoute,
  chooseVisionProfile,
  completeOnboarding,
  reopenOnboarding,
  resetOnboardingProgress,
  updateSettings,
} from "@/state/appStateStore";
import { DEFAULT_APP_STATE } from "@/types/onboarding";

/**
 * Covers onboarding persistence: applying a vision profile's recommended
 * defaults, staying user-overridable afterward (spec section 3), and every
 * state change being written to AsyncStorage under one stable key.
 */
describe("appStateStore", () => {
  beforeEach(() => {
    appStateStore.setState({ ...DEFAULT_APP_STATE, hydrated: true });
    jest.clearAllMocks();
  });

  it("applies the totally_blind profile's recommended defaults", () => {
    chooseVisionProfile("totally_blind");

    const state = appStateStore.getState();
    expect(state.onboarding.visionProfile).toBe("totally_blind");
    expect(state.onboarding.interactionPreference).toBe("voice_first");
    expect(state.onboarding.answerStyle).toBe("short_direct");
    expect(state.settings.autoSpeakAnswers).toBe(true);
  });

  it("lets the user override a recommended default afterward", () => {
    chooseVisionProfile("totally_blind");
    chooseInteractionPreference("large_text");
    updateSettings({ autoSpeakAnswers: false });

    const state = appStateStore.getState();
    // The profile itself is untouched by overriding one of its defaults.
    expect(state.onboarding.visionProfile).toBe("totally_blind");
    expect(state.onboarding.interactionPreference).toBe("large_text");
    expect(state.settings.autoSpeakAnswers).toBe(false);
  });

  it("does not force totally-blind defaults on other profiles", () => {
    chooseVisionProfile("low_vision");

    const state = appStateStore.getState();
    expect(state.onboarding.interactionPreference).toBe("large_text");
    expect(state.settings.autoSpeakAnswers).toBe(false);
  });

  it("advances currentStep through the full flow and completes", () => {
    chooseSetupRoute("spoken");
    chooseVisionProfile("totally_blind");
    chooseInteractionPreference("voice_first");
    chooseDevicePreference("android_talkback");
    chooseAnswerBehavior("short_direct", true);
    expect(appStateStore.getState().onboarding.currentStep).toBe("confirmation");

    completeOnboarding();
    const state = appStateStore.getState();
    expect(state.onboarding.completed).toBe(true);
    expect(state.onboarding.currentStep).toBe("done");
  });

  it("reopenOnboarding clears completed but keeps prior selections", () => {
    chooseVisionProfile("totally_blind");
    completeOnboarding();

    reopenOnboarding();

    const state = appStateStore.getState();
    expect(state.onboarding.completed).toBe(false);
    expect(state.onboarding.visionProfile).toBe("totally_blind");
  });

  it("resetOnboardingProgress restores onboarding defaults but leaves settings alone", () => {
    chooseVisionProfile("totally_blind");
    updateSettings({ startupSpeechEnabled: false });
    completeOnboarding();

    resetOnboardingProgress();

    const state = appStateStore.getState();
    expect(state.onboarding).toEqual(DEFAULT_APP_STATE.onboarding);
    expect(state.settings.startupSpeechEnabled).toBe(false);
  });

  it("persists every state change to AsyncStorage under one key", async () => {
    chooseVisionProfile("totally_blind");
    // Actions persist asynchronously (fire-and-forget); flush microtasks.
    await Promise.resolve();
    await Promise.resolve();

    expect(AsyncStorage.setItem).toHaveBeenCalled();
    const lastCall = (AsyncStorage.setItem as jest.Mock).mock.calls.at(-1);
    expect(lastCall?.[0]).toBe(APP_STATE_STORAGE_KEY);
    const savedValue = JSON.parse(lastCall?.[1] as string);
    expect(savedValue.onboarding.visionProfile).toBe("totally_blind");
    // The transient `hydrated` flag is not part of the persisted shape.
    expect(savedValue.hydrated).toBeUndefined();
  });
});
