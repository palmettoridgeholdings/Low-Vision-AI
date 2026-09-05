# Access AI Pre-Proposal Diligence Checklist

**Status:** Active cleanup before further partnership or grant outreach  
**Started:** September 5, 2026

Do not send a new external Access AI proposal until all RED items are resolved and the final verification pass is complete.

## RED — required before outreach

- [ ] Publish a Privacy Policy on access-ai.tech.
- [ ] Publish Terms of Use / service disclaimer.
- [ ] Publish an Accessibility Statement.
- [ ] Add footer links to Privacy, Terms, Accessibility, and Contact.
- [x] Replace outdated Access AI contact addresses with founder@access-ai.tech where appropriate.
- [ ] Verify public website, prototype, PDF, legal pages, email links, canonical URL, and sitemap all resolve correctly over HTTPS.
- [x] Update the README so it accurately distinguishes the Streamlit proof of concept from the native Android product direction.
- [x] Supersede stale accessibility documentation that describes obsolete onboarding behavior.
- [x] Audit repository and history-facing documentation for Emergent or other obsolete builder/platform references.
- [x] Audit secrets and configuration handling. No production API key may be committed or embedded in a mobile client.
- [x] Confirm temporary image/audio handling and user-content retention statements match actual code.
- [ ] Review third-party data flows: OpenAI API, Streamlit hosting, Google Analytics, and any later Android services.
- [x] Verify that repository product claims are supported by implemented or clearly labeled planned functionality.

## YELLOW — professional polish

- [ ] Rewrite generic landing-page copy where it reads like template/AI filler.
- [x] Add a concise Technical Progress / Project Status section with concrete engineering facts.
- [x] Clearly label the Streamlit application as a proof of concept.
- [x] Clearly identify native Android as the primary mobile development path.
- [ ] Refresh the Smart Glasses Proof of Concept PDF with current contact information and vendor-neutral language.
- [ ] Visually inspect all four PDF pages for spacing, table, line-break, and accessibility issues.
- [x] Remove or rewrite Mentra-specific language that is no longer appropriate for general outreach.
- [ ] Review page hierarchy, navigation, focus behavior, mobile layout, contrast, and zoom/reflow.
- [ ] Check title, description, Open Graph metadata, favicon, robots, canonical, and sitemap.
- [x] Add appropriate organization/project ownership wording: Palmetto Ridge Holdings LLC / Palmetto Ridge Media Group.

## CODE / REPOSITORY DILIGENCE

- [x] Run full automated test suite.
- [x] Run Python syntax/compile checks and dependency checks.
- [x] Identify dead code and unused dependencies without deleting anything still needed by the Streamlit prototype.
- [x] Check .gitignore for secrets, build outputs, local environments, Android signing files, and IDE artifacts.
- [x] Inspect docs for stale model names, paths, setup steps, screenshots, and deployment instructions.
- [ ] Confirm README setup instructions reproduce a clean local install.
- [x] Confirm Android work remains isolated from the Streamlit deployment.
- [x] Confirm the isolated Android source contains no Android/OpenAI production credential path. APK inspection remains a release check.
- [x] Document architecture and current milestone without overstating implementation status.
- [x] Verify the tracked repository contains no throwaway generated files, builder branding, unexplained experimental assets, or unlabeled placeholder behavior.

## PRIVACY / DATA MODEL

- [x] Text questions: document where sent, where held, and whether persisted.
- [x] Images: document capture/submit behavior, provider transmission, and retention behavior.
- [x] Voice audio: document recording, temporary local handling, transcription transmission, and deletion behavior.
- [x] Conversation state: document Streamlit session behavior and future Android behavior.
- [x] Accessibility preferences: document current session storage and Android DataStore plan.
- [ ] Website analytics: disclose Google Analytics and verify configuration.
- [x] Add user-facing policy notice before any future feature introduces accounts, cloud history, syncing, background capture, or persistent user content.
- [ ] Ensure privacy disclosures and future Google Play Data Safety answers describe the same behavior.

## ACCESSIBILITY RELEASE GATE

- [ ] Native Android APK builds successfully.
- [ ] Fresh-install onboarding tested physically with TalkBack.
- [ ] TalkBack focus order is logical.
- [ ] Standard swipe left/right navigation works without custom gesture conflicts.
- [ ] Double-tap activation works on all onboarding controls.
- [ ] Android TTS behavior is understandable alongside TalkBack.
- [ ] Preferences survive restart.
- [ ] Text/Braille-compatible input path works.
- [ ] Large text/display scaling does not break core screens.
- [ ] Known limitations are documented accurately.

## FINAL EXTERNAL-DILIGENCE PASS

Pretend the reviewer is a skeptical accessibility engineer, grant evaluator, or hardware partner.

- [ ] Does the website look like a maintained technical project rather than a one-night landing page?
- [ ] Can a reviewer understand what works today versus what is planned?
- [ ] Do legal/privacy statements match actual code behavior?
- [ ] Are all claims defensible?
- [ ] Do all public links work?
- [ ] Is the contact identity consistent?
- [ ] Is the proposal current and vendor-appropriate?
- [ ] Are significant risks and limitations stated professionally rather than hidden?
- [ ] Is there enough technical evidence to justify a serious follow-up conversation?

**Outreach gate:** PASS only after the above review is complete and the public site has been rechecked from a clean browser/mobile session.
