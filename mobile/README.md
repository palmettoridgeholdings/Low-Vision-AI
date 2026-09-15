# Access AI — Android MVP (mobile/)

Native Android foundation for Access AI, built with Expo + React Native +
TypeScript. This is the MVP scaffold described in the repository root
README's "Native Android is the primary mobile product direction" note — it
does not replace or touch the Streamlit prototype at the repository root.

**Status: active Android MVP foundation.** The app runs in safe mock mode by
default (no backend, no network calls, no AI service) so the accessibility,
onboarding, voice/camera flow, and TalkBack behavior can be developed and
tested without external accounts.

## Current validated checkpoint — September 14, 2026

- Physical Android/TalkBack testing passed for the current onboarding/focus
  behavior.
- TalkBack focus now targets real accessible elements rather than synthetic
  wrapper views.
- Final accessibility cleanup baseline: commit
  `7a9dcd208e963c1cab40c89f8726f9befa69e585` on
  `codex/android-mvp-foundation`.
- Local verification passed: `npm ci`, TypeScript, ESLint (3 existing warnings
  only), 24 Jest suites / 118 tests, and `git diff --check`.
- `package-lock.json` was regenerated locally as a valid lockfile v3 after a
  previously committed binary-corrupt lockfile was discovered.
- Extra TalkBack announcements such as colors, font sizes, and pixel-style
  formatting were confirmed to come from TalkBack's optional
  **Settings → Verbosity → Speak text formatting** feature. Turning that
  option off removes the extra chatter. Access AI should not suppress a
  user-selected TalkBack verbosity feature in runtime code.
- Next engineering target: make startup speech begin immediately and reliably
  when the app opens without regressing TalkBack coexistence or focus.

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

- **Node.js 20 or newer** and npm — <https://nodejs.org>
- **Git**
- One of:
  - **Expo Go** on a physical Android phone, or
  - **Android Studio** with an Android Virtual Device, or
  - A JDK 17 + Android SDK for local Gradle builds.

## Setup (Windows PowerShell)

```powershell
cd mobile
npm ci

# Confirm the installed dependency set matches Expo SDK 57:
npx expo install --check

# Optional: only needed once you have a real backend to point at.
# Copy .env.example .env
```

Use `npm install` only when intentionally changing dependencies or regenerating
the lockfile. Normal reproducible setup should use `npm ci`.

## Run it

```powershell
npm run start
```

This opens Expo's dev tools. From there:

- Press `a` to launch on a connected Android emulator, or
- Scan the QR code with the **Expo Go** app on a physical Android phone.

Direct Android shortcut:

```powershell
npm run android
```

## Test, lint, typecheck, format

```powershell
npm test
npm run test:ci
npm run lint
npm run typecheck
npm run format
npm run format:write
```

## Building an installable Android package

Two supported paths:

**A. EAS Build (cloud, recommended)**

```powershell
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```

`eas.json` defines `development`, `preview`, and `production` profiles.

**B. Local Gradle build**

```powershell
npm run build:android:local
```

This runs `expo prebuild --platform android` followed by
`gradlew.bat assembleRelease`.

## Environment variables

See `.env.example`. Only two variables exist, both optional, and neither is
a secret:

- `EXPO_PUBLIC_BACKEND_BASE_URL` — backend base URL. Leave blank for mock mode.
- `EXPO_PUBLIC_MOCK_MODE` — defaults to safe mock mode. Set to `false` only
  when intentionally testing a real backend.

Every `EXPO_PUBLIC_*` variable is compiled into the client bundle. Never put
an API key or other credential in one.

## Project structure

```text
mobile/
  app/                     Expo Router routes
    onboarding/            Onboarding step routes
  src/
    screens/               Screen components
    components/            Shared accessible UI
    theme/                 Colors, spacing, typography, touch targets
    services/              Typed service interfaces + mock/remote implementations
    state/                 Persisted onboarding/settings + answer state
    hooks/                 Speech, startup speech, accessibility focus, etc.
    types/                 Onboarding + service domain types
    constants/             Onboarding/help copy
    utils/                 Storage, stores, accessibility utilities
  __tests__/               Jest + @testing-library/react-native
```

## TalkBack notes

The app is designed to coexist with TalkBack rather than replace it. Standard
TalkBack exploration/swipe/double-tap behavior should remain intact.

If TalkBack announces colors, font sizes, or other formatting details that are
not useful for your workflow, check:

**TalkBack → Settings → Verbosity → Speak text formatting**

That is an Android/TalkBack user preference, not an Access AI defect. See
`docs/TALKBACK_TEST_SCRIPT.md` for the current physical-device test procedure.

## Known limitations

- **Startup speech latency remains the next priority.** Speech works, but the
  next pass should make the first spoken guidance begin immediately and
  reliably when the app opens.
- **No Gradle APK is the current validation artifact.** The current checkpoint
  was tested through Expo/Metro on a physical Android phone.
- **Camera/voice/question backends remain mock-only.** Remote service stubs
  exist, but production backend integration is not complete.
- **Placeholder icon/splash assets remain.** Replace before store submission.
- **Physical TalkBack testing is required after future accessibility changes.**
  Automated tests cover semantics and focus logic, but cannot prove actual
  touch exploration or spoken behavior on a device.

## Current resume point

1. Start from the latest `origin/codex/android-mvp-foundation`.
2. Run `npm ci`, typecheck, lint, and Jest before editing.
3. Preserve the validated TalkBack/focus behavior.
4. Investigate startup-speech timing and make launch speech immediate and
   reliable.
5. Re-run the complete local verification matrix and physical TalkBack test
   before closing that pass.
