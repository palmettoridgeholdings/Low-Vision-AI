# Future smart-glasses interface design

Status: design only. Do not treat this document as implemented functionality.

## Goal

Add smart-glasses clients later without coupling the current Streamlit prototype, accessibility logic, or OpenAI calls to one hardware vendor. The lowest-cost approach is a thin glasses client paired with the user's phone or a small local relay. The relay reuses the same request/response behavior as the web app while the glasses handle capture and concise output.

## Proposed boundaries

```text
Glasses or phone controls
        |
        v
Input adapter ---> normalized assistive request
                         |
                         v
                 Access AI service layer
                 - prompt/profile assembly
                 - text and vision request
                 - transcription and speech
                 - safety/error mapping
                         |
                         v
Output adapter --> speech, captions, haptics, or phone UI
```

The current prototype remains the Streamlit adapter. A future refactor would extract provider-independent service functions only when a second client is being built; it should not rewrite the working UI in advance.

## Minimal contracts

Use small Python protocols or equivalent typed interfaces:

- `InputAdapter.capture() -> AssistiveRequest`
- `OutputAdapter.present(AssistiveResponse) -> None`
- `DeviceAdapter.capabilities() -> DeviceCapabilities`
- `DeviceAdapter.cancel_current_output() -> None`

Suggested normalized data:

- `AssistiveRequest`: request ID, kind (`text`, `audio`, or `image`), user text, optional bytes, camera mode, locale, accessibility profile, and timestamp.
- `AssistiveResponse`: request ID, answer text, optional speech bytes/reference, uncertainty notices, safety notices, and recoverable error information.
- `DeviceCapabilities`: camera, microphone, speaker, display, haptics, maximum image size, supported audio formats, and connectivity state.

Keep vendor types out of these objects. A vendor-specific SDK adapter should translate only at the edge.

## Transport

Start with a local phone relay over authenticated HTTPS or WebSocket. The phone is better suited to credentials, network access, retries, and permission UI. The glasses should send compressed capture data and receive concise text/audio results.

Do not place a long-lived OpenAI API key on the glasses. The relay or a controlled backend owns provider credentials. Use short-lived device sessions, request IDs for deduplication, bounded retries, and explicit cancellation.

## Cost controls

- Reuse the current text, transcription, TTS, and image-analysis calls rather than adding a second AI stack.
- Resize images to the smallest resolution that still supports the requested task; request high detail only for reading or inspection that needs it.
- Require an explicit capture action and avoid continuous video upload in the first version.
- Keep responses short by default on glasses and let the user request more detail.
- Cache only nonsensitive generated speech within a short session and never persist captures by default.
- Add per-device rate limits, request timeouts, and usage telemetry that excludes image/audio contents.
- Prefer phone speech synthesis as an optional zero-API-cost output adapter when its quality and privacy meet the user's needs.

## Accessibility and safety requirements

- Every glasses action must have a phone/screen-reader equivalent.
- Support a single, discoverable cancel/stop gesture and an audible confirmation.
- Announce capture start, processing, result, failure, and connectivity loss without relying on a visual display.
- Preserve the current uncertainty rules for text, medication, hazards, controls, traffic, and navigation.
- Never market a single-camera response as obstacle avoidance or safe navigation.
- Use explicit consent for capture, an obvious recording indicator, and minimal retention.
- Provide a caregiver or support handoff without silently sharing captures or location.

## Incremental implementation plan

1. Add unit-tested `AssistiveRequest`, `AssistiveResponse`, and capability types without changing Streamlit behavior.
2. Extract the existing API calls behind a service object and keep Streamlit as the only adapter.
3. Build a local command-line fake device adapter for text and fixture images.
4. Add the authenticated phone relay and test cancellation, reconnects, timeouts, and duplicate requests.
5. Implement one vendor adapter using its then-current official SDK and a feature flag.
6. Run usability and safety testing with blind and low-vision participants before broad deployment.

## Explicitly out of scope now

- Vendor-specific SDK dependencies or accounts.
- Background/continuous camera streaming.
- Navigation, obstacle avoidance, or safety certification.
- New cloud infrastructure.
- Storage of user captures, transcripts, or precise location.
