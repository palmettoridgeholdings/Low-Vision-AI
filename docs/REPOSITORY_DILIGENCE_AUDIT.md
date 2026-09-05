# Access AI Repository Diligence Audit

**Audit date:** September 5, 2026

**Branch:** `codex/preproposal-diligence-cleanup`

**Scope:** All tracked files, all 46 reachable Git commits, local generated Android
artifacts, and the isolated native Android milestone at commit `f60e714`.

This is a technical repository audit, not legal advice or an accessibility
conformance assessment.

## Findings resolved in this branch

1. **The README described an obsolete onboarding flow.** It referred to automatic
   welcome speech, a full-screen autoplay-unlock control, and labels that are not in
   the current code. The README now describes the explicit spoken and visual routes
   and the browser-speech repeat control.
2. **The accessibility review repeated the obsolete autoplay behavior and sounded
   more conclusive than the evidence supported.** It now matches the current code,
   separates static/code-level findings from manual validation, and states the
   untested device and assistive-technology scope.
3. **The Streamlit and native Android directions were easy to conflate.** The README
   and historical onboarding specification now state that this branch is a
   Streamlit proof of concept, while native Android is a separately maintained
   product direction.
4. **Session-only settings were described as persistent context.** The system prompt,
   README, onboarding-spec note, and Privacy Policy now say that Streamlit state is
   limited to the current session. Planned Android DataStore behavior is described
   separately.
5. **Responses API calls did not explicitly disable application-state storage.** Both
   text and image requests now set `store=False`, and a regression test enforces this
   for every Responses API call in `app.py`.
6. **The Privacy Policy did not fully describe optional web search or browser speech.**
   It now covers both and distinguishes project-controlled storage from provider
   processing and logs.
7. **The root `.gitignore` did not protect Android signing files, Android/Gradle build
   state, common private-key formats, or diligence-research output.** Conservative
   ignore rules were added without deleting local files.
8. **Vendor-specific Mentra references remained in a design-only document.** They
   were replaced with vendor-neutral adapter language. No smart-glasses feature is
   represented as implemented.

## Findings that did not require a code change

- No obsolete Emergent, Lovable, Bolt, Replit, v0.dev, or Builder.io remnant was
  found in the product code or history. References to Emergent and Mentra in the
  diligence records describe the audit itself, not a current platform dependency.
- No outdated email address was found in the current tree or reachable history.
  The only discovered project contact is `founder@access-ai.tech`.
- Pattern-based scanning found no recognizable OpenAI, Google, AWS, or private-key
  credential in the current files or reachable history. This does not replace a
  dedicated secret-scanning service or credential inventory.
- All direct Python dependencies are used: Streamlit provides the application UI,
  `openai` provides API access, and `python-dotenv` supports local environment files.
  The larger runtime lock consists of their transitive dependencies.
- No tracked throwaway cache, compiled Python file, Android build output, or IDE
  state was found. Local `android/` and `spike/` contents on this checkout consist
  only of generated caches/build outputs and are now ignored.
- The isolated Android milestone contains no OpenAI SDK, API key, network permission,
  or production camera/microphone implementation. Its unavailable functions are
  explicitly labeled as milestone placeholders rather than simulated as working.

## Manual or separate review still required

- **Legal review and publication:** Counsel should review the Privacy Policy and
  Terms. A replacement static website package now exists under
  `website/access-ai-tech/`, but live HTTPS behavior, deployed footer links,
  canonical URL, sitemap, analytics state, and contact links remain unverified
  until deployment.
- **Provider configuration:** Confirm the production OpenAI project’s data controls,
  logging configuration, model access, billing limits, and incident procedures.
  `store=False` reduces Responses API application-state storage but does not prevent
  provider processing or all abuse-monitoring logs.
- **Accessibility testing:** Complete the documented eyes-free matrix with physical
  TalkBack/VoiceOver devices, supported desktop screen readers, Braille input, large
  text, zoom/reflow, camera/microphone permission denial, and live API behavior.
- **Android privacy:** Before release, review Android backup/data-extraction rules.
  The isolated milestone currently declares `android:allowBackup="true"`; locally
  stored accessibility preferences may therefore be eligible for platform backup
  even though application-level cloud sync is not planned.
- **Android integration:** The requested branch has no Android source or Gradle
  wrapper, so Android tasks cannot run here. Build, JVM tests, lint, instrumented
  accessibility checks, signing configuration, and APK inspection belong on the
  isolated Android branch.
- **Licensing:** The repository has no `LICENSE` file. Ownership language exists in
  the Terms, but the owner must choose and approve a source-code license or an
  explicit proprietary notice before external distribution.
- **Operational validation:** Run a clean deployment smoke test and one deliberately
  non-sensitive live request for text, image, transcription, speech, and optional
  web search. Confirm temporary-file cleanup and redacted production logging.

## Verification results

- `python -m pytest -q -p no:cacheprovider`: **15 passed in 6.28s**.
- `python -m py_compile app.py onboarding.py tests/fake_openai.py tests/test_app_smoke.py`: **passed**.
- `python -m pip check`: **No broken requirements found**.
- `python -m pip install --dry-run --no-deps -r requirements.txt`: every locked runtime package was already installed at the required version.
- `python -m piptools compile --dry-run --resolver=backtracking --strip-extras requirements.in`: resolved to the checked-in lock; **Dry-run, so nothing updated**.
- Streamlit headless smoke check: server started and `/_stcore/health` returned **HTTP 200, `ok`**.
- Android wrapper check in an isolated detached worktree: **Gradle 8.14.3 on Java 17** was available. `testDebugUnitTest`, `lintDebug`, and `assembleDebug` could not execute because this Windows host could not establish Gradle's required loopback connection for its single-use daemon. This is an environment-blocked result, not a passing Android build.
- `git diff --check`: **passed** before commit.
