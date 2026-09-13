/** @type {import('jest').Config} */
module.exports = {
  preset: "jest-expo",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  // Mirrors the "@/*" path alias declared in tsconfig.json — Jest does not
  // read tsconfig paths itself, so it's repeated here.
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^expo-modules-core(.*)$": "<rootDir>/node_modules/expo/node_modules/expo-modules-core$1",
  },
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|expo-router|expo-modules-core|expo-asset|expo-constants|expo-speech|expo-camera|expo-audio|expo-status-bar|expo-splash-screen|@react-navigation|react-native-safe-area-context|react-native-screens))",
  ],
  collectCoverageFrom: ["src/**/*.{ts,tsx}", "app/**/*.{ts,tsx}", "!**/*.d.ts"],
  coveragePathIgnorePatterns: ["/node_modules/"],
};
