# Access AI Smart Glasses Proof of Concept

**Status:** Design draft; no smart-glasses integration is currently implemented.

**Contact:** founder@access-ai.tech

## Purpose

This document describes a vendor-neutral path for adding selective,
user-triggered camera assistance after the native Android foundation is ready.
It does not represent a production device, partnership, hardware commitment,
navigation system, or completed accessibility validation.

## Current product baseline

The current Streamlit proof of concept demonstrates request handling for typed or
Braille-keyboard questions, recorded audio, generated speech, and user-triggered
still-image tasks. It stores conversation content and preferences only for the
current Streamlit session.

Native Android is the primary mobile development direction. The current Android
milestone focuses on blind-first onboarding, platform accessibility semantics,
Android text-to-speech, and on-device accessibility preferences. Production AI
answers, camera capture, and voice recognition remain milestones.

Smart-glasses integration is design-only. No glasses SDK, background capture,
continuous video, obstacle avoidance, or navigation capability is implemented.

## Proposed architecture

Use a thin glasses client paired with the user's phone or a controlled backend:

1. The user explicitly initiates one still-frame capture.
2. The device confirms capture and processing with an audible or tactile signal.
3. A phone or backend relay resizes and submits the bounded request.
4. The relay owns provider credentials, permission handling, request IDs,
   timeouts, cancellation, and limited retries.
5. The result returns as concise speech, captions, or phone text with explicit
   uncertainty.
6. The capture is not retained by Access AI by default.

Vendor SDK types should remain inside a replaceable edge adapter. Normalized
request, response, and capability data should stay independent of any hardware
vendor.

## Low-cost and privacy design

- Use selective still frames rather than continuous video.
- Resize images to the smallest resolution that still supports the requested
  task; reserve high-detail processing for reading or close inspection.
- Keep answers short by default and let the user request more detail.
- Prefer on-device phone speech when its quality and privacy are suitable.
- Do not place a long-lived OpenAI or other provider key on glasses or in a
  mobile APK.
- Do not create a persistent capture archive by default.
- Exclude image and audio contents from ordinary usage telemetry.
- Require explicit capture consent and an obvious recording indicator.

## Accessibility and safety boundaries

- Every glasses action should have a phone and screen-reader equivalent.
- Provide a discoverable stop or cancel action and an audible confirmation.
- Announce capture, processing, result, failure, and connectivity loss without
  relying on a visual display.
- Preserve explicit uncertainty for text, medication, hazards, controls,
  traffic, and navigation-related questions.
- Never present a single-camera result as obstacle avoidance or proof that an
  area is safe.
- Do not silently share captures or location with a caregiver or other person.

## Proposed implementation gates

1. Validate native Android onboarding, preferences, and accessibility on
   physical devices.
2. Extract provider-independent request and response contracts without changing
   the working Streamlit flow.
3. Test a local fake-device adapter with text and fixture images.
4. Add an authenticated phone or backend relay with cancellation, timeouts, and
   deduplication.
5. Evaluate one hardware adapter behind a feature flag.
6. Conduct privacy, safety, accessibility, and usability testing before broader
   availability.

## Out of scope for the current milestone

- A vendor-specific SDK or hardware commitment.
- Background or continuous camera streaming.
- Navigation, obstacle avoidance, or safety certification.
- Production cloud infrastructure for glasses.
- Persistent storage of captures, transcripts, or precise location.
