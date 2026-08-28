# Access AI Blind-First Onboarding Implementation Specification

## Objective
A totally blind user must be able to launch Access AI for the first time, complete onboarding, enter the application, ask a question, hear the answer, repeat it, and reopen accessibility settings without sighted assistance.

This work must preserve the existing low-vision/visual setup and existing working application features. Implementation should be incremental, low-overhead, screen-reader compatible, and suitable for the current Streamlit prototype while leaving a clean path toward future native mobile and smart-glasses clients.

## Development Safety
- Implement on a dedicated feature branch. Do not modify `main` directly.
- Preserve working chat, camera, transcription, speech, and low-vision behavior unless a change is required for accessibility.
- Avoid unnecessary dependencies and API calls.
- Do not merge until automated tests pass and the manual eyes-free acceptance test is completed.

## 1. First-Run Entry
The first screen must expose two valid routes:

1. Existing visual/low-vision guided setup.
2. Blind-first spoken setup.

The blind-first route must expose a large, semantically correct accessible control named `Start spoken setup`.

Suggested spoken/accessible introduction:

> Welcome to Access AI. This setup can be completed without sight. To start spoken setup, activate Start spoken setup. If you use TalkBack or VoiceOver, navigate to Start spoken setup and double-tap.

Do not implement a custom one-finger left/right swipe handler. TalkBack and VoiceOver own those gestures. Standard screen-reader focus navigation and activation must continue to work.

## 2. Vision Profiles
Replace the ambiguous `Blind` profile with explicit choices:

- Totally blind / no useful vision
- Severe low vision
- Low vision
- Sighted caregiver
- Prefer not to say

Use a stable internal value for the totally blind profile, for example `totally_blind`. Do not determine the operating profile by substring matching the visible label.

## 3. Recommended Totally-Blind Profile
When `totally_blind` is selected, recommend these defaults:

- Primary interaction: Voice first
- Screen-reader compatibility: enabled/preserved
- Automatically speak answers: ON
- Spoken confirmations: ON
- Answer style: Short and direct
- Visual-only instructions: never used

These are recommended defaults, not locked settings. The user must be able to customize them.

## 4. Spoken Setup State Machine
The spoken path must be usable independently of sight.

### State A — Welcome
Announce that setup can be completed without sight and expose `Start spoken setup`.

### State B — Vision
Prompt:

> First, choose the vision option that best describes how you want Access AI to assist you.

For the blind-first route, recommend `Totally blind / no useful vision` and announce how to accept or review alternatives using standard accessible controls.

### State C — Interaction
Choices:

- Voice first
- Screen reader and touch
- Refreshable Braille
- Large text
- Combination

Recommend Voice first for the totally blind profile without disabling the other choices.

### State D — Device
Choices:

- Android / TalkBack
- iPhone / VoiceOver
- Windows / NVDA
- Windows / JAWS
- Mac / VoiceOver
- Other / Not sure

### State E — Answer Behavior
Allow configuration of:

- Automatically speak answers
- Short and direct
- Step-by-step
- Detailed
- Conversational

### State F — Confirmation
Speak/read a complete profile summary before completion. Example:

> Access AI is set for totally blind use, voice-first interaction, Android with TalkBack, automatic spoken answers, and short direct responses. Activate Finish setup to continue, or review settings to make changes.

Provide accessible `Finish setup` and `Review settings` actions.

## 5. Input Rules
For the Streamlit prototype:

- Preserve normal browser and assistive-technology behavior.
- Do not hijack one-finger left/right swipes.
- Do not require long press.
- Do not require custom multi-finger gestures.
- Standard TalkBack/VoiceOver double-tap activation must work through semantic controls.
- Enter and Space keyboard activation must work where appropriate.
- Focus order must be logical for keyboard, screen reader, and Braille users.

Custom gestures can be reconsidered in a future native mobile client where platform accessibility APIs can be used correctly.

## 6. Onboarding Audio Must Not Depend on OpenAI
Basic accessibility onboarding must remain functional without an OpenAI API key or network AI request.

Preferred order:

1. Local/pre-generated setup audio for fixed onboarding prompts.
2. Reliable platform/browser speech where appropriate.
3. Semantically readable text for TalkBack, VoiceOver, NVDA, JAWS, and other screen readers.

Do not generate fixed onboarding prompts through the OpenAI TTS API on every setup session.

If audio fails, the screen-reader-readable setup must remain fully operable and must not trap the user.

## 7. Persistent Accessibility State
Store the selected vision profile explicitly and use it throughout the app.

For `totally_blind` mode:

- Default automatic spoken answers to ON.
- Never require visual verification.
- Never identify a control only by color, icon, or visual position.
- Prefer useful nonvisual descriptions.
- Camera/location descriptions should use left/right, above/below, clock position, approximate distance, and nearby landmarks when supported by the available image evidence.
- Preserve accessible names for all important controls.

## 8. Main-App Accessibility Actions
Add accessible actions for:

### Repeat last answer
Replays or re-speaks the most recent assistant response without requiring the user to visually locate previous output.

### Help / What can I do?
Provides a concise spoken/readable description of the current screen and the primary available actions.

### Change accessibility setup
Allows the user to reopen and modify accessibility preferences after onboarding.

These actions must be discoverable by screen readers and keyboard navigation.

## 9. Resume Behavior
If onboarding is interrupted, preserve the current incomplete step where practical. On return, resume rather than unnecessarily restarting the entire flow.

Completed onboarding preferences must persist according to the application's existing persistence strategy. Do not introduce a heavyweight account/database requirement solely for onboarding.

## 10. Failure Behavior
### Audio failure
- Expose equivalent semantic text.
- Keep Back, Continue, Finish, and Review actions operable.
- Do not create a focus trap.

### Missing OpenAI API key
- Entire onboarding remains functional.
- Clearly explain after or during setup which AI capabilities require API access.
- Do not block accessibility preference configuration.

### Network failure
- Fixed onboarding instructions remain available locally/readably.
- Preserve user selections already made.

## 11. Semantic Accessibility Requirements
Every essential interactive control must have:

- Appropriate semantic role
- Meaningful accessible name
- Logical focus/tab order
- Visible keyboard focus for sighted keyboard users
- Adequate touch target
- Keyboard activation where applicable
- No focus trap

Essential instructions must not exist only as visual content or only inside an inaccessible component/iframe.

## 12. Automated Tests
Add tests covering at minimum:

1. `totally_blind` profile exists.
2. Selecting it applies recommended defaults.
3. User can override recommended defaults.
4. Setup can begin and progress without an OpenAI API key.
5. Every setup state can progress to completion.
6. Existing low-vision setup remains functional.
7. Totally blind profile defaults automatic spoken answers ON.
8. Accessibility settings can be reopened after onboarding.
9. Interrupted setup resumes correctly where supported.
10. Existing main chat/camera behavior is not regressed by onboarding changes.
11. Accessible control labels exist for critical onboarding actions.
12. Fixed onboarding audio/text fallback does not make a live OpenAI TTS call mandatory.

## 13. Manual Eyes-Free Acceptance Test
Before merge, test from a fresh first-run session with TalkBack or VoiceOver enabled and without visually reading the display.

The tester must be able to:

1. Launch Access AI.
2. Locate and activate Start spoken setup.
3. Select/accept Totally blind / no useful vision.
4. Configure interaction preference.
5. Configure device/screen reader.
6. Configure answer behavior.
7. Hear/read the profile confirmation.
8. Finish setup.
9. Reach the main application.
10. Ask a question.
11. Hear the answer automatically when configured.
12. Repeat the last answer.
13. Invoke Help / What can I do?.
14. Reopen accessibility settings.
15. Change a setting and return to the app.

If any required step cannot be completed without sight, blind-first onboarding is not complete.

## 14. Non-Goals / Prohibited Changes
Do not:

- Rewrite the entire application.
- Replace working camera/chat functionality unnecessarily.
- Add a gesture library merely to recognize custom swipes.
- Intercept TalkBack/VoiceOver navigation gestures.
- Add heavyweight dependencies without a demonstrated requirement.
- Add unnecessary recurring API costs.
- Merge directly into `main` before validation.
- Change deployment configuration unless implementation genuinely requires it.

## 15. Delivery Report Required From Implementation
When implementation is complete, report:

- Feature branch name
- Commit hashes
- Files changed
- Tests added/changed
- Exact automated test results
- Any known Streamlit/browser accessibility limitations
- Exact manual eyes-free test instructions
- Any items that still require a physical Android/iPhone accessibility test
- Confirmation that `main` was not directly modified

## Definition of Done
Blind-first onboarding is complete only when a totally blind tester can independently launch Access AI from a fresh session, configure it, reach the main application, use its primary conversational function, hear/repeat an answer, obtain contextual help, and reopen accessibility settings without requiring another person to look at the display.