# Access AI Pre-Proposal Diligence Checklist

**Status:** Repository and public-material closeout complete; physical product validation remains
**Started:** September 5, 2026

Do not send a new external Access AI proposal until all RED items are resolved and the final verification pass is complete.

## Closeout record — September 5, 2026

- The replacement public website is deployed and externally reachable at `https://access-ai.tech/`.
- Privacy Policy, Terms of Use, and Accessibility Statement pages are published and linked from the public footer.
- The existing Google Analytics 4 property `G-E4TE8BSQBV` is preserved and disclosed in the Privacy Policy.
- The refreshed four-page Smart Glasses Proof of Concept PDF is deployed and versioned with SHA-256 `f61f5934ba8657bca9f7df2efd464fbb0904874911af154ae439d3ca3d7fd086`.
- The repository licensing decision is complete: the repository is proprietary under the root `LICENSE`; third-party dependencies retain their own licenses.
- Physical assistive-technology testing remains outstanding. No formal accessibility-conformance claim is made.
- Android build validation and physical TalkBack testing remain a separate product milestone.

## RED — required before outreach

- [x] Publish a Privacy Policy on access-ai.tech.
- [x] Publish Terms of Use / service disclaimer.
- [x] Publish an Accessibility Statement.
- [x] Add footer links to Privacy, Terms, Accessibility, and Contact.
- [x] Replace outdated Access AI contact addresses with founder@access-ai.tech where appropriate.
- [x] Verify the public website, PDF, legal pages, email links, canonical URL, and sitemap resolve correctly over HTTPS.
- [x] Keep the Streamlit prototype off the public call to action until it is independently verified awake and functioning; future publication remains a separate operational check.
- [x] Update the README so it accurately distinguishes the Streamlit proof of concept from the native Android product direction.
- [x] Supersede stale accessibility documentation that describes obsolete onboarding behavior.
- [x] Audit repository and history-facing documentation for Emergent or other obsolete builder/platform references.
- [x] Audit secrets and configuration handling. No production API key may be committed or embedded in a mobile client.
- [x] Confirm temporary image/audio handling and user-content retention statements match actual code.
- [x] Review and document current third-party data flows: OpenAI API, Streamlit hosting, and Google Analytics. Re-review any later Android services before release.
- [x] Verify that repository product claims are supported by implemented or clearly labeled planned functionality.

## YELLOW — professional polish

- [x] Rewrite generic landing-page copy where it reads like template/AI filler.
- [x] Add a concise Technical Progress / Project Status section with concrete engineering facts.
- [x] Clearly label the Streamlit application as a proof of concept.
- [x] Clearly identify native Android as the primary mobile development path.
- [x] Refresh the Smart Glasses Proof of Concept PDF with current contact information and vendor-neutral language.
- [x] Visually inspect all four PDF pages for spacing, table, line-break, and accessibility issues.
- [x] Remove or rewrite Mentra-specific language that is no longer appropriate for general outreach.
- [x] Review page hierarchy, navigation, focus behavior, mobile layout, contrast, and baseline reflow; physical assistive-technology testing remains outstanding.
- [x] Check title, description, Open Graph metadata, favicon, robots, canonical, and sitemap in the replacement package; repeat after deployment.
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
- [x] Website analytics: disclose Google Analytics and verify one `G-E4TE8BSQBV` configuration per public HTML page.
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

- [x] Does the website look like a maintained technical project rather than a one-night landing page?
- [x] Can a reviewer understand what works today versus what is planned?
- [x] Do legal/privacy statements match actual code behavior?
- [x] Are all claims defensible?
- [x] Do all public links work?
- [x] Is the contact identity consistent?
- [x] Is the proposal current and vendor-appropriate?
- [x] Are significant risks and limitations stated professionally rather than hidden?
- [x] Is there enough technical evidence to justify a serious follow-up conversation?

**Outreach gate:** PASS for the current development-stage proposal materials. This is not a product-release or accessibility-conformance approval; the unchecked physical testing, prototype availability, Android, and operational items above remain required at their stated milestones.
