# Onboarding Rework Specification

Status: draft

Source of truth: derived from `docs/plans/onboarding-prd.md`

## 1. Purpose

This document translates the onboarding rework PRD into an implementation-oriented specification.

It defines:

- route and access behavior
- feature-readiness rules
- quick-start UX behavior
- interview-answer authoring behavior
- required data model changes
- API and frontend responsibilities
- migration and acceptance criteria

This spec is scoped to the onboarding rework only. It does not redefine the broader Profiley product architecture outside the surfaces touched by this change.

## 2. Goals

- Remove the hard onboarding gate that blocks core app access.
- Repurpose `/onboarding` into a lightweight quick-start route.
- Make CV upload the primary first-run action with an explicit skip path.
- Land the user on the dashboard after quick start.
- Make the quick-start flow re-openable from dashboard quick actions.
- Move interview-style answer authoring into a dedicated route.
- Ensure AI chat and job-fit features require at least one successfully processed CV.
- Support reusable question sets in v1.
- Preserve user control over answer review and visibility.

## 3. Non-Goals

- Rebuilding the full dashboard information architecture.
- Shipping voice input in v1.
- Replacing the entire profile editing experience.
- Generalizing the system to non-job-search domains in v1 UX.
- Removing legacy onboarding data immediately from the database.

## 4. Definitions

- Quick start: the repurposed `/onboarding` experience used for initial activation and later re-entry.
- Activation: the minimum first-run flow needed to get a user into the app.
- Processed CV: a user document marked as a CV whose processing lifecycle has completed successfully.
- Interview answers: structured answers to reusable question sets that improve Profiley's AI behavior.
- Dedicated authoring route: the only UI where interview answers can be created or edited.
- Avatar-queryable: visible to internal AI retrieval and generation, but not published on the public profile.

## 5. Route Map

| Route | Access | Purpose |
|---|---|---|
| `/onboarding` | authenticated + legal acceptance | quick-start flow for first-run activation and later re-entry |
| `/dashboard` | authenticated + legal acceptance | default post-activation destination and home for quick actions |
| `/profile` | authenticated + legal acceptance | profile summary and non-interview profile editing |
| `/interview-answers` | authenticated + legal acceptance | only authoring surface for interview answers |
| `/chat-preview` | authenticated + legal acceptance | owner preview of AI chat; shows blocking empty state until processed CV readiness is met |
| `/job-fit-preview` | authenticated + legal acceptance | owner preview of job-fit analysis; shows blocking empty state until processed CV readiness is met |

## 6. Access Control and Gating

### 6.1 App access

The application must no longer redirect users away from core authenticated routes based on `onboarding_completed`.

Core access after authentication and legal acceptance:

- `/dashboard`
- `/profile`
- `/uploads`
- `/knowledge`
- `/settings`
- `/onboarding`
- `/interview-answers`

`onboarding_completed` must no longer drive route access.

### 6.2 First-login routing

The system must introduce `activation_completed_at` on `app_users`.

Rules:

- If user is authenticated and has not accepted the current legal versions, route to legal acceptance first.
- If user is authenticated, legally accepted, and `activation_completed_at` is null, route to `/onboarding`.
- If user is authenticated, legally accepted, and `activation_completed_at` is set, route to `/dashboard` or the requested redirect target.

### 6.3 Feature-specific readiness

The following features require a processed CV:

- owner chat preview
- owner job-fit preview
- public AI chat capability
- public job-fit capability

Processed CV readiness is defined as:

- there exists at least one `uploaded_documents` row for the user where `document_kind = 'cv'`
- `processing_status = 'completed'`
- the document is not deleted or otherwise excluded from use

If readiness is missing:

- owner routes remain accessible only if product chooses empty-state access; for MVP, they should show a blocking empty state and CTA to upload a CV rather than redirect to another route
- public capabilities must be disabled or hidden on the public profile payload

## 7. Quick-Start Specification

### 7.1 Route reuse

The existing `/onboarding` route and `onboarding.tsx` page are repurposed.

The legacy multi-step wizard behavior must be removed from the primary UX.

### 7.2 Primary user actions

The quick-start screen must support:

- upload CV
- skip for now
- continue to dashboard after a successful or skipped flow

### 7.3 Screen structure

The quick-start screen should contain:

- short value-oriented heading
- explanation of what CV upload unlocks
- primary CTA for CV upload
- secondary CTA for skip
- optional note that users can return later from dashboard quick actions

The screen must not contain:

- a multi-step progress indicator
- a long questionnaire
- mandatory interview-style prompts

### 7.4 Completion behavior

`activation_completed_at` is set when the user:

- explicitly skips quick start, or
- completes at least one CV upload initiation flow and is sent onward, even if processing continues asynchronously

After activation completion:

- route to `/dashboard`
- do not automatically force the user back to `/onboarding` on future sessions

### 7.5 Re-entry behavior

The dashboard quick actions section must include an action that re-opens `/onboarding`.

Re-entering quick start must:

- never reset user data
- never clear `activation_completed_at`
- behave as an optional helper flow for uploading or reviewing core setup actions

## 8. Interview Answers Specification

### 8.1 Dedicated authoring route

Introduce `/interview-answers` as the dedicated authoring route.

This route is the only UI allowed to create or edit interview answers.

The profile page may:

- summarize completion state
- display read-only highlights
- link to `/interview-answers`

The profile page must not directly edit interview answers.

### 8.2 Entry points

Users must be able to reach `/interview-answers` from:

- dashboard quick actions or checklist
- profile page section for AI profile improvement

### 8.3 Question sets

Question-set metadata is required in v1.

For MVP:

- the question-set catalog may live in versioned application config rather than a database table
- persisted answers must store `question_set_key`
- persisted answers must store `question_key`

This ensures the storage format is reusable across future domains even if the first shipping question set is job-search-specific.

### 8.4 Authoring modes

The route must support two answer-capture modes:

- manual form entry
- AI-assisted conversational drafting

### 8.5 Manual answer defaults

Manual form answers must save with these defaults:

- `review_state = 'confirmed'`
- `visibility = 'avatar_queryable'`
- `capture_method = 'form'`

### 8.6 AI-assisted answer defaults

AI-extracted chat answers must save with these defaults until explicit approval:

- `review_state = 'draft'`
- `visibility = 'private'`
- `capture_method = 'chat'`

The user must explicitly approve or edit the answer before it becomes avatar-queryable or public.

### 8.7 Answer review behavior

For AI-assisted capture:

- the AI asks one question at a time
- the AI may ask follow-up questions to improve specificity
- the AI produces a draft answer
- the user can approve, edit, reject, or leave the answer private

Only confirmed or explicitly approved answers may be used by downstream avatar features.

## 9. Data Model

### 9.1 `app_users`

Add:

- `activation_completed_at timestamptz null`

Retain:

- `onboarding_completed boolean`

Rules:

- `onboarding_completed` becomes legacy compatibility only
- `activation_completed_at` drives quick-start completion state
- route access must not depend on `onboarding_completed`

### 9.2 `uploaded_documents`

Add or standardize:

- `document_kind text` with MVP-supported values: `cv`, `supporting_document`

Rules:

- quick-start CV upload must create or finalize documents with `document_kind = 'cv'`
- processed CV readiness checks must use `document_kind = 'cv'`

### 9.3 `onboarding_answers`

Keep the existing table for MVP, but extend it into the reusable answer store.

Add fields as needed to support:

- `question_set_key`
- `capture_method`
- `visibility`
- `review_state`
- `answer_summary`
- `approved_at`
- `version`
- `stale_after_at` or equivalent future-compatible freshness metadata

Recommended uniqueness constraint for v1 behavior:

- unique on `(user_id, question_set_key, question_key)` for the current active version

### 9.4 Question-set catalog

The question-set catalog for MVP should live in shared application config and include:

- `question_set_key`
- display title
- description
- ordered question list
- question prompt text
- optional helper text
- expected answer type
- default visibility recommendation

Persisted answers must reference this catalog by key rather than duplicating catalog metadata.

## 10. API and Frontend Responsibilities

### 10.1 Existing functions retained

- `initialize-user-profile`
- `create-upload-url`
- `finalize-upload`
- document-processing functions and status polling

### 10.2 New or revised contracts

#### `complete-activation`

Purpose:

- set `activation_completed_at`
- record completion source such as `skip` or `cv_upload`

Input:

- `completionSource: 'skip' | 'cv_upload'`

#### `create-upload-url` and `finalize-upload`

Revision:

- must support `documentKind`
- quick-start flow must pass `documentKind = 'cv'`

#### `upsert-profile-answer`

Purpose:

- create or update a manual or reviewed answer in `onboarding_answers`

Input:

- `questionSetKey`
- `questionKey`
- `answerText`
- optional `answerSummary`
- `captureMethod`
- `visibility`
- `reviewState`

#### `generate-profile-answer-draft`

Purpose:

- run the AI-assisted question flow and produce a draft answer

Output:

- draft answer text
- optional summary
- provenance metadata indicating AI-drafted content

#### `approve-profile-answer-draft`

Purpose:

- convert a draft/private AI answer into a confirmed answer with user-selected visibility

### 10.3 Frontend guard changes

The frontend must replace the current onboarding gate with:

- auth guard
- legal acceptance guard
- feature-specific readiness checks for CV-required features

There must not be a global app-access redirect based on `onboarding_completed`.

## 11. UX Requirements by Surface

### 11.1 Dashboard

Must include:

- quick action to re-open quick start
- quick action or checklist item to open interview answers
- status messaging when AI features are unavailable because no processed CV exists

### 11.2 Profile

Must include:

- section advertising AI profile improvement or interview answers
- link into the dedicated authoring route
- optional read-only summary of answer completion

Must not include:

- direct editing controls for interview answers

### 11.3 Chat preview and job-fit preview

If no processed CV exists, show:

- a blocking empty state
- a message explaining a processed CV is required
- CTA to upload CV or reopen quick start

## 12. Migration Plan

### Phase 1

- add `activation_completed_at`
- remove route gating by `onboarding_completed`
- repurpose `/onboarding` into quick start
- add dashboard quick action for quick start
- make CV upload path use `document_kind = 'cv'`

### Phase 2

- add `/interview-answers`
- extend `onboarding_answers` metadata
- add question-set catalog config
- add manual answer authoring flow

### Phase 3

- add AI-assisted drafting flow
- add approval workflow
- add versioning and stale-answer prompting support

## 13. Acceptance Criteria

### 13.1 Access and routing

- A newly authenticated user with accepted legal docs and `activation_completed_at = null` is sent to `/onboarding`.
- A newly authenticated user can skip quick start and reach `/dashboard` without completing a questionnaire.
- A returning user with `activation_completed_at` set is not forced through quick start.
- No protected route is blocked by `onboarding_completed` alone.

### 13.2 Quick start

- `/onboarding` presents CV upload and skip as the main actions.
- Completing or skipping quick start sets `activation_completed_at`.
- Dashboard quick actions can reopen `/onboarding` after activation is complete.

### 13.3 CV readiness

- AI chat and job-fit preview are unavailable until at least one CV has `processing_status = 'completed'`.
- Uploading a non-CV supporting document does not satisfy CV readiness.

### 13.4 Interview answers

- `/interview-answers` is the only route where interview answers can be edited.
- Manual answers save as confirmed and avatar-queryable by default.
- AI-generated drafts remain private and draft-state until the user explicitly approves them.
- Persisted answers include `question_set_key` in v1.

### 13.5 Backward compatibility

- Legacy `onboarding_completed` data remains readable.
- New routing behavior does not depend on legacy onboarding completion values.

## 14. Out of Scope for V1

- voice input
- non-job-search question-set UX
- replacing the answer store table name
- deep public-profile publishing rules beyond CV-based capability gating
- full stale-answer automation beyond storing compatible metadata