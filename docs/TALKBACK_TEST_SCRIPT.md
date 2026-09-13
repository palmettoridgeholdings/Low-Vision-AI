# Physical TalkBack Test Script — Access AI Android MVP

Manual acceptance test for the blind-first accessibility pass in
`mobile/`. This supersedes `docs/BLIND_FIRST_ONBOARDING_SPEC.md` section
13's shorter list for the native app (that section predates this pass and
was written for the Streamlit prototype) — run this version for `mobile/`.

**This has not been run on a physical device yet.** Everything below was
implemented and reasoned through against Android/TalkBack's documented
behavior and the app's own automated tests, but only an actual device pass
can confirm it. Treat every step as an open item until someone checks it
off on real hardware.

## Setup

1. Install the app on a physical Android phone (Expo Go, or a built APK —
   see `mobile/README.md`).
2. Settings → Accessibility → TalkBack → on.
3. Turn the screen off, or otherwise commit to not looking at it, for the
   whole test. If a step cannot be completed this way, that step fails —
   note exactly where and how (which control couldn't be found, which
   announcement was missing or wrong, etc.).
4. Uninstall and reinstall (or clear app storage) first, so onboarding
   starts fresh — a previously-completed onboarding will skip straight to
   Home.

## Part 1 — First launch and the Welcome screen

1. Launch the app. **Expect:** speech starts automatically, unprompted —
   no swipe or tap should be required to hear it. It explains that setup
   needs no sight, that TalkBack's own swipe-to-move / double-tap-to-activate
   gestures are what to use, and describes both "Use recommended blind
   settings" and "Start spoken setup".
2. Swipe right repeatedly through the screen's controls. **Expect:** the
   first item reached is "Use recommended blind settings", before "Start
   spoken setup", "Start visual guided setup", "Repeat this introduction",
   and "Stop speech" — in that order, with no other item ahead of them.
3. Double-tap "Repeat this introduction". **Expect:** the introduction
   plays again from the start, replacing (not layering on top of) any
   speech still in progress.
4. While it's speaking, double-tap "Stop speech". **Expect:** speech stops
   immediately; every control is still reachable and activatable.

## Part 2 — The one-tap shortcut

5. Double-tap "Use recommended blind settings". **Expect:** you land
   directly on the Confirmation screen, which speaks a summary naming
   totally-blind use, voice-first interaction, Android/TalkBack, automatic
   spoken answers on, and short/direct responses.
6. Double-tap "Review settings". **Expect:** you're taken to the Vision
   step with "Totally blind / no useful vision" already selected — confirm
   every later step (Interaction, Device, Answer behavior) also already
   holds the shortcut's values, and that changing any one of them is
   possible (this profile is a starting point, not locked).

## Part 3 — The step-by-step spoken path

Restart onboarding (Settings → "Restart setup from the beginning" once you
can reach Home, or reinstall) and this time use "Start spoken setup".

7. On each step (Vision, Interaction, Device, Answer behavior): confirm the
   step's prompt is spoken automatically, "Repeat this instruction" repeats
   it on demand, and "Stop speech" silences it.
8. Double-tap "Continue" **without** selecting an option first. **Expect:**
   Continue does not silently do nothing — a validation message is spoken
   and appears on screen (e.g. "Please choose a vision option before
   continuing."), and the option list is still fully reachable.
9. Select an option. **Expect:** you hear "<option> selected." immediately
   (not just the visual highlight changing).
10. Double-tap Continue again. **Expect:** it now advances to the next
    step.
11. On Answer behavior, toggle "Automatically speak answers". **Expect:**
    you hear "Automatically speak answers, on." or "...off." after toggling.
12. Reach Confirmation and double-tap "Finish setup". **Expect:** you land
    on Home.

## Part 4 — Home screen and returning launches

13. On first reaching Home after finishing setup, and again after fully
    closing and relaunching the app. **Expect:** a short spoken orientation
    plays automatically each time the app is launched fresh (not on every
    screen focus), naming Ask by voice, Camera assistance, Type a question,
    Repeat last answer, Help, and Settings.
14. In Settings, turn off "Speak a welcome message on launch", relaunch the
    app. **Expect:** the orientation message no longer plays.

## Part 5 — Ask by voice

15. Open "Ask by voice" for the first time (fresh permission). **Expect:**
    before the OS microphone permission dialog appears, TalkBack announces
    why the app needs microphone access. Grant the permission.
16. Back on the Voice screen. **Expect:** "Microphone ready. Activate Start
    recording..." plays once, automatically.
17. Double-tap "Start recording". **Expect:** an announcement confirms
    recording started and explains how to stop or cancel; no continuous
    narration talks over your spoken question while actively recording.
18. Double-tap "Cancel recording". **Expect:** "Recording cancelled," you
    return to the idle state, and nothing is submitted.
19. Start recording again, ask a question aloud, double-tap "Stop and ask".
    **Expect:** you hear that recording stopped and processing has begun,
    then "You asked: <your question>." once transcription completes, then
    the answer (if "Automatically speak answers" is on).
20. Double-tap "Repeat last spoken message". **Expect:** whichever of the
    above announcements played most recently repeats.
21. Deny the microphone permission (Settings → Apps → Access AI →
    Permissions → Microphone → Deny), reopen the Voice screen. **Expect:**
    the denial is announced, "Open device settings" and "Try again" are
    both reachable and operate correctly.

## Part 6 — Camera assistance

22. Open "Camera assistance" for the first time (fresh permission).
    **Expect:** the permission context is announced before the OS camera
    dialog appears. Grant the permission.
23. Back on the Camera screen. **Expect:** a "Camera ready" announcement
    names the current mode, explains how to change it, and gives nonvisual
    positioning guidance (centered, roughly arm's length).
24. Swipe onto the live camera preview. **Expect:** TalkBack skips over it
    entirely — it must not receive focus or read out any description of
    the video feed.
25. Change the mode via the mode option. **Expect:** you hear "<mode>
    selected."
26. Double-tap "Take photo". **Expect:** you hear an announcement that a
    photo is being taken, then that it's being analyzed, then the result
    together with its safety disclaimer — every time, regardless of the
    "Automatically speak answers" setting.
27. Point the camera at nothing meaningful to force an error path if
    possible, or otherwise trigger the error state. **Expect:** the error
    is announced together with how to retry, and "Try again" works.

## Part 7 — Help and Settings

28. From Home, open "Help". **Expect:** its content is reachable by TalkBack
    and describes the app's primary actions.
29. Open Settings, reach "Change accessibility setup" and "Restart setup
    from the beginning". **Expect:** both are reachable, labeled, and do
    what they say; the accessibility-setup summary text (Vision,
    Interaction, Device, Answer style) is readable by TalkBack.

## Reporting results

For each step above, record: pass / fail / not tested, the device and
Android/TalkBack version used, and — for any failure — exactly what was
expected vs. what happened. File results alongside this script or in the
PR description; do not merge a claim of "TalkBack verified" without this
having actually been run.
