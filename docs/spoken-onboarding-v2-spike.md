# Persistent spoken onboarding V2 — contained technical spike

## Decision and isolation

The persistent-controller direction is approved for a contained technical spike.
Production remains commit `1971fa0` on `main`. The prototype exists only on
`feature/persistent-spoken-onboarding-spike`, is disabled by default, and must not
be merged or deployed without explicit approval.

Enable it only in a local preview shell:

```bash
ACCESS_AI_SPOKEN_SETUP_V2_SPIKE=true python -m streamlit run app.py
```

Without that environment variable, the existing V1 onboarding path is unchanged.
No API key is needed or used by V2.

## Prototype architecture

- One Streamlit V2 component remains mounted throughout setup. A module-scope
  `WeakMap` retains its controller across Streamlit reruns.
- `onboarding_v2_manifest.json` is the versioned source for state order, visible
  instructions, spoken instructions, and contract tests.
- Python owns the setup state and issues versioned playback IDs. JavaScript owns
  playback state and rejects duplicate IDs.
- The state order is Welcome → Speech choice → Vision → Interaction → Device.
- Controls include Pause, Resume, Repeat, Stop voice, and Restore voice. Stopping
  Access AI voice does not disable or modify a screen reader.
- Diagnostics retain only named events, state names, versions, playback IDs,
  transport, and error names. Spoken text, user-agent strings, device identifiers,
  and arbitrary event fields are excluded.
- The component installs no touch, swipe, or directional-gesture handlers.
  TalkBack and VoiceOver retain their normal swipe navigation.

## Audio decision for this spike

The preferred release design is reviewed, static audio keyed to the instruction
manifest version. No reviewed recordings or offline speech-generation engine were
available in the spike environment. The prototype therefore uses the device's
built-in Web Speech synthesis with fixed, versioned manifest text. This remains
offline and requires no OpenAI key or live synthesis request, but voice availability,
pronunciation, and autoplay behavior vary by browser and device. Static recordings
should replace this transport before release; the playback-ID and state-machine
contracts can remain.

## V1 comparison

V1 is an iframe audio player recreated around Streamlit reruns and depends on
server-generated TTS audio. V2 is inline, holds one controller across setup states,
uses explicit playback IDs, and separates setup speech from all other app speech.
No camera, document, scene, Find/Inspect, voice-input, main-answer speech, or other
feature was changed for this comparison.

## Test status and limits

The regular offline suite covers both flag states, the manifest, state transitions,
speech choice, playback IDs, diagnostic redaction, deduplication structure, and the
absence of swipe interception. JavaScript syntax and Streamlit startup are separate
checks.

Verified in the spike environment: 21 offline tests passed, the one optional browser
test module was skipped because Playwright/a browser was unavailable, Python and
JavaScript syntax checks passed, `pip check` found no broken requirements, and the
flagged no-key path rendered successfully through Streamlit's application test
harness.

Optional Playwright tests start a real Streamlit server and exercise controller
continuity across browser reruns. They intentionally fake only the browser speech
engine for deterministic timing. Install Playwright separately, then run:

```bash
python -m pip install playwright
python -m playwright install chromium
python -m pytest tests/browser -q -p no:cacheprovider
```

The spike environment had no installed browser, so those optional tests were added
but not executed here. Mocked tests and desktop browser automation must not be
reported as mobile, TalkBack, or VoiceOver success.

## Anonymous public-access investigation

At 2026-08-26 20:03 UTC, clean anonymous requests to
`https://low-vision-ai.streamlit.app/` returned HTTP 303 to Streamlit's
`share.streamlit.io/-/auth/app` route. The same result occurred with curl, iPhone
Safari, and Android Chrome user-agent strings and no supplied cookies. In the same
check, `https://access-ai.tech/` returned HTTP 200.

This supports the report that a truly anonymous client is currently directed to
authentication. It does not explain the earlier discovery-browser result that
appeared public. The most likely explanations are an existing authenticated
Streamlit session, cached authorization, or a different browser execution context;
that is an inference, not proof. No sharing or deployment setting was read or
changed during this spike.

## Safe physical-device preview

Use a local network you control; do not expose the development server publicly.
Start the flagged preview on a computer, then open its LAN address from the phone.
Keep the production Streamlit URL closed during this test so results cannot be
confused.

### Android with TalkBack

1. Enable TalkBack before opening Chrome.
2. Open the flagged local preview in a new incognito tab.
3. Record whether the welcome begins, is blocked, or overlaps TalkBack.
4. Swipe right and left through every control. Confirm focus order and that no
   swipe is captured by Access AI.
5. Activate Pause, Resume, Repeat, Stop voice, and Restore voice by double-tap.
6. Choose **Use screen reader only**, continue, and confirm Access AI speech stops
   while TalkBack continues.
7. Repeat with the screen locked/unlocked, media volume muted/unmuted, Bluetooth
   connected/disconnected, and after a brief background interruption.

### iPhone with VoiceOver

1. Enable VoiceOver before opening Safari.
2. Open the flagged local preview in a new Private tab.
3. Repeat the welcome/autoplay observations above.
4. Swipe right and left through controls and use the VoiceOver double-tap. Confirm
   rotor and standard navigation remain under VoiceOver control.
5. Exercise every speech control and the screen-reader-only choice.
6. Repeat with mute state, speaker/Bluetooth routes, screen lock, and background
   interruption changes.

For each run, capture device/OS/browser versions, the manifest version shown in the
page, the named redacted diagnostic entries, expected result, actual result, and
whether recovery required a reload. Do not include spoken content, account data,
API keys, camera images, or personal identifiers in the report.

## Stop point

The spike ends with this prototype, tests, and report. The next decision is whether
to obtain reviewed static recordings and conduct supervised physical-device testing.
There is no authorization to merge, deploy, or change sharing settings.
