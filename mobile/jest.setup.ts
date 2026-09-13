// Official jest mocks for native modules with no jsdom equivalent. Every
// test in the suite gets these for free; a test that needs to assert on a
// specific call (e.g. that Speech.speak was invoked) still adds its own
// jest.mock("expo-speech", ...) with jest.fn()s, which overrides this one.
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

jest.mock("@react-native-community/netinfo", () => ({
  fetch: jest.fn().mockResolvedValue({ isConnected: true }),
  addEventListener: jest.fn().mockReturnValue(() => {}),
}));

jest.mock("expo-audio", () => ({
  AudioModule: {
    getRecordingPermissionsAsync: jest.fn().mockResolvedValue({
      granted: true,
      canAskAgain: true,
    }),
    requestRecordingPermissionsAsync: jest.fn().mockResolvedValue({
      granted: true,
      canAskAgain: true,
    }),
  },
  RecordingPresets: { HIGH_QUALITY: {} },
  createAudioPlayer: jest.fn(() => ({
    addListener: jest.fn(),
    play: jest.fn(),
    remove: jest.fn(),
  })),
  useAudioRecorder: jest.fn(() => ({
    prepareToRecordAsync: jest.fn(),
    record: jest.fn(),
    stop: jest.fn(),
    uri: null,
  })),
  useAudioRecorderState: jest.fn(() => ({ isRecording: false })),
}));

jest.mock("expo-speech", () => ({
  speak: jest.fn((_text: string, options?: { onDone?: () => void }) => {
    options?.onDone?.();
  }),
  stop: jest.fn().mockResolvedValue(undefined),
  isSpeakingAsync: jest.fn().mockResolvedValue(false),
}));

// react-native's own AccessibilityInfo native module, mocked at its internal
// path so `import { AccessibilityInfo } from "react-native"` (used
// throughout the blind-first accessibility pass) resolves to this mock
// without mocking the rest of the "react-native" package. Defaults to "no
// screen reader" so every test written before screen-reader detection
// existed keeps exercising the same on-device-TTS path it always has;
// __emitScreenReaderChanged lets a test simulate TalkBack being toggled on
// or off, the same way the netinfo mock above lets tests simulate
// connectivity changes.
jest.mock("react-native/Libraries/Components/AccessibilityInfo/AccessibilityInfo", () => {
  const mockAccessibilityListeners = new Set();
  const mockAccessibilityInfo = {
    isScreenReaderEnabled: jest.fn().mockResolvedValue(false),
    addEventListener: jest.fn((_eventName, handler) => {
      mockAccessibilityListeners.add(handler);
      return { remove: jest.fn(() => mockAccessibilityListeners.delete(handler)) };
    }),
    announceForAccessibility: jest.fn(),
    setAccessibilityFocus: jest.fn(),
    fetch: jest.fn().mockResolvedValue(false),
    // @ts-expect-error Type annotations inside a hoisted Jest factory are rejected by Babel.
    __emitScreenReaderChanged: (screenReaderEnabled) => {
      // @ts-expect-error The untyped Set is intentional for the hoisted Jest factory.
      mockAccessibilityListeners.forEach((handler) => handler(screenReaderEnabled));
    },
  };
  return { __esModule: true, default: mockAccessibilityInfo, ...mockAccessibilityInfo };
});
