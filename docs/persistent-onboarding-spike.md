# Persistent spoken-onboarding technical spike

Status: feature-branch prototype only. It is disabled by default, is not deployed, and has not been validated on a physical mobile device.

Production baseline: `1971fa0`

Prototype branch: `codex/persistent-spoken-onboarding-spike`

## Scope and isolation

Set `ACCESS_AI_PERSISTENT_SPEECH_SPIKE=1` to replace only the first-run setup with the prototype. With the flag absent or false, `app.py` follows the production onboarding path. After prototype setup completes, the existing main application renders without changes.

The spike does not modify camera assistance, document reading, scene description, Find/Inspect, voice input, text/Braille input, main-answer speech, provider configuration, or deployment settings.

## Prototype architecture

- One Streamlit V2 component is mounted with the stable key `persistent_spoken_setup_controller_v1` throughout setup.
- The component owns one `<audio>` element and the Pause/Resume, Repeat, Stop voice, restore voice, status, and blocked-autoplay controls.
- Native Streamlit controls retain the setup form and normal browser, TalkBack, and VoiceOver navigation.
- No touch, swipe, or directional-gesture handler is registered.
- A versioned JSON manifest supplies the visible transcript, speech script, static audio filename, and test expectations.
- Offline Windows SAPI generated the committed WAV files. Runtime playback needs no API key or synthesis request.
- Server command and playback IDs are monotonic. Repeated reruns keep the same command ID; the component ignores that duplicate command.
- Player diagnostics use a bounded V2 state buffer so rapid events are not lost. They retain only named events and bounded identifiers; messages, stacks, audio, and provider details are discarded.

The existing V1 component is retained unchanged as the production comparison. V1 sends each player event to Python, triggers a full rerun, and then requests a new script-initiated playback from an iframe. V2 removes the iframe boundary and keeps one controller element mounted, but physical Android and iPhone testing is still required to establish whether this materially improves mobile playback.

## Desktop browser-spike evidence

A local Chromium browser run with the flag enabled verified the actual V2 DOM and media path, beyond Streamlit's mocked component tests:

- The controller rendered in the page with zero iframes and one audio element.
- Blocked autoplay exposed the full-screen fallback and placed focus on its exact accessible name inside the component's shadow root.
- Activating the fallback by pointer started the static welcome audio; its matching completion event advanced to the guidance choice and started that step without another button press.
- Pause, Resume, Repeat instruction, Stop voice, and restore voice changed the same persistent controller as expected.
- Rapid diagnostics remained available as named, redacted records without audio payloads, messages, or stack traces.
- The visible transcript, setup step heading, and control names remained present throughout the journey.

The browser harness delivered Enter to the focused fallback and recorded the `unlock_keyboard` attempt, but its automated input did not receive a media-policy user-activation grant. That is not evidence of a product failure or success on a physical keyboard. Enter and Space remain explicit physical-device acceptance tests. No mobile-success claim is made from this desktop run.

## Safe local preview

Use a new PowerShell window in the repository and do not configure an API key for this preview:

```powershell
git switch codex/persistent-spoken-onboarding-spike
$env:ACCESS_AI_PERSISTENT_SPEECH_SPIKE = "1"
python -m streamlit run app.py --server.address 0.0.0.0 --server.port 8501
```

Desktop preview: open `http://127.0.0.1:8501`.

Physical-device preview on the same trusted Wi-Fi network:

1. Find the development computer's private IPv4 address with `ipconfig`.
2. On the phone, open `http://PRIVATE-IP:8501`, replacing `PRIVATE-IP` with that address.
3. If Windows asks, allow Python only on the trusted private network.
4. Do not test camera or microphone through this HTTP preview; those features normally require HTTPS and are outside this spike.
5. Stop Streamlit with Ctrl+C when finished.
6. Clear the feature flag in that shell with:

```powershell
Remove-Item Env:ACCESS_AI_PERSISTENT_SPEECH_SPIKE
```

Never expose the preview server to the public internet. No OpenAI key is needed.

## Physical TalkBack and VoiceOver script

Run each case in a fresh private tab and again in a normal returning tab:

1. Confirm the welcome attempts once.
2. If blocked, confirm the full-screen control receives focus and announces its complete name.
3. Activate it once by touch. Repeat with Enter and Space on a Bluetooth keyboard.
4. Confirm the welcome completes and the setup-guidance choice appears.
5. Keep Access AI speech enabled and complete every step. Record any silent step, repeated step, overlap, focus loss, or unexpected restart.
6. Repeat setup using screen-reader-only operation.
7. Exercise Pause, Resume, Repeat instruction, Stop voice, and Turn on Access AI speech at every step.
8. Navigate only with standard TalkBack or VoiceOver gestures. Confirm the app does not consume one-finger directional swipes.
9. Test 200% and 400% text sizing, portrait and landscape, speaker and Bluetooth audio, and background/foreground interruption.
10. Do not label the spike mobile-successful until both physical-device journeys pass.

## Anonymous public-access evidence

Observed August 26, 2026:

- An unauthenticated `HEAD https://access-ai.tech/` request returned `200 OK`.
- Its **Try Access AI** link targets `https://low-vision-ai.streamlit.app` in a new tab.
- An unauthenticated request to the Streamlit URL returned `303 See Other` with a location under `https://share.streamlit.io/-/auth/app`.
- Following redirects anonymously entered a repeated authentication/login redirect chain rather than reaching the app.
- The discovery browser did reach and operate the app. That browser context therefore had access not present in the cookie-free request, such as an existing Streamlit authorization session. Browser cookies were intentionally not inspected.

Conclusion: the landing page is public, but anonymous public access to the Streamlit app is not currently demonstrated and the cookie-free evidence indicates authentication is required. No sharing or deployment setting was changed during this investigation.

## Known limitations

- Desktop browser behavior cannot establish Android/TalkBack or iPhone/VoiceOver success.
- Automated keyboard events may not receive the same browser media-policy activation as physical input.
- The spike uses a persistent HTML media element, not a native mobile audio session.
- Browser backgrounding, audio-focus changes, and operating-system interruptions can still suspend playback.
- Static WAV assets add approximately 3.5 MB to the branch and use one prototype voice.
- Completion and speech mode remain Streamlit-session state during this contained spike; durable returning-user storage is deferred.
- Diagnostics are held only in current Streamlit session state and are not uploaded or persisted.
