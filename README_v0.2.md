# Access AI v0.2 — Voice First

Version 0.2 adds voice input and spoken responses to the accessibility-aware Access AI
prototype.

## Included

- Voice recording with Streamlit's built-in microphone input
- OpenAI speech-to-text transcription
- Accessibility-aware GPT responses
- Optional web research
- OpenAI text-to-speech spoken answers
- Repeat last answer
- Stop speaking
- Typed questions remain fully available
- Accessibility profile for blindness, low vision, screen readers, Braille, and voice

## Deploying over v0.1

Replace these files in the GitHub repository:

- app.py
- requirements.txt
- system_prompt.txt

Do not change your Streamlit secret. Your existing OPENAI_API_KEY is reused.

Streamlit Community Cloud should automatically redeploy after the GitHub commit.

## Important

The spoken voice is AI-generated. The app includes that disclosure in the interface.

Browser autoplay restrictions can sometimes prevent automatic playback. If that occurs,
the audio player remains available and the user can activate playback manually.

## Next milestone

v0.3:
- Camera input
- Read labels, mail, menus, appliances, and controls
- Nonvisual scene descriptions
- Visual confidence / uncertainty handling
