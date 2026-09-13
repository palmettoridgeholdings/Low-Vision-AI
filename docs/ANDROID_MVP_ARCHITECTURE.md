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
a heading, the step's prompt as always-visible text, manual "Repeat this
instruction" and "Stop speech" buttons, the step's own content, and
Back/Continue. The prompt is additionally auto-spoken once per step
**only** on the spoken-setup route (`setupRoute === "spoken"`) — the visual
route gets identical text on screen without forced speech, matching the
existing Streamlit prototype's documented behavior. The one exception is
the Welcome screen itself (`OnboardingWelcomeScreen.tsx`), which speaks its
introduction unconditionally: a first-time totally blind user hasn't chosen
a route yet, so there is nothing to gate on. No custom swipe/gesture
handling exists anywhere in onboarding; every control is a standard,
focusable, labeled button/radio/switch so TalkBack/VoiceOver's own
navigation and double-tap activation work unmodified (spec section 5).

Continue is never silently disabled. Each step passes
`canContinue`/`validationMessage` to the shell instead of the old
`continueDisabled`; activating Continue with an incomplete required choice
announces and displays the validation message (and clears it automatically
once the choice is made) rather than leaving an inert control with no
explanation. Selecting an option or toggling a switch is confirmed aloud on
the spoken route via `ChoiceList`'s `announceSelection` and
`AccessibleToggle`'s `announceChange` props — both speak "<label>
selected."/"<label>, on." through the shared spoken-guidance controller
below, so a screen-reader user gets the same confirmation a sighted user
gets from watching the radio/switch's visual state change.

"Use recommended blind settings" is the first focusable control on the
Welcome screen — ahead of "Start spoken setup" — calling
`applyRecommendedBlindDefaults()` in `appStateStore.ts`, which sets the
spoken route, `totally_blind` vision, `voice_first` interaction,
`android_talkback` device, `short_direct` answers, and auto-speak-answers
on, then jumps straight to Confirmation. Every one of those values remains
exactly as user-overridable afterward (via "Review settings" or Settings)
as if each step had been chosen individually — this is a shortcut through
the same state machine, not a separate locked mode.

## Spoken-guidance controller

`src/services/speech/spokenGuidanceController.ts` is the single app-wide
owner of on-device speech. Every other speech entry point —
`useSpeech()`, `useSpokenGuidance()`, `useAutoSpeakOnMount`,
`useStartupSpeech`, `useAnswerSpeech`, and every "Repeat"/"Stop
speech"/status-announcement call in the onboarding, Voice, and Camera
screens — ultimately calls into this one controller, which exposes:

- **State:** `"ready" | "preparing" | "playing" | "stopped" | "error"`,
  readable reactively via `useSpokenGuidance()` (backed by
  `useSyncExternalStore`, the same pattern as `appStateStore`).
- **`speak(text)`:** cancels whatever is queued/playing first, then speaks.
  Android's `TextToSpeech` queues consecutive `Speech.speak()` calls rather
  than interrupting, so without this a fast sequence of announcements (e.g.
  "Recording started..." immediately followed by an error) would play back
  to back instead of the later one replacing the earlier — which is exactly
  the "overlapping/stale speech" failure mode the blind-first pass calls
  out. `deviceTtsService.speak()` itself also calls `Speech.stop()` first,
  as defense in depth for any future direct caller.
- **`stop()`** and **`repeatLast()`:** stop whatever is playing, or re-speak
  the most recently requested prompt.
- **A monotonically increasing token**, incremented on every `speak()`/
  `stop()` call. Each call's `onDone`/`onError` callback checks its own
  token against the controller's current one before touching state, so a
  slow callback from an utterance the user has already moved past (e.g. by
  navigating to a different screen, which triggers its own `speak()`/`stop()`)
  can never overwrite state a newer utterance has already reached.

`useSpeech()` is kept as a thin, backward-compatible wrapper over
`useSpokenGuidance()` with its original `{ isSpeaking, speak, stop }` shape
(it still stops speech on backgrounding/unmount); anything that needs the
full state or `repeatLast()` — a "Repeat last spoken message" button on the
Voice/Camera screens, for instance — uses `useSpokenGuidance()` directly.

## Screen-reader detection and TalkBack coexistence

`src/services/accessibility/screenReaderStatusService.ts` is the single
app-wide detector for whether TalkBack/VoiceOver is active, built the same
way as the spoken-guidance controller: plain closures over a `createStore`
instance (never a class — its `getSnapshot`/`subscribe` are handed to
`useSyncExternalStore` as bare function references), backed by
`AccessibilityInfo.isScreenReaderEnabled()` plus a `"screenReaderChanged"`
listener. Its status is `"unknown" | "enabled" | "disabled"` —
**`"unknown"` until the first native check resolves**, never a guess — and
`useScreenReaderStatus()` is the reactive hook wrapper for components that
need to know it directly (e.g. choosing which first-launch instructions to
show on Welcome).

Detection is used only to pick the right *delivery channel* for
guidance/narration, never to remove a control or a piece of functionality
— a totally blind user with TalkBack off (or a failed detection, which
`screenReaderStatusService` treats the same as "unknown", never as
"disabled") still gets full offline device-TTS guidance and every control
this document describes elsewhere. The one place this status changes
behavior is inside `spokenGuidanceController.speak()` itself: while status
is `"enabled"`, it hands the utterance to
`AccessibilityInfo.announceForAccessibility()` (TalkBack's own
announcement channel) instead of starting `deviceTtsService`, so the app
never plays a second, competing audio stream over TalkBack's own speech.
Every existing call site — onboarding prompts, permission pre-briefings,
selection/toggle confirmations, Voice/Camera status narration, spoken
answers — keeps calling `speak()`/`useSpeech()`/`useSpokenGuidance()`
exactly as before; nothing about *whether* an utterance fires changes
(so explicit settings like "Automatically speak answers" are unaffected),
only *how* it's delivered. While status is `"unknown"` or `"disabled"`,
behavior is byte-for-byte what it was before this capability existed.

The Welcome screen additionally branches its actual *content* on this
status (`getOnboardingWelcomeMessage()` in
`src/constants/accessibilityCopy.ts`): the TalkBack-enabled variant leads
with drag-to-explore/swipe/double-tap-anywhere mechanics (meant to be
delivered *through* TalkBack, which is exactly what the controller's
channel selection does automatically); the TalkBack-disabled variant
explains that TalkBack is off, that Access AI cannot enable it
automatically, mentions — without promising it's configured on this
device — the volume-button accessibility shortcut, and points at "Open
Android accessibility settings" (`src/components/AccessibilitySettingsButton.tsx`,
on both Welcome and Help). That button opens the system Accessibility
settings via `Linking.sendIntent("android.settings.ACCESSIBILITY_SETTINGS")`
(falling back to `Linking.openSettings()` if the direct intent fails —
`src/utils/openAccessibilitySettings.ts`), never requests a permission or
tries to enable a service programmatically, and — on returning to the
foreground — announces the return and calls
`screenReaderStatusService.refresh()` rather than waiting on the native
change event to fire promptly.

## Predictable accessibility focus

`src/components/AccessibilityFocusRegion.tsx` wraps content that should
receive imperative accessibility focus whenever a `focusKey` prop changes
— typically a screen's own name (fires once on mount) or a piece of state
already being tracked (`flowState.status` on Voice/Camera, a validation
message on `OnboardingStepShell`), so focus follows navigation, permission
results, validation errors, recording start/stop, processing, and
results/failures, without ever refiring on an unrelated rerender or
stealing focus back mid-exploration. The actual native call
(`AccessibilityInfo.setAccessibilityFocus` via `findNodeHandle`) lives in
`src/utils/accessibilityFocus.ts`, kept separate so it can be mocked
directly in tests rather than depending on `findNodeHandle` resolving a
real native tag in the test renderer; like everything else in this pass,
it never throws — a failed or skipped focus call is a missed nicety, not a
reason to break navigation.

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

Both permission screens speak their context — why the permission is needed
— **before** the OS shows its own dialog: the context text is auto-spoken
as soon as the "needs-request" state renders (i.e. before the user presses
"Allow microphone/camera access", which is what actually triggers the OS
prompt), via `MICROPHONE_PERMISSION_CONTEXT`/`CAMERA_PERMISSION_CONTEXT` in
`src/constants/statusMessages.ts`. A denied permission is handled by one
shared component, `PermissionDeniedState`, which speaks its own explanation
unconditionally on mount and always offers both "Open device settings" and
a wired-up "Try again" — Voice and Camera each pass their own retry
callback (re-request the permission) rather than leaving the user stuck.

## Voice and camera status narration

Both the Voice and Camera screens narrate their own workflow state through
`useSpokenGuidance()`, using fixed copy from `src/constants/statusMessages.ts`
rather than ad hoc strings, so a totally blind user gets the same
step-by-step audio cues a sighted user gets from watching the screen:

- **Voice:** mic-ready → recording-started (with how to stop or cancel) →
  recording-stopped/processing → recognized question (the transcribed text,
  read back so the user can catch a misrecognition) → the answer (via the
  existing `useAnswerSpeech`, which still respects the user's "Automatically
  speak answers" setting) → or, on failure, the error plus how to retry. A
  new "Cancel recording" control (only shown while recording) discards the
  in-progress recording and announces "Recording cancelled." rather than
  submitting it. Narration is deliberately silent *during* an active
  recording — only before it starts and after it stops — so TTS is never
  something the microphone could pick up mid-recording ("prevent
  overlapping speech capture" is handled by timing, not by trying to duck
  audio levels). A best-effort unmount cleanup stops any in-progress
  recording if the user navigates away without pressing Stop or Cancel.
- **Camera:** camera-ready (current mode, how to change it, nonvisual
  positioning guidance) → mode-change confirmation (via `ChoiceList`'s
  `announceSelection`) → capture-started → analyzing → result together with
  its safety disclaimer, or the error plus how to retry. The result/
  disclaimer announcement is spoken unconditionally, **not** gated by
  "Automatically speak answers" — that setting governs conversational Q&A
  answers, whereas the camera's safety disclaimer ("never rely on this for
  navigation, safety, medication...") is safety-critical information, not
  an optional personalization, so it is never silently skipped.
- **Camera preview accessibility:** the `View` wrapping `CameraView` sets
  `accessibilityElementsHidden` and `importantForAccessibility="no-hide-descendants"`,
  so TalkBack's focus navigation skips the live preview entirely instead of
  landing on a video feed it can't meaningfully describe.

Both screens also expose "Repeat last spoken message" and "Stop speech"
controls (via `useSpokenGuidance()`), so a missed or unwanted announcement
is always recoverable without waiting for the next state change.

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

- `speech/` — beyond the startup-speech decision function, the
  spoken-guidance controller itself: state transitions, stop-before-speak,
  and that a stale callback from a superseded `speak()` call cannot
  overwrite newer state (the token-invalidation guarantee).
- `voice/`, `camera/` — permission states (checking/granted/needs-request/denied,
  each with its pre-permission announcement and a working retry), the
  status-announcement sequence, and (camera only) that the live preview is
  excluded from the accessibility tree.
- `accessibility/` — screen-reader detection (`"unknown"` default,
  resolving to the real value, reacting to a live change, listener
  cleanup), `spokenGuidanceController`'s TalkBack-vs-device-TTS channel
  selection (announces through `AccessibilityInfo.announceForAccessibility`
  while active, resumes on-device TTS once it's off, never both at once),
  the accessibility-focus utility/region (calls the focus API with a real
  handle, never on an unrelated rerender), and the "Open Android
  accessibility settings" control (direct intent, fallback, return/recheck
  announcement) — plus targeted additions in `voice/`, `camera/`, and
  `onboarding/`/`help/` covering the same TalkBack-channel and
  focus-on-transition behavior in context. Every one of these mocks
  `AccessibilityInfo`/the focus utility directly; **automated tests cannot
  prove that a real device actually reads a dragged-over control aloud or
  activates it on a double-tap anywhere on the screen** — see
  `docs/TALKBACK_TEST_SCRIPT.md`'s "What automated tests cannot cover".

See `mobile/README.md`'s "Known limitations" for what has and hasn't
actually been executed in the environment this was built in.

## Deliberately out of scope for this MVP

- Real backend integration (the `remote*.ts` files are a foundation to
  build on, not a tested integration).
- A native Gradle/EAS build artifact (no Android SDK/EAS account available
  in the build environment).
- Physical TalkBack/device accessibility testing — see
  `docs/TALKBACK_TEST_SCRIPT.md` for the manual script; it has not been run
  on a real device yet.
- Smart-glasses support (explicitly excluded per the task's own constraints
  and the repository's existing `docs/smart-glasses-interface.md`).
