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
