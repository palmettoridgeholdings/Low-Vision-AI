# Access AI — Streamlit MVP

Access AI is an early proof-of-concept for an AI assistant designed around blind and
low-vision users. Accessibility context is automatically included with every request
so the user does not have to repeatedly explain that instructions or recommendations
need to work nonvisually.

## Version 0.1 includes

- Accessible, intentionally simple Streamlit chat interface
- Blind / low-vision accessibility profile
- TalkBack, VoiceOver, NVDA, JAWS, Braille, and voice-oriented preferences
- Accessibility-aware system instructions
- Optional OpenAI web search
- Conversation history stored for the current Streamlit session
- Safety language for uncertain visual and safety-critical information

## Run locally

1. Install Python 3.10 or newer.
2. Download or clone this repository.
3. Open a terminal in the project folder.
4. Create a virtual environment:

   Windows:
   `python -m venv .venv`

   macOS/Linux:
   `python3 -m venv .venv`

5. Activate it.

   Windows:
   `.venv\Scripts\activate`

   macOS/Linux:
   `source .venv/bin/activate`

6. Install packages:

   `pip install -r requirements.txt`

7. Copy `.env.example` to `.env`.

8. Put your OpenAI API key in `.env`:

   `OPENAI_API_KEY=...`

9. Start the app:

   `streamlit run app.py`

## Important security rule

Never commit `.env` or an API key to GitHub. `.gitignore` is already configured to
exclude `.env`.

## Suggested test questions

- Help me choose a microwave that is easy to operate without sight.
- Walk me through joining a Wi-Fi network using Android TalkBack.
- I have a washing machine with a flat touch panel. What problems might I run into?
- What should I consider when choosing a hotel as a blind traveler?
- Compare two products, but make accessibility a major factor in the recommendation.

## Next milestones

Version 0.2:
- Microphone input
- Spoken responses
- Dedicated "Accessibility Check" action
- Better source/citation presentation

Version 0.3:
- Camera/image input
- Nonvisual scene description
- Read labels, menus, mail, appliances, and controls
- Confidence / verification behavior for visual tasks

Version 0.4:
- Persistent user profiles
- Native Android prototype
- TalkBack testing with blind and low-vision users

## Design principle

Do not make the model pretend to be blind. Make it systematically account for
blindness and low vision when that context changes the usefulness, accessibility,
or safety of an answer.
