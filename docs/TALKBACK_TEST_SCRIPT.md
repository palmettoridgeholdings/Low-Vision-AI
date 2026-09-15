# Physical TalkBack Test Script — Access AI Android MVP

Manual acceptance test for the blind-first accessibility pass in
`mobile/`. This supersedes `docs/BLIND_FIRST_ONBOARDING_SPEC.md` section
13's shorter list for the native app (that section predates this pass and
was written for the Streamlit prototype) — run this version for `mobile/`.

**This has not been run on a physical device yet.** Everything below was
implemented and reasoned through against Android/TalkBack's documented
behavior and the app's own automated tests, but only an actual device pass
can confirm it — automated tests cannot prove real touch exploration (see
"What automated tests cannot cover" at the end). Treat every step as an
open item until someone checks it off on real hardware.

## Setup

1. Install the app on a physical Android phone (Expo Go, or a built APK —
   see `mobile/README.md`).
2. Settings → Accessibility → TalkBack → on.

   TalkBack may announce font sizes, colors, text formatting, and image or
   container details depending on its Verbosity settings. For a cleaner
   Access AI voice-first experience, users may optionally disable **TalkBack
   → Settings → Verbosity → Speak text formatting**. These announcements are
   optional Android/TalkBack behavior, not an Access AI defect.

3. **Turn the screen off, or otherwise commit to not looking at it, for the
   whole test** (Parts 0–7). If a step cannot be completed this way, that
   step fails — note exactly where and how (which control couldn't be
   found, which announcement was missing or wrong, etc.).
4. Uninstall and reinstall (or clear app storage) first, so onboarding
   starts fresh — a previously-completed onboarding will skip straight to
   Home.

## Part 0 — Explore by Touch fundamentals (run once, then expect it everywhere)

These are the base mechanics every later part assumes. If any of these
fail on the Welcome screen, stop and fix it before continuing — every
other part will fail the same way.

0a. Launch the app, then **drag one finger slowly around the entire
    screen** without lifting it. **Expect:** as your finger passes over
    each control, TalkBack speaks that control's name (and role — button,
    radio button, switch, heading, alert, etc.) — you should be able to
    find and identify every control on screen this way, with no need to
    already know where it is.
0b. Lift your finger after hearing a control you want, then **double-tap
    anywhere on the screen** (not necessarily on the control itself).
    **Expect:** the last control your finger heard is activated —
    identical to a direct double-tap on the control.
0c. **Swipe right** repeatedly from the top of the screen. **Expect:** focus
    moves through every interactive control in a single, logical order —
    heading/instructions first, then each control in the order it's drawn
    — and swiping **left** moves backward through the same sequence.
0d. While dragging or swiping, **listen for anything that gets focus but
    says nothing useful, or says something twice.** **Expect:** decorative
    glyphs/emoji next to a button's label are never announced separately
    from the label; layout containers are silently skipped; the live
    camera preview (Camera screen) is never reachable at all. Note any
    such "dead stop" or duplicate announcement as a failure, with the
    screen and control name.
0e. Confirm **no gesture beyond standard TalkBack ones is ever needed** —
    nothing in the app requires a custom swipe, drag, long-press, or
    double-tap pattern; if double-tap-anywhere-to-activate ever stops
    working, that's a failure, not a sign a different gesture is expected.

## Part 1 — First launch and the Welcome screen

1. Launch the app. **Expect:** speech starts automatically, unprompted —
   no swipe or tap should be required to hear it. With TalkBack on, it
   leads with the drag/swipe/lift/double-tap mechanics from Part 0, then
   explains that setup needs no sight and describes "Use recommended blind
   settings" and "Start spoken setup".
2. Swipe right repeatedly through the screen's controls. **Expect:** the
   heading/introduction is reached first, then controls in exactly this
   order: "Use recommended blind settings", "Start spoken setup", "Start
   visual guided setup", "Repeat this introduction", "Stop speech", "Open
   Android accessibility settings" — with no other item ahead of or
   between them.
3. Double-tap "Repeat this introduction". **Expect:** the introduction
   plays again from the start, replacing (not layering on top of) any
   speech still in progress.
4. While it's speaking, double-tap "Stop speech". **Expect:** speech stops
   immediately; every control is still reachable and activatable.
5. Turn TalkBack **off** (Settings → Accessibility → TalkBack → off), then
   relaunch the app — briefly looking at the screen is fine for this one
   step only, to confirm TalkBack is really off. **Expect:** device TTS
   (not TalkBack) now reads a different introduction: it states TalkBack
   is off, that Access AI cannot turn on Android accessibility services
   automatically, mentions — without claiming it's set up on this specific
   device — that holding both volume buttons for about three seconds may
   activate a configured accessibility shortcut, and names "Open Android
   accessibility settings" and "Repeat instructions" as available controls.
6. Double-tap "Open Android accessibility settings" (reachable via touch
   exploration even with TalkBack off — standard Android touch still
   works). **Expect:** the system Accessibility settings screen opens.
   Turn TalkBack back on there, then return to Access AI (Back/Recents).
   **Expect:** the app announces the return and behaves as if TalkBack was
   on all along (Part 0 mechanics work immediately, no relaunch needed).

## Part 2 — The one-tap shortcut

7. Double-tap "Use recommended blind settings". **Expect:** you land
   directly on the Confirmation screen, which speaks a summary naming
   totally-blind use, voice-first interaction, Android/TalkBack, automatic
   spoken answers on, and short/direct responses.
8. Double-tap "Review settings". **Expect:** you're taken to the Vision
   step with "Totally blind / no useful vision" already selected — confirm
   every later step (Interaction, Device, Answer behavior) also already
   holds the shortcut's values, and that changing any one of them is
   possible (this profile is a starting point, not locked).

## Part 3 — The step-by-step spoken path, with the screen covered throughout

Restart onboarding (Settings → "Restart setup from the beginning" once you
can reach Home, or reinstall) and this time use "Start spoken setup" —
complete this entire part without looking at the screen.

9. On each step (Vision, Interaction, Device, Answer behavior): confirm the
   step's prompt is spoken automatically, "Repeat this instruction" repeats
   it on demand, "Stop speech" silences it, and dragging a finger across
   the screen reveals every option plus Back/Continue (Part 0 mechanics).
10. Double-tap "Continue" **without** selecting an option first. **Expect:**
    Continue does not silently do nothing — a validation message is spoken
    and appears on screen (e.g. "Please choose a vision option before
    continuing."), TalkBack focus lands on that message, and the option
    list is still fully reachable.
11. Select an option. **Expect:** you hear "<option> selected." immediately
    (not just the visual highlight changing).
12. Double-tap Continue again. **Expect:** it now advances to the next
    step, and TalkBack focus lands on that step's own heading — not
    wherever focus happened to be on the previous screen.
13. On Answer behavior, toggle "Automatically speak answers". **Expect:**
    you hear "Automatically speak answers, on." or "...off." after toggling.
14. Reach Confirmation and double-tap "Finish setup". **Expect:** you land
    on Home.

## Part 4 — Home screen and returning launches

15. On first reaching Home after finishing setup, and again after fully
    closing and relaunching the app. **Expect:** a short spoken orientation
    plays automatically each time the app is launched fresh (not on every
    screen focus), naming Ask by voice, Camera assistance, Type a question,
    Repeat last answer, Help, and Settings.
16. In Settings, turn off "Speak a welcome message on launch", relaunch the
    app. **Expect:** the orientation message no longer plays.

## Part 5 — Ask by voice, with the screen covered throughout

17. Open "Ask by voice" for the first time (fresh permission). **Expect:**
    before the OS microphone permission dialog appears, TalkBack announces
    why the app needs microphone access. Grant the permission.
18. Back on the Voice screen. **Expect:** "Microphone ready. Activate Start
    recording..." plays once, automatically, and dragging a finger across
    the screen reveals Repeat/Stop-speech and Start recording with no dead
    stops.
19. Double-tap "Start recording". **Expect:** an announcement confirms
    recording started and explains how to stop or cancel; TalkBack focus
    moves onto the now-visible Stop/Cancel controls; no continuous
    narration talks over your spoken question while actively recording.
20. Double-tap "Cancel recording". **Expect:** "Recording cancelled," you
    return to the idle state, focus lands back on "Start recording", and
    nothing is submitted.
21. Start recording again, ask a question aloud, double-tap "Stop and ask".
    **Expect:** you hear that recording stopped and processing has begun
    (focus moves to the processing indicator), then "You asked: <your
    question>." once transcription completes, then the answer (if
    "Automatically speak answers" is on), with focus landing on the result.
22. Double-tap "Repeat last spoken message". **Expect:** whichever of the
    above announcements played most recently repeats.
23. Deny the microphone permission (Settings → Apps → Access AI →
    Permissions → Microphone → Deny), reopen the Voice screen. **Expect:**
    the denial is announced, TalkBack focus lands on that announcement,
    and "Open device settings" and "Try again" are both reachable by touch
    exploration and operate correctly.

## Part 6 — Camera assistance, with the screen covered throughout

24. Open "Camera assistance" for the first time (fresh permission).
    **Expect:** the permission context is announced before the OS camera
    dialog appears. Grant the permission.
25. Back on the Camera screen. **Expect:** a "Camera ready" announcement
    names the current mode, explains how to change it, and gives nonvisual
    positioning guidance (centered, roughly arm's length).
26. Drag a finger across the whole screen. **Expect:** every control (mode
    options, the optional question field, Take photo, Repeat/Stop-speech)
    is announced; the live camera preview area is never reached or
    described — TalkBack must skip over it as though it isn't there.
27. Change the mode via the mode option. **Expect:** you hear "<mode>
    selected."
28. Double-tap "Take photo". **Expect:** you hear an announcement that a
    photo is being taken, then that it's being analyzed (focus following
    each), then the result together with its safety disclaimer — every
    time, regardless of the "Automatically speak answers" setting — with
    focus landing on the result panel.
29. Point the camera at nothing meaningful to force an error path if
    possible, or otherwise trigger the error state. **Expect:** the error
    is announced together with how to retry, focus lands on the error, and
    "Try again" works.

## Part 7 — Help and Settings, with the screen covered throughout

30. From Home, open "Help". **Expect:** its content is reachable by TalkBack
    and describes the app's primary actions, immediately followed by a
    "Using TalkBack" section covering drag-to-explore, swipe navigation,
    double-tap-anywhere activation, and stating plainly that Access AI
    cannot turn TalkBack on automatically. Confirm "Open Android
    accessibility settings" is reachable here too and behaves the same as
    on Welcome.
31. Open Settings, reach "Change accessibility setup" and "Restart setup
    from the beginning". **Expect:** both are reachable, labeled, and do
    what they say; the accessibility-setup summary text (Vision,
    Interaction, Device, Answer style) is readable by TalkBack.

## What automated tests cannot cover

The automated suite (`npm test`) exercises the logic behind every item
above — screen-reader detection and its "unknown" default, TalkBack vs.
device-TTS channel selection with no duplication, accessible
labels/roles/hints/states, the camera preview and decorative glyphs being
excluded from the accessibility tree, predictable focus-move calls, and
the Settings-return/recheck flow — using mocked TalkBack state and a mocked
focus API. It cannot prove that:

- dragging a finger on a real device actually reads every control aloud
  (Part 0a, and its instances throughout Parts 1–7),
- double-tapping anywhere on the screen actually activates the last-heard
  control on a real device (Part 0b),
- accessibility focus genuinely lands where each screen intends on actual
  Android/TalkBack, rather than merely calling the focus API the way the
  tests assert,
- the volume-button accessibility shortcut behaves as described on any
  given device (it explicitly isn't promised to be configured everywhere),
  or
- real-world timing (native TTS engine latency, TalkBack's own speech
  queue) avoids the audible overlap the code is designed to prevent.

Only this manual script, actually run on hardware, can confirm those.

## Reporting results

For each step above, record: pass / fail / not tested, the device and
Android/TalkBack version used, and — for any failure — exactly what was
expected vs. what happened. File results alongside this script or in the
PR description; do not merge a claim of "TalkBack verified" without this
having actually been run.
