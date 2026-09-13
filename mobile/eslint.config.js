// Flat ESLint config (ESLint 9+), built on Expo's shared config.
// https://docs.expo.dev/guides/using-eslint/
const expoConfig = require("eslint-config-expo/flat");

module.exports = [
  ...expoConfig,
  {
    ignores: ["dist/*", "android/*", "ios/*", ".expo/*", "node_modules/*"],
  },
  {
    rules: {
      // Accessibility-first app: catch missing labels/roles early rather than
      // relying only on manual TalkBack review.
      "react-native/no-raw-text": "off",
    },
  },
  {
    files: ["__tests__/**/*.{ts,tsx}", "jest.setup.ts"],
    rules: {
      // Jest module-reset tests intentionally load modules after mocks/env setup.
      "@typescript-eslint/no-require-imports": "off",
      "import/first": "off",
    },
  },
];
