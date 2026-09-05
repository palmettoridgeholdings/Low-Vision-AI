# Accessibility review

Review updated: September 5, 2026

## Scope and method

This update covers `app.py`, `onboarding.py`, the local speech component, and the onboarding and main-app flows exercised by Streamlit's offline application harness. Earlier browser observations are retained only where they still match the current code. No live API request, camera, microphone, physical screen reader, physical mobile device, or Braille display was used for this update.

The review is WCAG-informed but is not a formal conformance certification. Manual testing on the supported assistive-technology combinations remains necessary.

## Findings

### Screen-reader labels

Status: good baseline, with a framework limitation to monitor.

- Onboarding exposes semantic headings, labeled radio groups, labeled comboboxes, and named buttons.
- Main inputs are named **Camera task**, **Take a picture**, **Optional question about the picture**, **Record your question**, and **Your question**.
- Status, warning, and error messages use Streamlit semantic message containers.
- First run exposes distinct **Start spoken setup** and **Start visual guided setup** buttons.
- Spoken steps preserve readable page text and expose a **Repeat this setup instruction** button in the local browser-speech component.
- Streamlit's internal selectbox disclosure buttons may be announced only as **Open**. The associated combobox inputs do retain their specific labels. Recheck this whenever Streamlit is upgraded.

### Keyboard navigation

Status: supported by native Streamlit controls.

- Interactive elements occur in a logical document order: preferences, camera task, optional camera question, recorder, text area, and submit button.
- Native buttons, radio groups, checkboxes, comboboxes, text fields, and the expander are keyboard operable.
- A three-pixel yellow `:focus-visible` outline supplements Streamlit's theme focus treatment.
- No custom keyboard trap, drag-only action, or pointer-only application control was found.
- Streamlit's own toolbar and heading-anchor links add extra tab stops before and between app controls. This is framework behavior and should be included in manual testing.

### Contrast

Status: static styles provide a reasonable baseline; current manual verification remains required.

- The application sets primary buttons to white text on `#a61b1b` and adds a three-pixel yellow focus outline.
- These code-level color choices are not a substitute for checking every deployed theme, browser state, forced-color mode, and display configuration.
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

Status: API-free onboarding speech is implemented, with browser and device dependencies.

- The welcome screen does not autoplay. It exposes explicit spoken and visual setup routes.
- After **Start spoken setup** is activated, each later step requests browser speech synthesis and retains a **Repeat this setup instruction** control.
- The visual route preserves the same semantic form controls without requesting automatic browser speech.
- No custom directional swipe competes with TalkBack or VoiceOver navigation.
- Every spoken instruction and answer has a visible text equivalent.
- Browser-speech failure is nonfatal because the step text and controls remain available.
- AI-generated answer speech is separate from onboarding speech; its failure does not discard the text answer.
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

- Browser speech-synthesis voices, autoplay behavior, iframe focus, and the repeat control still need physical mobile and screen-reader testing.
- Streamlit controls and accessibility semantics can change on dependency upgrades, which is why the version is locked and upgrades require regression testing.
- Dynamic conversation updates should be tested for announcement timing with physical screen readers.
- Camera and model output accuracy are functional and safety risks, not just interface-accessibility risks.
- A live API test is still required to confirm the configured models and account permissions.
