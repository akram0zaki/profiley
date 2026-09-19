# Onboarding Rework Implementation Plan

Last updated: 2026-05-13

## Execution status

- `P0.1 Schema and validation foundation`: Completed
- `P0.2 Remove hard onboarding gate`: Completed
- `P0.3 Repurpose /onboarding into quick start`: Completed
- `P0.4 Dashboard re-entry and CV readiness UX`: Completed
- `P1.1 Dedicated interview-answer route`: Completed
- `P1.2 Reusable question-set metadata and answer defaults`: Completed
- `P1.3 CV-gated AI and job-fit behavior`: Completed
- `P2.1 AI-assisted answer drafting and approval`: Completed
- `P2.2 Versioning and stale-answer support`: Completed

## Purpose

This plan turns [docs/plans/onboarding-prd.md](../plans/onboarding-prd.md) and [docs/plans/onboarding-spec.md](../plans/onboarding-spec.md) into an execution backlog for the workspace.

It is intended to be implementation-first: each backlog item names the likely repo surfaces, the concrete work to perform, and the validation expected before the item can be considered complete.

## Fixed decisions from the operator

- `/onboarding` is repurposed rather than replaced by a new activation route.
- The hard onboarding gate must be removed.
- The dashboard quick actions section must let users re-open the repurposed quick-start flow.
- CV readiness means at least one successfully processed CV.
- AI chat and job-fit features depend on processed CV readiness.
- Interview answers must be authored only in a dedicated route.
- Manual form answers save as confirmed and avatar-queryable by default.
- AI-extracted chat answers save as draft and private until explicitly approved.
- Question-set metadata must exist in v1.
- Voice input is out of scope for the initial implementation.

## Operating assumptions

- Every functional change must include tests, per [AGENTS.md](../../AGENTS.md).
- The current `onboarding_completed` field may remain in the database temporarily, but must no longer control route access.
- The existing `onboarding_answers` table is reused in MVP and extended rather than replaced immediately.
- The first shipped question set is job-search-focused, but storage and routing must not hardcode job-search-only semantics.
- The first implementation should minimize churn by reusing existing routes and backend functions where practical.

## Definition of done

This plan is complete when all of the following are true:

1. New users can authenticate, accept legal documents, pass through quick start, and reach the dashboard without a mandatory multi-step wizard.
2. The app no longer redirects based on `onboarding_completed`.
3. The dashboard includes a quick action to reopen quick start.
4. Owner chat preview and job-fit preview show processed-CV-gated empty states rather than onboarding-gated behavior.
5. A dedicated `/interview-answers` route exists and is the only authoring surface for interview answers.
6. Persisted answers include question-set metadata and support visibility and review-state semantics required by the spec.
7. AI-assisted answer drafting exists behind explicit approval behavior before answers become avatar-queryable.
8. Tests cover route gating, quick-start behavior, processed CV readiness, interview-answer authoring, and answer-state defaults.

## Priority model

- `P0`: Required to deliver the onboarding rework's core user-facing behavior.
- `P1`: Required to deliver the structured enrichment model defined in the spec.
- `P2`: Follow-on functionality that completes the differentiated answer-capture workflow.

## P0 backlog

### P0.1 Schema and validation foundation

#### Outcome

The backend schema and validation layer support activation state, processed CV detection, and reusable answer metadata.

#### Repo surfaces

- `supabase/migrations/*.sql`
- `supabase/functions/_shared/validation/**`
- `supabase/tests/validation.test.ts`
- `apps/frontend/src/lib/profile.ts`
- `apps/frontend/src/lib/api.ts`

#### Tasks

1. Add `activation_completed_at` to `app_users`.
2. Add or standardize `document_kind` on `uploaded_documents` with at least `cv` and `supporting_document` values.
3. Extend `onboarding_answers` with spec-driven metadata such as `question_set_key`, `capture_method`, `visibility`, `review_state`, and approval/version fields.
4. Add or update validation schemas for any new function inputs and enum-like fields.
5. Update shared frontend types so the app can consume the new fields safely.

#### Acceptance criteria

- Migrations apply cleanly to a fresh database.
- Validation schemas accept the new activation, document-kind, and answer-metadata payloads.
- Frontend type surfaces can represent activation state, document kind, and answer metadata without `unknown` fallbacks.

#### Validation

- `pnpm test:edge`
- Narrow migration or schema validation checks as appropriate

### P0.2 Remove hard onboarding gate

#### Outcome

Authenticated, legally accepted users can access core app routes without being blocked by `onboarding_completed`.

#### Repo surfaces

- [apps/frontend/src/app/components/auth-guards.tsx](../../apps/frontend/src/app/components/auth-guards.tsx)
- [apps/frontend/src/app/App.tsx](../../apps/frontend/src/app/App.tsx)
- `apps/frontend/src/app/components/__tests__/auth-guards.test.tsx`
- other affected route tests under `apps/frontend/src/app/**/__tests__/`

#### Tasks

1. Replace the current app-wide onboarding redirect logic with auth and legal-acceptance-only gating for core routes.
2. Introduce activation-based routing behavior where needed, without reintroducing a global hard gate.
3. Preserve route protection for unauthenticated and legally unaccepted users.
4. Update or replace tests that currently assume `onboarding_completed` controls access.

#### Acceptance criteria

- `onboarding_completed` no longer causes redirects away from `/dashboard`, `/profile`, `/uploads`, `/knowledge`, or `/settings`.
- Legal acceptance still works as the prerequisite gate.
- Route tests reflect the new behavior.

#### Validation

- `pnpm test:frontend -- auth-guards`
- Additional focused route tests as needed

### P0.3 Repurpose `/onboarding` into quick start

#### Outcome

The legacy multi-step onboarding page becomes a lightweight activation surface centered on CV upload and skip.

#### Repo surfaces

- [apps/frontend/src/app/pages/onboarding.tsx](../../apps/frontend/src/app/pages/onboarding.tsx)
- `apps/frontend/src/app/i18n/locales/*/onboarding.json`
- [apps/frontend/src/lib/api.ts](../../apps/frontend/src/lib/api.ts)
- `supabase/functions/initialize-user-profile/index.ts`
- new or revised activation endpoint and tests under `supabase/functions/**`

#### Tasks

1. Replace the stepper UI and questionnaire submission behavior in `onboarding.tsx` with a quick-start experience.
2. Keep first-run initialization behavior that is still relevant, such as profile initialization and locale/timezone capture.
3. Implement explicit `skip for now` behavior that records activation completion.
4. Wire quick-start CV upload to the upload backend using `documentKind = 'cv'`.
5. Route the user to `/dashboard` after skip or upload initiation.
6. Update onboarding copy across locales to match the quick-start model.

#### Acceptance criteria

- `/onboarding` no longer presents a multi-step wizard or questionnaire.
- The page centers on upload CV and skip.
- Activation completion is recorded and prevents forced re-entry on later sessions.
- Locale files no longer describe the legacy wizard flow.

#### Validation

- `pnpm test:frontend -- onboarding`
- Focused manual route check for `/onboarding`

### P0.4 Dashboard re-entry and CV readiness UX

#### Outcome

The dashboard becomes the post-activation home and exposes re-entry into quick start plus clear CV-readiness messaging.

#### Repo surfaces

- [apps/frontend/src/app/pages/dashboard.tsx](../../apps/frontend/src/app/pages/dashboard.tsx)
- `apps/frontend/src/app/i18n/locales/*/dashboard.json`
- [apps/frontend/src/app/pages/chat-preview.tsx](../../apps/frontend/src/app/pages/chat-preview.tsx)
- [apps/frontend/src/app/pages/job-fit-preview.tsx](../../apps/frontend/src/app/pages/job-fit-preview.tsx)
- related page tests under `apps/frontend/src/app/pages/**/__tests__/`

#### Tasks

1. Add a dashboard quick action that re-opens `/onboarding`.
2. Add a dashboard entry point into the future `/interview-answers` route, even if initially hidden behind a partial implementation.
3. Replace onboarding-based AI/job-fit blocking copy with processed-CV-based messaging.
4. Ensure chat-preview and job-fit-preview show blocking empty states when no processed CV exists.
5. Add dashboard or preview-page status indicators so users understand why AI features are unavailable.

#### Acceptance criteria

- The dashboard quick actions section includes a quick-start re-entry action.
- Job-fit and chat surfaces do not tell the user to complete onboarding.
- The blocking condition is described in terms of processed CV readiness.

#### Validation

- `pnpm test:frontend -- dashboard`
- `pnpm test:frontend -- job-fit-preview`
- `pnpm test:frontend -- chat-preview`

## P1 backlog

### P1.1 Dedicated interview-answer route

#### Outcome

Interview answers move to a dedicated authoring route and stop being authored from generic profile surfaces.

#### Repo surfaces

- new `apps/frontend/src/app/pages/interview-answers.tsx`
- [apps/frontend/src/app/App.tsx](../../apps/frontend/src/app/App.tsx)
- [apps/frontend/src/app/pages/profile.tsx](../../apps/frontend/src/app/pages/profile.tsx)
- `apps/frontend/src/app/i18n/locales/*/*.json`
- new route tests under `apps/frontend/src/app/pages/**/__tests__/`

#### Tasks

1. Add the `/interview-answers` route and page shell.
2. Update app routing to include the new route behind auth and legal acceptance.
3. Remove direct interview-answer authoring from `/profile` and replace it with summary-plus-link behavior.
4. Add profile and dashboard entry points into the new route.
5. Introduce initial loading, empty, and saved-state UX for the route.

#### Acceptance criteria

- `/interview-answers` exists and is routable.
- The profile page no longer directly edits interview answers.
- The dashboard and profile both link to the dedicated route.

#### Validation

- `pnpm test:frontend -- profile`
- Focused route test for `/interview-answers`

### P1.2 Reusable question-set metadata and answer defaults

#### Outcome

The interview-answer system stores reusable question-set metadata and applies the required default states for manual authoring.

#### Repo surfaces

- shared question-set config under `apps/frontend/src/**` or a shared package
- `supabase/functions/**` related to answer persistence
- `supabase/functions/_shared/validation/**`
- `supabase/tests/validation.test.ts`
- `apps/frontend/src/app/pages/interview-answers.tsx`

#### Tasks

1. Create a versioned question-set catalog for the MVP job-search set.
2. Ensure persisted answers include `question_set_key` and `question_key`.
3. Implement manual form authoring with defaults: confirmed, avatar-queryable, capture method form.
4. Ensure users can override visibility after the default is applied.
5. Add frontend and backend validation around allowed values.

#### Acceptance criteria

- A manual answer persists with the required default review state, visibility, and capture method.
- Question-set metadata is present in storage and required by the application flow.
- The route can render questions from shared config rather than hardcoded page-only strings.

#### Validation

- `pnpm test:edge`
- Focused frontend tests for manual answer save behavior

### P1.3 CV-gated AI and job-fit behavior

#### Outcome

Processed CV readiness is consistently enforced across owner and public AI capabilities.

#### Repo surfaces

- [apps/frontend/src/app/pages/chat-preview.tsx](../../apps/frontend/src/app/pages/chat-preview.tsx)
- [apps/frontend/src/app/pages/job-fit-preview.tsx](../../apps/frontend/src/app/pages/job-fit-preview.tsx)
- public profile and payload surfaces under `apps/frontend/src/app/pages/public-profile.tsx`
- relevant Supabase functions such as `chat-persona`, `analyze-job-fit`, and `get-public-profile`
- backend tests under `supabase/tests/**`

#### Tasks

1. Standardize processed CV readiness checks in a shared backend/frontend abstraction where practical.
2. Ensure owner-facing chat and job-fit flows block on processed CV readiness.
3. Ensure public payloads expose capability flags based on processed CV readiness.
4. Update user-facing copy and empty states to align with processed-CV requirements.

#### Acceptance criteria

- A supporting document alone does not unlock AI chat or job-fit.
- A successfully processed CV does unlock those features, subject to other flags.
- Public profile capability flags align with backend readiness rules.

#### Validation

- Focused frontend tests for CV readiness empty states
- Focused edge tests for public capability resolution if implemented server-side

## P2 backlog

### P2.1 AI-assisted answer drafting and approval

#### Outcome

The dedicated interview-answer route supports AI-assisted drafting without allowing unapproved AI-generated answers to become active profile facts automatically.

#### Repo surfaces

- `apps/frontend/src/app/pages/interview-answers.tsx`
- new backend function(s) for draft generation and approval
- validation schemas and tests under `supabase/functions/_shared/validation/**` and `supabase/tests/**`

#### Tasks

1. Implement an AI-assisted mode that asks one question at a time and produces a draft answer.
2. Persist drafts with defaults: draft, private, capture method chat.
3. Add explicit approve, edit, reject, and visibility-change flows.
4. Ensure downstream avatar retrieval excludes draft/private answers by default.

#### Acceptance criteria

- AI-drafted answers are not avatar-queryable until explicitly approved.
- Users can review and edit AI-generated drafts before activation.
- Stored metadata distinguishes form-authored and chat-authored answers.

#### Validation

- `pnpm test:edge`
- Focused frontend tests for draft approval behavior

### P2.2 Versioning and stale-answer support

#### Outcome

The answer store supports future-safe versioning and answer freshness prompts.

#### Repo surfaces

- migrations affecting `onboarding_answers`
- interview-answer frontend surfaces
- backend persistence functions

#### Tasks

1. Introduce or finalize version tracking for answers.
2. Add freshness metadata that can support stale-answer prompts later.
3. Surface version-aware update semantics without breaking uniqueness assumptions.
4. Add low-friction review prompts where appropriate after the base system is stable.

#### Acceptance criteria

- Answers can be updated without losing the ability to reason about freshness.
- The system can identify older answers for future prompt logic.

#### Validation

- Focused migration and persistence tests

## Cross-cutting tasks

### Documentation

1. Keep [docs/plans/onboarding-prd.md](../plans/onboarding-prd.md), [docs/plans/onboarding-spec.md](../plans/onboarding-spec.md), and this implementation plan aligned as decisions change.
2. Update user-facing or operator-facing docs only when behavior actually ships.
3. Update [CHANGELOG.md](../../CHANGELOG.md) when functional product changes land, not merely when planning docs are drafted.

### Testing

1. Prefer narrow tests per phase over one large end-to-end jump.
2. Add or update frontend tests for route gating, page states, and primary calls to action.
3. Add or update edge validation tests for new payload shapes and enum values.
4. Add end-to-end coverage once the P0 and P1 core flows stabilize.

## Recommended execution order

1. P0.1 Schema and validation foundation
2. P0.2 Remove hard onboarding gate
3. P0.3 Repurpose `/onboarding` into quick start
4. P0.4 Dashboard re-entry and CV readiness UX
5. P1.1 Dedicated interview-answer route
6. P1.2 Reusable question-set metadata and answer defaults
7. P1.3 CV-gated AI and job-fit behavior
8. P2.1 AI-assisted answer drafting and approval
9. P2.2 Versioning and stale-answer support

## Risks and watchpoints

- Reusing `/onboarding` reduces routing churn but increases the chance of leftover wizard assumptions in copy, tests, and redirects.
- Leaving `onboarding_completed` in place temporarily is practical, but any lingering route dependency on it will violate the product requirement.
- CV readiness can drift if frontend and backend define it differently; keep the rule centralized where possible.
- Reusing `onboarding_answers` is efficient, but the name can mislead future work unless the metadata model is applied consistently.
- The profile page currently reads onboarding-derived data, so ownership boundaries between summary and authoring must be enforced carefully.

## Exit criteria for implementation start

Implementation can begin immediately because the product decisions that would block execution are already fixed in the PRD and spec. The first coding slice should start with schema and route-gating work, because those decisions control every later UI change.