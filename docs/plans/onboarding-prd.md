# Onboarding Rework PRD

## Problem Statement

Profiley's current onboarding model conflicts with the product's stated differentiator.

Today, onboarding is both:

- a mandatory access gate before the user can reach the main app experience
- a multi-step profile questionnaire that asks for information the user may not be ready to provide yet

That combination creates the same failure mode as a typical job platform: the user is asked to invest time before they receive value.

The current product direction should instead optimize for:

- immediate time-to-value after sign-in
- minimal mandatory setup
- progressive enrichment of the user's profile over time
- reusable collection of interview-style answers that make the AI avatar more credible and useful

The specific requirement is to reduce initial onboarding to what is absolutely necessary, with CV upload as the primary setup action and an explicit skip path, then make deeper profile-building available later from the user's profile or other in-product entry points.

## Current State

The current implementation is effectively a one-time 5-step wizard.

- Access to the app is blocked by `onboarding_completed`.
- Users are redirected to `/onboarding` until that flag is set.
- The onboarding page collects profile basics, professional data, and preferences in one flow.
- `complete-onboarding` stores answers and marks onboarding complete.
- The data model already supports persisted, structured answers in `onboarding_answers`.

This means the storage model is already compatible with iterative enrichment, but the user experience and access model are not.

## Product Goal

Let users reach useful Profiley functionality quickly, while still building a richer AI profile over time.

Profiley should behave less like "complete setup before use" and more like:

1. sign in
2. optionally upload a CV
3. get access to the product
4. improve profile quality incrementally through guided prompts, forms, and AI-assisted interviews

## Desired Outcomes

- New users can reach the dashboard without completing a long wizard.
- CV upload is encouraged early because it is the highest-signal, lowest-friction input.
- Skipping CV upload is allowed.
- Users can return later to add interview-style answers.
- The AI avatar can use those answers as self-reported evidence.
- Profile enrichment becomes an ongoing workflow, not a one-off ceremony.

## Non-Goals

- Do not turn Profiley into a chatbot-first product where every user must converse with AI before getting value.
- Do not force users to answer a long list of generic interview questions during first-run setup.
- Do not let the avatar present AI-generated assumptions as if they were user-confirmed facts.
- Do not tie all app access to a single coarse onboarding completion flag.

## Critical Feedback

The direction is strong, but a few assumptions need to be challenged.

### 1. "Limit onboarding to CV upload" is directionally right, but CV upload should not be the only model

CV upload is likely the best default because it is fast and information-dense. But some users will not have a current CV, may be exploring before committing, or may prefer to start from LinkedIn-style profile fields. If CV upload becomes the only meaningful path, the friction simply moves from step 3 of the wizard to step 1 of the product.

Recommendation:

- Make CV upload the primary CTA.
- Provide a visible skip option.
- Offer at least one alternate path later, such as manual profile fill or AI-guided interview.

### 2. Interview questions are valuable, but they are not onboarding-critical

Questions such as "What are your strengths?" or "How do you deal with failure?" are useful for the AI avatar and for recruiter conversations, but they are reflective, effortful, and often better answered after the user has already seen value from the platform.

If asked too early, they will increase abandonment and encourage low-quality, generic answers.

Recommendation:

- Treat these as profile enrichment modules, not activation requirements.
- Ask them after initial value moments, for example after CV ingestion, after profile preview, or when enabling public AI chat.

### 3. Chat-only collection is attractive, but risky if used as the primary capture mode

Using an AI interviewer to collect answers is compelling, but it introduces product risk:

- answers become harder to review and edit
- extraction can be inconsistent across sessions
- users may not know what was saved as profile truth
- the AI may over-normalize or paraphrase away important nuance

Recommendation:

- Use a hybrid model.
- Offer both structured form entry and AI-guided conversational capture.
- Treat chat as a draft-generation and extraction mechanism, not the final source of truth.
- Always show the extracted answer back to the user for confirmation, editing, visibility choice, and save.

### 4. "Onboarding" is probably the wrong product concept for this long-term flow

If the workflow becomes repeatable and optional, it is no longer really onboarding. Continuing to frame it that way will bias product and engineering decisions toward one-time completion.

Recommendation:

- Reframe the feature as `Quick setup` plus `Profile enrichment` or `AI profile training`.
- Keep `/onboarding` only as a transitional route if needed for compatibility.
- Product language should reinforce that users can come back anytime.

## Requirement Statement

Profiley needs to replace its current mandatory one-time onboarding wizard with a low-friction activation experience and a reusable profile enrichment system.

The revised experience must:

- minimize required first-run steps
- prioritize CV upload as the main early input
- allow users to skip CV upload and continue into the app
- land the user on the dashboard immediately after sign-in or quick-start skip so they can see next actions
- stop treating profile enrichment as a once-off task
- allow the user to re-open and extend the experience later from the profile and dashboard surfaces
- host the interview-answer workflow in a dedicated experience that is linked from both the dashboard and profile pages
- support collecting interview-style answers that improve the AI avatar's credibility and usefulness
- support multiple answer-capture modes, including manual forms and AI-guided conversation
- support reusable question sets so the interview-answer system can expand beyond job-search-specific use cases over time
- preserve user control over what is saved, edited, and exposed to the avatar

## Proposed Product Model

### 1. Split activation from enrichment

Activation should answer only one question: can the user start using Profiley?

Proposed activation flow:

1. Sign in and accept required legal terms.
2. Repurpose `/onboarding` into a lightweight `Get started` screen.
3. Primary CTA: upload CV.
4. Secondary CTA: skip for now.
5. Land the user in the dashboard regardless of whether they uploaded a CV.

Enrichment should answer a different question: how do we make the profile and AI avatar better over time?

That flow should be re-openable from:

- profile page
- dashboard checklist and quick actions
- upload completion states
- AI avatar setup surfaces
- publish/readiness surfaces

### 2. Replace the single onboarding gate with feature-specific readiness

The current coarse gate is too blunt.

Instead of blocking the whole app until `onboarding_completed = true`, remove the hard onboarding gate entirely and use narrower feature-specific readiness checks.

Examples:

- Dashboard: available after auth and legal acceptance.
- Uploads: always available.
- Profile editing: always available.
- Public publishing: may require minimum profile completeness and explicit review.
- AI chat: requires at least one successfully processed CV; additional profile enrichment improves answer quality.
- Job-fit analysis: requires at least one successfully processed CV; additional profile enrichment improves match quality.
- Public AI avatar chat: may additionally require minimum self-reported profile data, review state, and safety checks.

This makes the product feel permissive while still protecting features that need data quality.

### 3. Turn interview questions into reusable answer modules

Do not present a giant survey.

Instead, organize the questions into smaller modules such as:

- Professional summary: strengths, weaknesses, motivators
- Working style: collaboration, conflict, failure, change adaptation
- Leadership and influence: motivating others, mentoring, ownership
- Execution: goal-setting, prioritization, handling multiple projects
- Career preferences: target roles, industries, environment, values

Each module should:

- be independently completable
- show estimated time to complete
- allow save-and-return-later
- contribute to a visible profile quality score or readiness score

The interview-answer experience should live in its own dedicated route, with clear entry points from the dashboard and profile page. This route should be the only authoring surface for interview answers. The profile page can summarize or link to this data, but should not directly edit interview answers. This keeps the system reusable and allows Profiley to support different question sets in the future rather than coupling the feature only to job-search onboarding.

### 4. Use structured prompts, not only open text blobs

The questions you listed are good raw prompts, but they should be captured in a more reusable structure.

Recommended answer model per question:

- question set or domain key
- canonical question key
- user-facing prompt
- answer body
- optional short summary
- optional evidence/example block
- capture method: form, chat, imported, voice transcript
- visibility: user-selected per answer, such as private, avatar-queryable only, or public-profile
- review status: draft, confirmed, stale
- timestamps and version

This matters because the avatar should know which answers are user-confirmed versus inferred.

Default answer-state behavior:

- manual form answers save as `confirmed` and `avatar-queryable only` by default
- AI-extracted chat answers save as `draft` and `private` until explicitly approved by the user

Voice input should not be part of the initial scope. It can be introduced in a later phase once text-based capture, review, and save semantics are stable.

### 5. Make AI-assisted capture additive, not authoritative

Suggested chat workflow:

1. User opens `Interview trainer` or `Train my AI profile`.
2. AI asks one question at a time.
3. AI follows up to elicit stronger examples, ideally in a STAR-like structure.
4. AI proposes a cleaned-up draft answer.
5. User approves, edits, rejects, or marks private.
6. Only approved content is saved to the profile knowledge base.

This gives the user the benefit of conversational prompting without losing control.

## UX Recommendations

### First-run experience

The first-run screen should be extremely short.

Recommended content:

- headline: create your AI profile in minutes
- primary action: upload your CV
- secondary action: skip and explore first
- short explanation of what uploading helps unlock
- no multi-step progress bar
- no large questionnaire on day 0

### Dashboard follow-up

After the first session, use progressive prompts rather than a wizard.

Examples:

- Add your top strengths
- Answer 3 interview questions to improve your AI avatar
- Review what your avatar can currently say about you
- Add examples from leadership, teamwork, and failure

The dashboard quick actions section should include an entry point to re-open the repurposed onboarding quick-start flow.

### Profile page entry point

The profile page should include a clear section such as:

- `Improve AI profile`
- `Train your avatar`
- `Interview answers`

This section should make the flow explicitly re-runnable.

## Data and System Implications

### State model changes

The current `onboarding_completed` flag likely needs to be deprecated or reduced in importance.

Better options:

- keep it temporarily for migration compatibility, but stop using it as the primary app access gate
- introduce a lighter `activation_completed_at`
- introduce a computed or stored `profile_readiness_score`
- track completion per enrichment module rather than one global boolean

### Reusable answer storage

The existing `onboarding_answers` table may still be usable, but the name will become misleading if this becomes an ongoing profile-training system.

Options:

- short term: keep the table, extend metadata, and treat it as the enrichment answer store
- longer term: rename or replace with a more general concept such as `profile_answers` or `persona_facts`

### Provenance and trust

Every answer used by the avatar should preserve provenance.

The system should distinguish between:

- directly uploaded source material
- self-reported user answers
- AI-extracted summaries
- AI-generated drafts not yet confirmed

The avatar should prefer confirmed user-authored or user-approved material.

## Compliance and Safety Considerations

This feature increases product value, but it also creates trust risk.

Requirements:

- users must be able to review and edit anything saved from AI chat
- the system must avoid presenting inferred content as factual biography
- the product should avoid collecting protected or irrelevant sensitive data
- visibility controls must be explicit when answers may influence public avatar behavior
- stale answers should be reviewable and removable

## Recommended Rollout Plan

### Phase 1: Friction reduction

- Remove the hard app gate that forces completion of the full onboarding wizard.
- Repurpose `/onboarding` into a lightweight quick-start screen.
- Make CV upload primary and skip explicit.
- Add a dashboard quick action that lets users re-open the quick-start flow later.
- Add dashboard and profile CTAs for later enrichment.

This phase addresses the biggest UX problem fastest.

### Phase 2: Structured enrichment

- Break the current questionnaire into reusable modules.
- Allow users to enter the dedicated interview-answer route from the profile page and dashboard.
- Add completion states, progress, and editability.
- Keep form-based entry as the baseline capture mode.

This phase improves profile quality without introducing extraction complexity.

### Phase 3: AI-guided interview capture

- Add a conversational interviewer that asks one question at a time.
- Extract draft answers into structured fields.
- Require explicit review before save.
- Tag answers by provenance and visibility.

This phase adds the differentiated experience without making the product brittle early.

## Implementation Approach

### Frontend workstreams

- Repurpose `onboarding.tsx` into a lightweight quick-start page.
- Remove the app-wide redirect that blocks access until `onboarding_completed` is true.
- Add a quick action on the dashboard that re-opens the repurposed onboarding quick-start flow.
- Add re-entry points from the dashboard and profile page into profile enrichment.
- Add a dedicated interview-answer route linked from dashboard and profile.
- Keep the dedicated interview-answer route as the only authoring surface for interview answers.
- Break the current questionnaire UI into reusable modules instead of a single linear flow.
- Add explicit save, review, edit, and visibility controls for interview answers.

### Backend and data workstreams

- Decouple app access from `complete-onboarding`.
- Introduce a lighter activation concept and a separate profile-readiness concept.
- Extend answer storage to support provenance, capture method, visibility, and review state.
- Require question-set metadata in v1 so the interview-answer engine is reusable across domains from the start.
- Define CV readiness against at least one successfully processed CV, not merely an uploaded file.
- Keep existing answer rows readable during migration.
- Ensure downstream avatar and profile-generation features only use confirmed or user-approved answers.

### Migration strategy

- Keep `/onboarding`, but repurpose it into quick start rather than preserving the old wizard.
- Retain `onboarding_completed` only as legacy data compatibility if needed; it must no longer drive routing or app access.
- Treat existing onboarding answers as the first version of enrichment data.
- Migrate gating logic first, then redesign UI, then add conversational capture.
- Avoid a large all-at-once rewrite.

### Testing strategy

- Update protected-route tests to reflect the new app-access rules.
- Add coverage for quick-start skip behavior.
- Add coverage for returning to enrichment from profile and dashboard.
- Add coverage for the dedicated interview-answer route and question-set loading.
- Add backend validation tests for any new answer metadata.
- Add end-to-end coverage for: sign in -> quick start -> skip or upload -> dashboard -> enrich profile later.

## Success Metrics

- reduced drop-off between sign-in and first dashboard visit
- increased percentage of new users who reach a value moment in the first session
- increased CV upload completion rate without forcing it
- increased percentage of users who return to complete enrichment modules later
- improved recruiter satisfaction with AI avatar answer quality
- reduced rate of low-quality, generic, or obviously fabricated profile answers

## Resolved Product Decisions

- The minimum immediately available post-sign-in destination is the dashboard, which should surface clear next actions for profile enrichment.
- `/onboarding` is repurposed as the quick-start route rather than kept as the old multi-step wizard.
- The dashboard quick actions section should let users re-open the repurposed quick-start flow later.
- AI chat and job-fit analysis both require at least one successfully processed CV. Additional profile enrichment improves output quality but is not a substitute for that requirement.
- The interview-answer workflow should live in a dedicated route linked from both the dashboard and profile pages, and it should be the only authoring surface for interview answers.
- The interview-answer system should include question-set metadata in v1 so it can support other domains over time.
- Manual form answers save as confirmed and avatar-queryable-only by default.
- AI-extracted chat answers save as draft and private until explicitly approved.
- Voice input is out of scope for the first phase of the interview-answer system and should be treated as a phase 2 enhancement.
- Answer visibility should be chosen by the user per question or answer rather than fixed globally up front.
- Versioning and staleness prompts should be included so older answers can be reviewed and refreshed over time.

## Strong Recommendation

Do not iterate on the current wizard as the primary mental model.

The better move is to explicitly redesign the experience around:

- optional quick setup
- progressive profile enrichment
- modular interview-answer capture
- user-reviewed AI assistance

If executed this way, Profiley will feel meaningfully different from job platforms that demand effort up front. If executed as a slightly shorter wizard, it will still feel like the same category of product, just with fewer steps.