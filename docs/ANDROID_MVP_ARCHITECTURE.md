# Android MVP Architecture

Scope: `mobile/` — the native Android foundation built on Expo + React
Native + TypeScript. This document explains how it's put together and why.
For setup/run/test/build commands, see `mobile/README.md`. For the
onboarding behavior this implements, see
`docs/BLIND_FIRST_ONBOARDING_SPEC.md`.

## Relationship to the rest of the repository

The repository root is a Streamlit proof of concept (`app.py`,
`onboarding.py`, `components/spoken_setup/`). `mobile/` is a separate,
isolated application: different language, different runtime, different
deployment target, sharing nothing at runtime with the Streamlit app.
Nothing in `mobile/` imports, calls, or depends on the Streamlit code or its
deployment, and nothing outside `mobile/` (and this doc, plus the
`mobile/`-specific `.gitignore` additions) was changed to build it.

## Why these choices

- **Expo (managed workflow), not a bare React Native project.** No native
  Android/iOS project is committed; `expo prebuild` generates one on demand
  and it's gitignored. This keeps the foundation buildable with just Node —
  no Android Studio required to run it via Expo Go — and keeps upgrades
  (RN, permissions plugins) centralized in `app.json`'s `plugins` array
  instead of hand-edited native manifests.
- **Expo Router (file-based routing).** `app/` maps directly to navigable
  routes; each route file is a one-line wrapper around a component in
  `src/screens/`. That split matters for testing: `src/screens/HomeScreen.tsx`
  can be unit/component-tested with `@testing-library/react-native` with no
  router, navigation container, or native module involved, while `app/index.tsx`
  stays thin enough that its only real logic (the onboarding redirect) is
  itself pulled out into a pure function (`src/state/routingDecisions.ts`)
  that's tested the same way.
- **Strict TypeScript, minimal dependencies.** The onboarding spec's own
  non-goals explicitly warn against unnecessary dependencies. Beyond Expo's
  own modules (`expo-router`, `expo-speech`, `expo-camera`, `expo-audio`,
  `expo-status-bar`, `expo-splash-screen`) the only third-party packages are
  `@react-native-async-storage/async-storage` (local persistence) and
  `@react-native-community/netinfo` (the offline-state requirement) —
  both directly required by a stated requirement, nothing added
  speculatively. State management is ~30 lines of hand-rolled
  observable store (`src/utils/createStore.ts`) plus React 19's built-in
  `useSyncExternalStore`, rather than a state-management library.

## Layered structure

```text
app/            → routing only (Expo Router). Renders src/screens/*.
src/screens/    → screen components. All UI logic lives here; testable without a router.
src/components/ → shared, accessibility-hardened building blocks (buttons, toggles, choice lists, status states).
src/hooks/      → behavior: speech, network status, startup-speech and answer-speech decisions.
src/services/   → typed interfaces (src/types/services.ts) + one mock and one "remote" implementation per service.
src/state/      → appStateStore (persisted onboarding+settings) and lastAnswerStore (session-only).
src/theme/      → the only place colors, spacing, type sizes, and touch-target sizes are defined.
src/constants/  → all onboarding/help copy, spoken and visual, in one place.
```

Data/control flow for a typical action (asking a typed question):

```text
AskScreen (src/screens/AskScreen.tsx)
  → getServices().question.ask(...)      [src/services/serviceRegistry.ts]
      → mockQuestionService               (default: mock mode)
      → remoteQuestionService             (only if EXPO_PUBLIC_MOCK_MODE=false + base URL set)
  → recordLastAnswer(...)                 [src/state/lastAnswerStore.ts] → powers "Repeat last answer" from Home
  → useAnswerSpeech()(...)                [src/hooks/useAnswerSpeech.ts] → plays server audio if present, else on-device TTS, only if the user has auto-speak on
```

## Service abstraction & the mock-mode default

Every capability that could eventually call a real AI backend
(`TranscriptionService`, `ImageAnalysisService`, `QuestionService`, plus
`SpeechPlaybackService` for server-generated answer audio) is defined as a
TypeScript interface in `src/types/services.ts`. Each has exactly one mock
implementation (`src/services/**/mock*.ts`, deterministic, offline, clearly
labeled as mock in its own output) and one minimal "remote" implementation
(`src/services/**/remote*.ts`, a thin `fetch` call to a configurable
backend). `src/services/serviceRegistry.ts` is the only place that decides
which one is live, based on `src/services/config/backendConfig.ts`:

- No `EXPO_PUBLIC_BACKEND_BASE_URL` configured → mock, always.
- Base URL set but `EXPO_PUBLIC_MOCK_MODE` is not the literal string
  `"false"` → still mock. (Anything ambiguous defaults to the safe side.)
- Base URL set **and** `EXPO_PUBLIC_MOCK_MODE=false` → remote implementations.

On-device text-to-speech (`TtsService` / `deviceTtsService`) is not gated by
this at all — it has exactly one implementation, always used, and never
calls a network or AI service. That's deliberate: it's what startup speech
and the answer-speech fallback both rely on, per the MVP requirement that
startup speech must never depend on a backend.

No OpenAI key or other secret exists anywhere in this app. The only
"backend" concept is `EXPO_PUBLIC_BACKEND_BASE_URL`, a plain URL, which is
the only thing that may ever be an `EXPO_PUBLIC_*` variable (those are
compiled into the client bundle and are never an appropriate place for a
credential).

## Onboarding

`src/state/appStateStore.ts` holds one persisted document
(`AsyncStorage` key `accessai.appState.v1`, read via `src/utils/storage.ts`)
with two parts:

- `onboarding`: the state machine from
  `docs/BLIND_FIRST_ONBOARDING_SPEC.md` — `currentStep` (`welcome` →
  `vision` → `interaction` → `device` → `answer_behavior` →
  `confirmation` → `done`), `setupRoute` (`spoken`/`visual`), and the four
  selections (vision profile, interaction, device, answer style).
- `settings`: `autoSpeakAnswers` and `startupSpeechEnabled` — seeded by
  onboarding (a vision profile applies recommended defaults immediately,
  per spec section 3) but freely editable afterward from Settings.

Because `currentStep` is persisted on every change, an interrupted session
resumes exactly where it left off on relaunch (spec section 9) with no
special-case resume logic — `app/index.tsx` and the onboarding routes just
read the persisted step like any other state. Vision profile is stored as
a stable string value (`"totally_blind"`, etc.) per the spec's explicit
warning against inferring behavior from a visible label.

Every onboarding step shares one shell (`src/components/OnboardingStepShell.tsx`):
a heading, the step's prompt as always-visible text, a manual "Repeat this
instruction" button, the step's own content, and Back/Continue. The prompt
is additionally auto-spoken once per step **only** on the spoken-setup
route (`setupRoute === "spoken"`) — the visual route gets identical text on
screen without forced speech, matching the existing Streamlit prototype's
documented behavior. No custom swipe/gesture handling exists anywhere in
onboarding; every control is a standard, focusable, labeled
button/radio/switch so TalkBack/VoiceOver's own navigation and double-tap
activation work unmodified (spec section 5).

## Startup speech

`src/hooks/useStartupSpeech.ts` speaks a short welcome once per app launch
using on-device TTS (`expo-speech`), gated by a pure, independently-tested
decision function (`src/hooks/startupSpeechDecision.ts`):
hydrated + onboarding complete + the user's own "startup speech" setting +
not already spoken this session. `src/hooks/useSpeech.ts` (the underlying
TTS wrapper) listens for `AppState` changes and stops speech the moment the
app leaves the foreground — covering both "the user switched apps" and "a
phone call interrupted playback" — and stops again on unmount, so no screen
can leave speech running after the user has navigated away.

## Accessibility conventions

- **Touch targets:** `src/theme/a11y.ts` defines
  `ANDROID_MIN_TOUCH_TARGET_DP = 48` (Android's documented floor) and sizes
  every control at or above `MIN_TOUCH_TARGET = 56`; primary home-screen
  controls use `PRIMARY_CONTROL_HEIGHT = 96`.
- **Color/contrast:** one token file (`src/theme/colors.ts`); the default
  text/background pairing is ~15.8:1, well past WCAG AAA.
- **Semantics:** every interactive element sets an explicit
  `accessibilityRole` (`button`, `radio`/`radiogroup`, `switch`, `header`,
  `alert`, `progressbar`) and a real accessible name — never an icon or
  color alone. Status changes (loading, error, offline) use
  `accessibilityLiveRegion` so they're announced without the user having to
  find them.
- **Focus:** every pressable control is `focusable` with a visible focus
  ring (`src/theme/a11y.ts`'s `FOCUS_RING_WIDTH`) for sighted keyboard
  users, and standard RN focus order (document order) is left alone rather
  than reordered with custom logic.

## Camera assistance and the navigation-safety boundary

`ImageAnalysisResult` (`src/types/services.ts`) always carries a
`disclaimer` field alongside `description`, and `CameraScreen` always
renders and speaks both together — the disclaimer is never optional or
editable away. Both the mock and the sketched remote implementation return
language to the effect of "not verified, never rely on this for
navigation, safety, medication, or other high-stakes decisions" (mirroring
the repository root README's existing safety note). This is a hard
constraint on the MVP, not a style choice: a single photo cannot establish
that a route, object, or substance is safe, and no future backend
integration should be able to make this screen imply otherwise by omission.

## Permissions

Two sensitive runtime permissions are requested through Expo config plugins:
`CAMERA` and `RECORD_AUDIO`. The generated application also declares
`INTERNET` for the future backend and `MODIFY_AUDIO_SETTINGS` for audio
handling; neither prompts the user. Legacy storage, overlay, and vibration
permissions are explicitly blocked in `app.json`. No location, background
recording, contacts, emergency-calling, or smart-glasses permission is used.

## Testing strategy

`__tests__/` is organized by what's being verified, not by file layout:

- `onboarding/` — the persisted store's defaults-then-overridable behavior,
  full step progression, and hydration/resume from a previously-saved
  state (including an interrupted session resuming mid-flow).
- `speech/` — the startup-speech decision function in isolation (every
  branch: not hydrated, onboarding incomplete, setting off, already spoken).
- `services/` — that the mock/remote switch in `serviceRegistry.ts` actually
  respects the safe-default rule in every combination, and that each mock
  service's own behavior (rejects empty input, always returns a disclaimer,
  never fabricates server audio) holds.
- `components/` — `AccessibleButton`/`AccessibleToggle` expose the roles,
  names, hints, and states assistive tech depends on, and actually call
  their handlers (or don't, when disabled).
- `home/` — `HomeScreen` renders all six required primary/secondary
  controls, navigates to the right route from each, and both the
  "nothing to repeat" and "repeat the real last answer" paths for that
  control.

See `mobile/README.md`'s "Known limitations" for what has and hasn't
actually been executed in the environment this was built in.

## Deliberately out of scope for this MVP

- Real backend integration (the `remote*.ts` files are a foundation to
  build on, not a tested integration).
- A native Gradle/EAS build artifact (no Android SDK/EAS account available
  in the build environment).
- Physical TalkBack/device accessibility testing (spec section 13's manual
  script still needs to run on a real device).
- Smart-glasses support (explicitly excluded per the task's own constraints
  and the repository's existing `docs/smart-glasses-interface.md`).
