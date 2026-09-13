# Access AI — Android MVP (mobile/)

Native Android foundation for Access AI, built with Expo + React Native +
TypeScript. This is the MVP scaffold described in the repository root
README's "Native Android is the primary mobile product direction" note — it
does not replace or touch the Streamlit prototype at the repository root.

**Status: foundation, not a finished product.** It runs entirely in a safe
mock mode by default (no backend, no network calls, no AI service) so it can
be built, run, and tested with zero external accounts. See "Known
limitations" below before treating anything here as verified.

## What's here

- Accessibility-first home screen: Ask by voice, Camera assistance, Type a
  question, Repeat last answer, Help, Settings — all large, high-contrast,
  TalkBack-labeled controls.
- First-run onboarding implementing `docs/BLIND_FIRST_ONBOARDING_SPEC.md`
  (spoken and visual setup paths, vision profile, interaction/device/answer
  preferences, persisted locally, resumable if interrupted).
- On-device startup speech (expo-speech) — never an AI/network call.
- Camera capture (expo-camera) and voice recording (expo-audio) UIs, each
  behind a typed service interface with a mock implementation wired up by
  default and a minimal "real backend" implementation ready for later.
- No secrets in the client. A configurable backend base URL
  (`EXPO_PUBLIC_BACKEND_BASE_URL`) with mock mode as the safe default.

## Prerequisites (Windows)

- **Node.js 20 LTS or newer** and npm — <https://nodejs.org>
- **Git** (already required for the rest of this repo)
- One of:
  - **Expo Go** app on a physical Android phone (fastest way to run this),
    or
  - **Android Studio** with an Android Virtual Device (AVD) set up, for an
    emulator, or
  - A JDK (17) and the Android SDK on PATH, only if you intend to run a
    local Gradle build (`npm run build:android:local`) instead of Expo's
    own tooling.

## Setup (Windows PowerShell)

```powershell
cd mobile
npm ci

# Confirm the locked dependency set still matches Expo SDK 57:
npx expo install --check

# Optional: only needed once you have a real backend to point at.
# Copy .env.example .env
```

## Run it

```powershell
npm run start
```

This opens Expo's dev tools. From there:

- Press `a` to launch on a connected Android emulator, or
- Scan the QR code with the **Expo Go** app on a physical Android phone
  (fastest path, no Android Studio required).

Direct Android shortcut (starts the dev server and opens an emulator/device
if one is already connected):

```powershell
npm run android
```

## Test, lint, typecheck, format

```powershell
npm test              # jest (jest-expo preset)
npm run test:ci        # jest with coverage, CI-style output
npm run lint           # eslint . (flat config, eslint-config-expo)
npm run typecheck      # tsc --noEmit
npm run format         # prettier --check .
npm run format:write   # prettier --write .
```

## Building an installable Android package

Two supported paths:

**A. EAS Build (cloud, recommended)** — requires a free Expo account:

```powershell
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```

`eas.json` already defines `development`, `preview`, and `production`
profiles (`preview` builds an installable `.apk`; `production` builds an
`.aab` for the Play Store).

**B. Local Gradle build** — requires Android Studio's SDK + a JDK 17 on
PATH:

```powershell
npm run build:android:local
```

This runs `expo prebuild --platform android` (generates the native
`android/` project — gitignored, regenerate anytime) followed by
`gradlew.bat assembleRelease`. The signed/unsigned release APK lands under
`android\app\build\outputs\apk\release\`.

## Environment variables

See `.env.example`. Only two variables exist, both optional, and neither is
a secret:

- `EXPO_PUBLIC_BACKEND_BASE_URL` — your backend's base URL. Leave blank to
  stay in mock mode.
- `EXPO_PUBLIC_MOCK_MODE` — defaults to safe mock mode. Set to `false` (and
  set the base URL above) once you have a real backend to test against.

Every `EXPO_PUBLIC_*` variable is compiled into the client bundle — never
put an API key or other credential in one. This app has none: no OpenAI key
or other credential is embedded anywhere in the client. All AI-backed
features are designed to call your own backend, which holds real
credentials server-side.

## Project structure

```text
mobile/
  app/                     Expo Router routes (thin — render src/screens/*)
    onboarding/            Onboarding step routes
  src/
    screens/               Actual screen components (unit-testable directly)
    components/            Shared accessible UI (AccessibleButton, ChoiceList, ...)
    theme/                 Colors, spacing, typography, touch-target sizes
    services/              Typed service interfaces + mock/remote implementations
    state/                 appStateStore (persisted onboarding+settings), lastAnswerStore
    hooks/                 useSpeech, useStartupSpeech, useAnswerSpeech, ...
    types/                 Onboarding + service domain types
    constants/             Onboarding/help copy (spoken + visual)
    utils/                 storage.ts (AsyncStorage wrapper), createStore.ts
  __tests__/               Jest + @testing-library/react-native
  docs -> ../docs/ANDROID_MVP_ARCHITECTURE.md (repository docs/ folder)
```

## Known limitations

Read these before treating the foundation as a finished product:

- **Automated foundation checks pass.** The locked dependencies install,
  `expo install --check`, Expo Doctor, strict TypeScript, ESLint with zero
  warnings, Prettier, 49 Jest tests, native Android prebuild, and an Android
  Metro export have all completed successfully.
- **No Gradle APK yet.** Native generation succeeds, but the verification
  environment could not download the Gradle distribution. Build locally or
  with EAS before installing the app.
- **Voice and server-audio need device testing.** Their Expo SDK 57 APIs pass
  typechecking and bundling, but microphone lifecycle, interruption, and
  playback still require a real Android device.
- **Camera/voice/question backends are mock-only.** `src/services/**/remote*.ts`
  sketches the intended real HTTP calls (`/v1/ask`, `/v1/transcribe`,
  `/v1/analyze-image`) but there is no real backend to test them against
  yet, and they have not been exercised at all.
- **Placeholder icon/splash assets.** `assets/*.png` are solid-color
  placeholders generated for this commit, not real branding. Replace before
  any store submission.
- **No physical TalkBack pass yet.** Semantics (roles, labels, states,
  focus order) were written to the letter of
  `docs/BLIND_FIRST_ONBOARDING_SPEC.md` and Android's touch-target
  guidance, but only a real device pass with TalkBack enabled and the
  screen off (or genuinely not watched) can confirm the experience —
  see that spec's section 13 for the exact manual test script.
