# Access AI Accessibility Statement

**Updated:** September 5, 2026

Accessibility is the core purpose of Access AI. The project is being designed for blind and low-vision users first, with support for screen readers, spoken interaction, Braille-compatible text entry, large controls, high contrast, and nonvisual descriptions.

## Current status

Access AI is under active development.

The current public Streamlit application is a proof of concept used to demonstrate text, voice, camera, and accessibility concepts. A native Android application is now the primary mobile development direction so accessibility behavior can be implemented and tested in the environment where the finished product is intended to be used.

## Accessibility goals

Access AI is being developed toward these goals:

- complete onboarding without sighted assistance;
- compatibility with Android TalkBack and standard screen-reader gestures;
- clear, descriptive control labels and logical focus order;
- spoken setup and spoken answers when enabled;
- text input compatible with software keyboards and Braille input services;
- large touch targets and readable high-contrast presentation;
- no essential task that depends only on color, imagery, drag gestures, or custom swipe gestures;
- nonvisual spatial descriptions using relative position, clock-face references, landmarks, and explicit uncertainty when appropriate.

## Testing

Automated accessibility checks are useful but are not treated as proof of real-world usability.

The repository uses code review and automated tests. Physical-device and assistive-technology checks are still required; the native Android release process is intended to include testing with TalkBack before accessibility-sensitive milestones are considered complete.

The Streamlit proof of concept has known browser and framework limitations. Its behavior should not be interpreted as the final accessibility behavior of the native Android product.

## Known limitations

Access AI remains a developing product. Current limitations may include:

- browser-dependent speech and focus behavior in the public Streamlit proof of concept;
- differences among screen readers, Android devices, TTS engines, browsers, and Braille input services;
- AI output that can be incomplete or inaccurate;
- features that require network, camera, microphone, or third-party AI availability;
- native Android camera, production voice recognition, and smart-glasses functions that are still being developed or validated.

## Feedback

We welcome accessibility feedback, including reports about screen-reader labels, focus order, speech behavior, keyboard or Braille input, contrast, text scaling, and mobile usability.

Contact:

**founder@access-ai.tech**

When reporting a problem, include the device, operating system, screen reader or assistive technology, and the action you were trying to complete when possible.

## Commitment

Access AI will not claim formal accessibility conformance solely on the basis of automated testing. Accessibility claims will be kept proportional to the testing actually completed, and significant known limitations will be documented rather than hidden.
