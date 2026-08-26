# Accessibility review

Review date: August 26, 2026

## Scope and method

The review covered `app.py`, the complete onboarding and main-app flows in Streamlit's offline application harness, a live local Streamlit render, the browser accessibility tree, rendered styles, and no-hardware behavior. No API key, live API request, camera, microphone, physical screen reader, or Braille display was used.

The review is WCAG-informed but is not a formal conformance certification. Manual testing on the supported assistive-technology combinations remains necessary.

## Findings

### Screen-reader labels

Status: good baseline, with a framework limitation to monitor.

- Onboarding exposes semantic headings, labeled radio groups, labeled comboboxes, and named buttons.
- Main inputs are named **Camera task**, **Take a picture**, **Optional question about the picture**, **Record your question**, and **Your question**.
- Status, warning, and error messages use Streamlit semantic message containers.
- Generated audio is preceded by visible text explaining that it is AI-generated and how to start playback manually.
- Streamlit's internal selectbox disclosure buttons may be announced only as **Open**. The associated combobox inputs do retain their specific labels. Recheck this whenever Streamlit is upgraded.

### Keyboard navigation

Status: supported by native Streamlit controls.

- Interactive elements occur in a logical document order: preferences, camera task, optional camera question, recorder, text area, and submit button.
- Native buttons, radio groups, checkboxes, comboboxes, text fields, and the expander are keyboard operable.
- A three-pixel yellow `:focus-visible` outline supplements Streamlit's theme focus treatment.
- No custom keyboard trap, drag-only action, or pointer-only application control was found.
- Streamlit's own toolbar and heading-anchor links add extra tab stops before and between app controls. This is framework behavior and should be included in manual testing.

### Contrast

Status: passes for the inspected primary surfaces.

- In the tested dark theme, body text measured approximately 18.1:1 against the page background.
- The application overrides primary buttons to white text on `#a61b1b`, approximately 7.5:1.
- The yellow focus outline is visually distinct on the tested dark background.
- Because users can select other Streamlit/browser themes and extensions, retest contrast in every supported deployed theme.

### Large text and reflow

Status: improved; manual zoom testing remains.

- Buttons have a 68-pixel minimum height and 18.88-pixel bold text.
- Low-vision profiles and the **Large text** interaction preference increase body, label, field, conversation, and heading sizes.
- The content column has a maximum width but no fixed page width, supporting ordinary browser reflow.
- Manually verify browser zoom at 200% and 400% on narrow mobile and desktop viewports before a production accessibility claim.

### Understandable errors

Status: improved.

- Missing configuration is explained as an unavailable capability with a next action rather than a raw exception.
- Speech failure does not discard a successful text or camera answer.
- Empty text submission receives a specific instruction.
- Provider details, stack traces, and credentials are not rendered to users.
- Network, account access, quota, and model-access failures share a safe general message; operational logs may need a future redacted diagnostic identifier.

### Voice-first operation

Status: materially improved, with browser and service dependencies.

- Setup speech is requested with an explicit **Hear this step** action. This avoids making a paid request on each rerun and gives autoplay a user gesture.
- Every spoken instruction and answer has a visible text equivalent.
- If autoplay is still blocked, the audio player's Play control is announced in nearby instructions.
- Speech-generation failure is nonfatal, and text-only operation remains available.
- Voice recording is disabled with a clear explanation when API access is unavailable.
- Voice-first operation still depends on browser audio support, microphone permission for input, network connectivity, and API access.

### Camera and non-hardware behavior

Status: graceful.

- Camera absence or denied permission does not stop the application.
- The page directs users to the text input as a fallback.
- No analysis request appears until an image exists.
- Read, describe, and find/inspect modes remain separate and retain uncertainty and safety language.

## Manual assistive-technology matrix

Before production use, test at least:

| Platform | Assistive technology | Required checks |
| --- | --- | --- |
| Android | TalkBack + Chrome | onboarding, swipe order, audio Play, recording, camera permission denial |
| iPhone | VoiceOver + Safari | rotor headings, form labels, audio playback, recording, camera capture |
| Windows | NVDA + Firefox/Chrome | browse/forms modes, combobox labels, focus visibility, error announcements |
| Windows | JAWS + Chrome/Edge | radio groups, expander, conversation updates, audio controls |
| macOS | VoiceOver + Safari | keyboard navigation, heading links, permissions, 200% zoom |
| Desktop/mobile | Keyboard only | complete setup and text question without pointer or hardware |
| Desktop/mobile | 200% and 400% zoom | reflow, clipping, control overlap, conversation readability |
| Braille | Supported screen reader + display | labels, status/error messages, text submission, conversation order |

## Remaining risks

- Browser autoplay behavior varies and cannot be guaranteed; manual Play remains the reliable fallback.
- Streamlit controls and accessibility semantics can change on dependency upgrades, which is why the version is locked and upgrades require regression testing.
- Dynamic conversation updates should be tested for announcement timing with physical screen readers.
- Camera and model output accuracy are functional and safety risks, not just interface-accessibility risks.
- A live API test is still required to confirm the configured models and account permissions.

