/**
 * Hydration reads whatever is on disk exactly once per app launch. Tested
 * in its own file with jest.resetModules() so appStateStore's
 * once-per-launch guard starts fresh for each case.
 */
function requireAsyncStorage() {
  // The community jest mock's export shape has varied across versions;
  // support both `import AsyncStorage from "..."` and plain `require(...)`.
  const mod = require("@react-native-async-storage/async-storage");
  return mod.default ?? mod;
}

describe("hydrateAppState", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it("loads persisted onboarding progress and settings from storage", async () => {
    const AsyncStorage = requireAsyncStorage();
    const {
      APP_STATE_STORAGE_KEY,
      appStateStore,
      hydrateAppState,
    } = require("@/state/appStateStore");

    const persisted = {
      onboarding: {
        completed: true,
        currentStep: "done",
        setupRoute: "spoken",
        visionProfile: "totally_blind",
        interactionPreference: "voice_first",
        devicePreference: "android_talkback",
        answerStyle: "short_direct",
      },
      settings: { autoSpeakAnswers: true, startupSpeechEnabled: false },
    };
    await AsyncStorage.setItem(APP_STATE_STORAGE_KEY, JSON.stringify(persisted));

    await hydrateAppState();

    const state = appStateStore.getState();
    expect(state.hydrated).toBe(true);
    expect(state.onboarding.completed).toBe(true);
    expect(state.onboarding.visionProfile).toBe("totally_blind");
    expect(state.settings.autoSpeakAnswers).toBe(true);
    expect(state.settings.startupSpeechEnabled).toBe(false);
  });

  it("falls back to defaults when nothing has been saved yet", async () => {
    const { appStateStore, hydrateAppState } = require("@/state/appStateStore");
    const { DEFAULT_APP_STATE } = require("@/types/onboarding");

    await hydrateAppState();

    const state = appStateStore.getState();
    expect(state.hydrated).toBe(true);
    expect(state.onboarding).toEqual(DEFAULT_APP_STATE.onboarding);
    expect(state.settings).toEqual(DEFAULT_APP_STATE.settings);
  });

  it("resumes an interrupted onboarding at its saved step rather than restarting", async () => {
    const AsyncStorage = requireAsyncStorage();
    const {
      APP_STATE_STORAGE_KEY,
      appStateStore,
      hydrateAppState,
    } = require("@/state/appStateStore");

    const persisted = {
      onboarding: {
        completed: false,
        currentStep: "device",
        setupRoute: "spoken",
        visionProfile: "totally_blind",
        interactionPreference: "voice_first",
        devicePreference: null,
        answerStyle: null,
      },
      settings: { autoSpeakAnswers: true, startupSpeechEnabled: true },
    };
    await AsyncStorage.setItem(APP_STATE_STORAGE_KEY, JSON.stringify(persisted));

    await hydrateAppState();

    expect(appStateStore.getState().onboarding.currentStep).toBe("device");
    expect(appStateStore.getState().onboarding.completed).toBe(false);
  });
});
