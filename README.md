# Access AI

Access AI is a Streamlit accessibility prototype for blind and low-vision users. It supports text and Braille-keyboard questions, recorded voice questions, spoken answers, and camera-assisted document reading, scene description, and object inspection.

This is assistive software, not a navigation or safety system. A single image cannot establish that a route is safe. Verify uncertain medication, hazard, financial, legal, and navigation details with an appropriate trusted source.

## Features

- Screen-reader-friendly first-run setup with vision, interaction, platform, answer-style, and speech preferences.
- Immediate spoken-onboarding attempt with a full-screen tap/keyboard fallback when autoplay is blocked.
- Text input compatible with ordinary keyboards and refreshable Braille displays.
- Recorded voice input and AI-generated spoken responses.
- Camera tasks for **Read text / mail**, **Describe scene**, and **Find / inspect**.
- Accessibility-aware prompts that favor nonvisual landmarks and explicit uncertainty.
- Optional web research for text questions.
- Large controls, visible keyboard focus, high contrast, and a large-text profile.
- Graceful operation when the API key, camera, or microphone is unavailable.

## Requirements

- Python 3.11 or newer. The current lock was generated and verified with Python 3.13.
- A browser supported by Streamlit.
- An OpenAI API key for AI answers, image analysis, transcription, and generated speech.
- Optional camera and microphone access for the related features.

Setup and accessibility preferences work without an API key. Tests do not need a key and never call the live API.

## Local setup

Clone the repository, change to its root, and create a virtual environment.

Windows PowerShell:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

macOS or Linux:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

Run the app from the repository root:

```bash
python -m streamlit run app.py
```

Open the local URL printed by Streamlit, normally `http://localhost:8501`.

## Configuration and secrets

`OPENAI_API_KEY` is required for requests to the OpenAI API. `OPENAI_MODEL` is optional and defaults to `gpt-5.6`, preserving the prototype's current model selection.

For one local shell session, set the key as an environment variable:

Windows PowerShell:

```powershell
$env:OPENAI_API_KEY = "your-key"
```

macOS or Linux:

```bash
export OPENAI_API_KEY="your-key"
```

Alternatively, use one of these untracked local files:

`.env`:

```dotenv
OPENAI_API_KEY=your-key
OPENAI_MODEL=gpt-5.6
```

`.streamlit/secrets.toml`:

```toml
OPENAI_API_KEY = "your-key"
```

Never commit either file or paste a key into source code. Both secret-file locations are ignored by Git. The OpenAI client also reads `OPENAI_API_KEY` directly from the environment, consistent with the [official OpenAI developer quickstart](https://platform.openai.com/docs/quickstart/make-your-first-api-request).

## Testing

Install the development requirements and run the full suite:

```bash
python -m pip install -r requirements-dev.txt
python -m pytest -q -p no:cacheprovider
```

The tests use Streamlit's application harness and a fake OpenAI client. They cover:

- startup and accessible onboarding;
- missing-key behavior;
- successful and blocked onboarding autoplay;
- tap/keyboard audio unlocking and duplicate-synthesis prevention;
- text-only questions with speech disabled;
- nonfatal speech-generation failure and retry availability;
- camera-unavailable/no-photo behavior;
- camera mode and non-hardware feature availability.

For a local server smoke check:

```bash
python -m streamlit run app.py --server.headless true
```

Then open `http://localhost:8501/_stcore/health`; a healthy process returns `ok`.

Live API verification is intentionally separate because it consumes network access and API usage. With a configured key, manually test one text answer, one short transcription, one spoken answer, and one non-sensitive image in each camera mode.

## Dependency management

`requirements.in` preserves the direct dependency ranges used by the prototype. `requirements.txt` is the exact runtime lock consumed locally and by Streamlit deployment. `requirements-dev.txt` adds pinned test and lock-generation tools.

To intentionally refresh the lock:

```bash
python -m piptools compile --resolver=backtracking --strip-extras --output-file requirements.txt requirements.in
python -m pip install -r requirements-dev.txt
python -m pytest -q -p no:cacheprovider
```

Review the generated diff and repeat the full smoke check before committing. Do not run an upgrade command merely to install an unchanged lock.

## Deploying to Streamlit Community Cloud

1. Push the repository to GitHub.
2. In Streamlit Community Cloud, create an app from the repository.
3. Select the intended branch and set the entrypoint to `app.py`.
4. In **Advanced settings**, choose the same supported Python version used for verification (currently Python 3.13).
5. Add `OPENAI_API_KEY` in the Streamlit **Secrets** field. Add `OPENAI_MODEL` only if overriding the default.
6. Deploy and review the build logs, onboarding, text-only path, and browser permission behavior.

Streamlit installs root-level `requirements.txt` automatically. Keep secrets in the deployment settings, never in Git. See Streamlit's official guides for [deployment](https://docs.streamlit.io/deploy/streamlit-community-cloud/deploy-your-app/deploy) and [secrets management](https://docs.streamlit.io/deploy/streamlit-community-cloud/deploy-your-app/secrets-management).

## Accessibility operation

- **Screen reader:** Use headings to move among Camera assistance, Ask by voice, text/Braille input, and Conversation. Every main input has a visible accessible label.
- **Keyboard:** Tab through controls and use Space or Enter to activate buttons. Radio groups support arrow keys. Select boxes use the browser and screen reader's normal combobox commands.
- **Spoken setup:** Access AI attempts the welcome automatically. If the browser blocks it, the first screen becomes one large **Access AI. Tap anywhere to begin spoken setup.** control and receives focus. Tap it or press Enter/Space once; later setup steps speak automatically. A separate visible **Start accessible setup** button keeps the visual path available.
- **Voice first:** Enable **Automatically speak answers** and choose a voice in the preferences expander. Text answers remain visible if speech generation fails.
- **Large text:** Choose **Large text** as the primary interaction preference, or select a low-vision profile, to enlarge body text, fields, conversation text, and headings.
- **No camera or microphone:** Continue with the text input. Denying hardware permission does not block the rest of the app.

The detailed review and remaining manual checks are in [docs/accessibility-review.md](docs/accessibility-review.md).

## Troubleshooting

### AI features say a key is needed

Confirm `OPENAI_API_KEY` is available in the same shell that starts Streamlit, or add it to the deployment's Streamlit Secrets. Restart Streamlit after changing a local secret file. Do not print the key while diagnosing it.

### Spoken onboarding does not start

If autoplay is blocked, activate the full-screen **Access AI. Tap anywhere to begin spoken setup.** control by tapping it or pressing Enter/Space. One activation unlocks continuous setup speech; there are no per-step speech buttons. Confirm API access if the app reports that speech is unavailable. The text version of every setup step remains usable.

### Microphone or camera is unavailable

Check browser site permissions and operating-system privacy settings, then reload the page. HTTPS is normally required outside localhost. If the device has no supported hardware, use the text path; camera and voice controls are optional.

### An answer appears but speech fails

The text answer is retained. Check network/API access and retry the spoken answer. Disabling **Automatically speak answers** provides a fully text-only flow.

### Streamlit will not start

Run `python -m pip check`, reinstall the exact lock with `python -m pip install -r requirements.txt`, and confirm the command is being run from the repository root so `system_prompt.txt` can be found.

### Deployment fails while installing packages

Confirm the entrypoint is `app.py`, only the intended root dependency file is selected, and the deployment Python version matches the version documented above. Review the Streamlit build log before changing pins.

## Project layout

```text
app.py                         Streamlit prototype
system_prompt.txt              Accessibility and vision safety instructions
requirements.in               Direct runtime dependency constraints
requirements.txt              Exact generated runtime lock
requirements-dev.txt          Test and lock-generation tools
tests/test_app_smoke.py        Offline Streamlit smoke tests
onboarding.py                  Spoken-setup state and component wrapper
components/spoken_setup/       Accessible browser autoplay/unlock component
docs/accessibility-review.md   Accessibility findings and manual test matrix
docs/smart-glasses-interface.md Future modular glasses interface design
```

## Smart-glasses integration

No smart-glasses SDK or device code is implemented. A low-cost, vendor-neutral future interface is documented in [docs/smart-glasses-interface.md](docs/smart-glasses-interface.md).
