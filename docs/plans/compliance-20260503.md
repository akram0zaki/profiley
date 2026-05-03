# Profiley Compliance Implementation Plan

Last updated: 2026-05-03

## Execution status

- `P0.1 Legal copy accuracy reset`: Completed
- `P0.2 Acceptance capture and versioned legal acknowledgements`: Completed
- `P0.3 Self-service deletion request with 30-day cancellation window`: Completed
- `P0.4 Retention enforcement for app-controlled data`: Completed
- `P0.5 DSAR minimum operational capability`: Completed
- `P0.6 GDPR accountability pack as docs-as-code`: Completed
- `P1.1 AI transparency UX at point of use`: Completed
- `P1.2 Human oversight controls for recruiter-facing job-fit`: Completed
- `P1.3 AI governance baseline documents`: Completed
- `P1.4 Vendor and transfer representation cleanup`: Completed
- `P1.5 Data export implementation`: Completed
- `P2 hardening items`: Completed

## Purpose

This plan turns the gaps identified in [docs/audits/compliance.md](../audits/compliance.md) into an implementation backlog that an AI agent can execute in the workspace.

This is an implementation plan, not legal advice. It is designed to improve factual accuracy, privacy controls, operational readiness, and AI governance in the codebase and repo documentation.

## Fixed decisions from the operator

- Recruiter-facing job-fit analysis remains in scope and should be treated as requiring stronger employment-use AI governance preparation, not removed.
- Account deletion should be implemented as a self-service request flow in Settings.
- Deletion is not immediate. It is scheduled for 30 days after request submission.
- Users must be able to cancel the deletion request from Settings during the 30-day grace period.
- All compliance artifacts should live in the repo as docs-as-code.
- Profiley is operated by a Dutch individual, not a company.
- The legal copy must not claim signed custom DPAs or other vendor agreements that do not exist.

## Operating assumptions

- The goal of this plan is to make Profiley materially more compliant and audit-ready, not to claim formal certification or guaranteed legal compliance.
- Where a gap cannot be solved purely in code, the plan creates an in-repo artifact or operator runbook and explicitly marks the manual step.
- Every functional change must include tests, per [AGENTS.md](../../AGENTS.md).
- Legal copy must be aligned to what is actually implemented and supportable.
- Stronger governance and product restrictions are preferable to unsupported legal claims.

## Definition of done

This plan is complete when all of the following are true:

1. The product no longer makes unsupported privacy, deletion, processor, or transfer claims.
2. Terms and privacy acceptance are captured, timestamped, versioned, and test-covered.
3. Users can request deletion, see the scheduled deletion date, cancel within 30 days, and are fully purged by an automated backend job after the grace period.
4. Retention rules for application-controlled data are technically enforced and documented.
5. DSAR handling has both repo runbooks and enough product/backend tooling to export and erase user data.
6. GDPR accountability documents exist in the repo and reflect the actual implementation.
7. Recruiter-facing AI features show explicit transparency notices and stronger human-oversight guidance.
8. AI governance documents, operational runbooks, and feature controls exist in the repo for the current intended use.

## Priority model

- `P0`: Must ship before Profiley can credibly improve its compliance posture.
- `P1`: Should follow immediately after P0 to make the system operationally defensible.
- `P2`: Valuable hardening and scale-up work after the critical compliance path is in place.

## P0 backlog

### P0.1 Legal copy accuracy reset

#### Outcome

Legal pages must only say what Profiley can prove and support.

#### Repo surfaces

- [apps/frontend/src/app/i18n/locales/en/legal.json](../../apps/frontend/src/app/i18n/locales/en/legal.json)
- [apps/frontend/src/app/i18n/locales/nl/legal.json](../../apps/frontend/src/app/i18n/locales/nl/legal.json)
- [apps/frontend/src/app/i18n/locales/ar/legal.json](../../apps/frontend/src/app/i18n/locales/ar/legal.json)
- [apps/frontend/src/app/pages/privacy.tsx](../../apps/frontend/src/app/pages/privacy.tsx)
- [apps/frontend/src/app/pages/terms.tsx](../../apps/frontend/src/app/pages/terms.tsx)
- [apps/frontend/src/app/pages/cookies.tsx](../../apps/frontend/src/app/pages/cookies.tsx)

#### Tasks

1. Remove the false statement that users can already delete their account from Settings.
2. Replace it with the actual future-state deletion flow once P0.3 ships.
3. Remove or rewrite claims that Profiley has signed written DPAs or SCC-backed agreements if those cannot be substantiated.
4. Replace unsupported processor language with factual wording such as:
   - which vendors are used
   - what categories of data they receive
   - links to their public privacy policies
   - which statements are based on vendor public terms rather than custom contracts
5. Review all transfer-mechanism language and avoid hard claims that require signed addenda unless the operator can actually evidence them.
6. Align retention claims to what P0.4 will actually enforce.
7. Add an explicit notice that recruiter-facing AI outputs are informational assistance and do not replace human hiring judgment.

#### Acceptance criteria

- No legal page claims self-service deletion before the feature exists.
- No legal page claims signed vendor DPAs or SCCs unless the operator later adds evidence.
- Retention, deletion, and rights text matches real product behavior.
- All three supported locales remain aligned.

#### Validation

- Frontend locale tests for changed strings where useful.
- Manual route check for `/legal/privacy`, `/legal/terms`, `/legal/cookies`.

### P0.2 Acceptance capture and versioned legal acknowledgements

#### Outcome

Terms and privacy acceptance become auditable events, not unused schema fields.

#### Repo surfaces

- [supabase/migrations/0002_app_users.sql](../../supabase/migrations/0002_app_users.sql)
- [supabase/functions/initialize-user-profile/index.ts](../../supabase/functions/initialize-user-profile/index.ts)
- [supabase/functions/complete-onboarding/index.ts](../../supabase/functions/complete-onboarding/index.ts)
- [apps/frontend/src/app/pages/onboarding.tsx](../../apps/frontend/src/app/pages/onboarding.tsx)
- [apps/frontend/src/lib/api.ts](../../apps/frontend/src/lib/api.ts)
- New frontend tests under `apps/frontend/src/**/__tests__/`
- New edge tests under `supabase/tests/`

#### Data model changes

Create a new migration that adds at minimum:

- `terms_version text`
- `privacy_version text`
- `terms_acceptance_source text`
- `privacy_acceptance_source text`
- optional `legal_acceptance_ip_hash text` if the operator wants an abuse/audit trail without storing raw IPs

Do not rely only on timestamp fields.

#### Tasks

1. Introduce a single source of truth for the currently published legal versions.
2. Add an onboarding or post-auth step that requires explicit acknowledgement before protected app use.
3. Persist `terms_accepted_at`, `privacy_accepted_at`, version identifiers, and acceptance source.
4. Prevent duplicate rewrites on every session refresh.
5. Add a re-acceptance path for future material legal changes.
6. Add tests covering:
   - first acceptance persists correctly
   - repeated visits do not overwrite history unintentionally
   - missing acceptance blocks protected flows until accepted

#### Acceptance criteria

- Acceptance is captured exactly once per version unless a new version requires re-acceptance.
- Stored data is sufficient for audit and support.
- App behavior is deterministic across refreshes and auth callbacks.

#### Validation

- Targeted frontend tests for gating behavior.
- Targeted edge tests for persistence and schema validation.

### P0.3 Self-service deletion request with 30-day cancellation window

#### Outcome

Users can request account deletion from Settings, see the scheduled deletion date, cancel before execution, and are automatically purged after 30 days.

#### Repo surfaces

- [apps/frontend/src/app/pages/settings.tsx](../../apps/frontend/src/app/pages/settings.tsx)
- [apps/frontend/src/app/i18n/locales/en/legal.json](../../apps/frontend/src/app/i18n/locales/en/legal.json)
- [apps/frontend/src/app/i18n/locales/nl/legal.json](../../apps/frontend/src/app/i18n/locales/nl/legal.json)
- [apps/frontend/src/app/i18n/locales/ar/legal.json](../../apps/frontend/src/app/i18n/locales/ar/legal.json)
- [apps/frontend/src/lib/api.ts](../../apps/frontend/src/lib/api.ts)
- New edge functions:
  - `supabase/functions/request-account-deletion/index.ts`
  - `supabase/functions/cancel-account-deletion/index.ts`
  - `supabase/functions/process-account-deletions/index.ts`
- New migrations under `supabase/migrations/`
- [supabase/config.toml](../../supabase/config.toml)
- [docs/concept/profiley-init-guide.md](../concept/profiley-init-guide.md)

#### Data model changes

Add a migration introducing fields such as:

- `deletion_requested_at timestamptz`
- `deletion_scheduled_for timestamptz`
- `deletion_cancelled_at timestamptz`
- `deletion_reason text` or `deletion_request_source text`
- optional `account_status text` with constrained values if needed for cleaner gating

#### Tasks

1. Add a Settings danger-zone section for deletion request and cancellation.
2. Require re-auth confirmation or a deliberate confirmation step before accepting the request.
3. On request:
   - mark the account for deletion
   - compute `scheduled_for = requested_at + 30 days`
   - optionally disable login-sensitive actions or show a prominent pending-deletion banner
4. On cancel:
   - clear or supersede pending deletion state
   - restore normal account behavior
5. Add a scheduled background processor that permanently deletes accounts once due.
6. Use the existing cascade via `auth.users` deletion as the final purge path where appropriate.
7. Document whether any records are intentionally retained beyond deletion and why.
8. Update legal copy and settings copy to describe the grace period accurately.

#### Product rules

- During the 30-day grace period, the account remains recoverable by the user via Settings.
- The UI must always show the scheduled deletion date once requested.
- Public profile visibility should be turned off immediately when deletion is requested, unless the operator explicitly chooses otherwise.

#### Acceptance criteria

- A user can request deletion from Settings.
- A user can cancel deletion before the scheduled date.
- The purge job deletes due accounts without manual SQL.
- Related rows are removed or handled consistently through existing cascade rules.
- The feature is covered by frontend and edge tests.

#### Validation

- Frontend tests for danger-zone states.
- Edge tests for request, cancel, and due-processing logic.
- Manual test on a dev account from request to cancellation.

### P0.4 Retention enforcement for app-controlled data

#### Outcome

Retention is enforced by code for data Profiley controls directly.

#### Repo surfaces

- [supabase/migrations/0011_job_fit_analyses.sql](../../supabase/migrations/0011_job_fit_analyses.sql)
- [supabase/migrations/0013_moderation_and_analytics.sql](../../supabase/migrations/0013_moderation_and_analytics.sql)
- [supabase/migrations/0017_ai_call_logs.sql](../../supabase/migrations/0017_ai_call_logs.sql)
- `supabase/migrations/<new_retention_migration>.sql`
- New scheduled edge function or SQL job for purging expired rows
- [docs/concept/profiley-init-guide.md](../concept/profiley-init-guide.md)
- [apps/frontend/src/app/i18n/locales/*/legal.json](../../apps/frontend/src/app/i18n/locales/en/legal.json)

#### Tasks

1. Pick enforceable retention periods for tables Profiley controls directly.
2. Create a retention policy matrix in repo docs before implementing deletion logic.
3. Add purge logic for at least:
   - `ai_call_logs`
   - `recruiter_visits`
   - `recruiter_events`
   - `moderation_events`
   - `job_fit_analyses` if the product does not require indefinite retention
4. Store retention settings in a controllable runtime/config surface if they may change later.
5. Add indexes that keep purge jobs efficient.
6. If backup retention cannot be enforced from the repo, remove exact backup-duration claims from legal copy or move them into operator-only documentation with a verification step.
7. Document which data is excluded from automatic purge and why.

#### Acceptance criteria

- Each retained table has a documented retention rule.
- Automatic purge runs without manual intervention.
- Legal text matches the actual purge behavior.
- No policy claims remain for data classes without enforcement or operator verification.

#### Validation

- Edge or SQL tests for purge selection logic.
- Manual verification using seeded expired rows in dev.

### P0.5 DSAR minimum operational capability

#### Outcome

Profiley can actually receive, authenticate, fulfill, and log privacy-rights requests.

#### Repo surfaces

- New docs under `docs/compliance/` or `docs/ops/`
- [apps/frontend/src/app/i18n/locales/*/legal.json](../../apps/frontend/src/app/i18n/locales/en/legal.json)
- Optional new edge functions for export or rights-request intake
- [docs/concept/profiley-init-guide.md](../concept/profiley-init-guide.md)

#### Required docs to create

- `docs/compliance/dsar-runbook.md`
- `docs/compliance/data-export-spec.md`
- `docs/compliance/erasure-runbook.md`
- `docs/compliance/privacy-requests-log-template.md`

#### Tasks

1. Write a DSAR runbook for access, export, rectification, restriction, objection, and erasure.
2. Define identity-verification rules appropriate for an individual Dutch operator.
3. Define response SLAs and exception handling.
4. Add a machine-readable export specification listing which tables and fields belong in a user export.
5. Decide whether the first implementation is manual operator export or productized export.
6. If feasible within P0, implement a basic self-service export request endpoint and downloadable package flow.
7. If self-service export is deferred, document the manual script/query procedure clearly enough for an agent or operator to run safely.

#### Acceptance criteria

- A future agent can follow the runbook to fulfill a DSAR without inventing process.
- Export scope is documented table-by-table.
- Legal copy points to a real process.

#### Validation

- Peer review of runbook completeness.
- If an export endpoint is built, add edge tests for auth and scope.

### P0.6 GDPR accountability pack as docs-as-code

#### Outcome

The repo contains the minimum accountability artifacts needed to explain the system.

#### Repo surfaces

- New docs under `docs/compliance/`

#### Required docs to create

- `docs/compliance/ropa.md`
- `docs/compliance/lawful-bases.md`
- `docs/compliance/dpia.md`
- `docs/compliance/security-measures.md`
- `docs/compliance/incident-response.md`
- `docs/compliance/vendor-register.md`

#### Tasks

1. Create a Record of Processing Activities covering each core data flow.
2. Document lawful basis per processing activity and ensure consistency with public privacy text.
3. Draft a DPIA focused on uploaded documents, recruiter interactions, profiling, and AI-supported outputs.
4. Document actual technical and organizational security measures already implemented in the repo.
5. Create an incident-response runbook with triage, containment, notification decision points, and postmortem steps.
6. Build a vendor register that clearly distinguishes:
   - vendor used
   - purpose
   - categories of data processed
   - public privacy-policy link
   - whether Profiley has only accepted standard public terms or has separate signed terms
7. Make sure all docs explicitly reflect the operator as an individual in the Netherlands.

#### Acceptance criteria

- The accountability docs are internally consistent.
- The docs do not overclaim contractual safeguards.
- The public privacy policy and internal docs describe the same processing reality.

#### Validation

- Cross-check consistency between `legal.json` and compliance docs.

## P0 execution checklist for AI agent

This section converts the P0 backlog into a strict execution sequence another AI agent can follow without re-planning the work.

### Global execution rules

1. Execute `P0.1` through `P0.6` in order. Do not start a later P0 item until the current one has passed its validation gate.
2. Keep implementation truthful. If the code or operational evidence does not exist, change the policy text or add the missing implementation. Do not leave aspirational claims in place.
3. For every functional change, add or update tests.
4. For every meaningful docs or behavior change, update [CHANGELOG.md](../../CHANGELOG.md).
5. Prefer small, reviewable slices inside each P0 item, but complete the item end-to-end before moving on.
6. After each substantive edit slice, run the narrowest available validation before making adjacent edits.
7. If a manual operator step remains, document it in the repo before closing the item.

### Pre-flight checklist

- Read [docs/audits/compliance.md](../audits/compliance.md) in full.
- Re-read the current legal copy in all supported locales.
- Re-read the current Settings, onboarding, auth, and relevant edge-function surfaces before editing.
- Confirm whether there are uncommitted user changes in files you plan to touch and preserve them.
- Create a temporary working note in session memory if needed, but keep the repo plan as the source of truth.

### P0.1 execution checklist: legal copy accuracy reset

#### Goal

Make public legal text factually accurate before adding new compliance features.

#### Step-by-step

1. Inventory current legal claims.
   Deliverable:
   - A short working list of every inaccurate or unverified statement in the legal locale files.
2. Classify each claim as one of:
   - already implemented
   - planned but not implemented
   - unverifiable from repo or operator facts
   - must be removed entirely
3. Edit English legal copy first in [apps/frontend/src/app/i18n/locales/en/legal.json](../../apps/frontend/src/app/i18n/locales/en/legal.json).
   Required changes:
   - remove the false self-service deletion claim
   - replace unsupported DPA/SCC language with factual vendor wording
   - avoid implying signed custom agreements with Supabase or OpenAI
   - align retention wording to what will be implementable in P0.4
   - add clearer recruiter-facing AI assistance language
4. Mirror the same semantic changes into Dutch and Arabic locale files.
5. Verify the route components still render those strings correctly.
6. Add or update any narrow frontend tests if locale-dependent behavior is covered anywhere.
7. Perform a manual route-level sanity check for `/legal/privacy`, `/legal/terms`, and `/legal/cookies`.
8. Update [CHANGELOG.md](../../CHANGELOG.md).

#### Validation gate

- No public legal page claims a feature or contract that does not exist.
- Locale JSON remains valid.
- Any touched tests pass.

#### Close only when

- The legal text is safe to ship even if P0.2 through P0.5 are not yet finished.

### P0.2 execution checklist: acceptance capture and versioned acknowledgements

#### Goal

Capture legal acceptance as versioned, auditable data and gate protected product use on acceptance.

#### Step-by-step

1. Decide the versioning scheme.
   Recommendation:
   - use explicit string versions such as `2026-05-03` or `v2026-05-03` for both terms and privacy.
2. Add a migration for acceptance metadata.
   Minimum fields:
   - `terms_version`
   - `privacy_version`
   - `terms_acceptance_source`
   - `privacy_acceptance_source`
   - optional acceptance audit metadata if justified
3. Add a single source of truth for current legal versions.
   Preferred surfaces:
   - a shared frontend config module and a matching backend constant source, or
   - a runtime table if versioning must be operator-editable.
4. Find the lightest trustworthy gating point.
   Preferred order:
   - post-auth protected-app gate
   - onboarding completion gate
   - dedicated legal acceptance screen if needed
5. Implement backend persistence.
   Requirements:
   - store timestamps and versions together
   - do not rewrite acceptance on every login
   - support re-acceptance when the published version changes
6. Implement frontend gating and acceptance UX.
   Requirements:
   - protected app surfaces are blocked until required acceptance exists
   - user can read terms/privacy before accepting
   - app resumes normally after acceptance
7. Add tests.
   Minimum scenarios:
   - first-time acceptance persists correctly
   - repeated session refresh does not overwrite acceptance
   - version bump causes re-acceptance requirement
   - missing acceptance blocks protected flow
8. Update docs if any operator step is needed to publish a new legal version.
9. Update [CHANGELOG.md](../../CHANGELOG.md).

#### Validation gate

- Migration is sound.
- Gating behavior is deterministic.
- Tests cover first accept, repeat visit, and version-change behavior.

#### Close only when

- Acceptance is no longer just dead schema and can be audited per version.

### P0.3 execution checklist: self-service deletion request with 30-day cancellation

#### Goal

Ship a real user-facing deletion-request flow with automated deferred purge.

#### Step-by-step

1. Model the deletion lifecycle.
   Required states:
   - no request pending
   - deletion requested and scheduled
   - deletion cancelled
   - deletion executed
2. Add a migration for deletion-request state on the user record.
3. Decide whether `public_visibility` is forcibly turned off at request time.
   Default for this plan:
   - yes, immediately disable public exposure when deletion is requested.
4. Implement `request-account-deletion` edge function.
   Requirements:
   - authenticated user only
   - strong confirmation input or recent-auth check
   - set requested timestamp and scheduled-for timestamp
   - make repeated requests idempotent or clearly rejected
5. Implement `cancel-account-deletion` edge function.
   Requirements:
   - authenticated user only
   - only works before scheduled execution
   - clears or supersedes pending deletion state cleanly
6. Implement `process-account-deletions` edge function.
   Requirements:
   - runs from a trusted scheduled path
   - selects due accounts only
   - deletes the `auth.users` row so existing cascades run
   - handles logging and failures safely
7. Wire scheduled execution.
   Preferred options:
   - `pg_cron` plus `pg_net` invoking the edge function, or
   - a direct SQL-based processor if that is already the repo pattern
8. Update Settings UI.
   Requirements:
   - danger zone section
   - request action
   - pending state banner
   - visible scheduled deletion date
   - cancel action
9. Update legal and settings copy to match the exact grace-period behavior.
10. Add tests.
   Minimum scenarios:
   - request succeeds once
   - cancel works before due date
   - due processor deletes eligible account
   - public visibility is disabled on request if implemented
11. Document the operator recovery or incident procedure if deletion processing fails.
12. Update [CHANGELOG.md](../../CHANGELOG.md).

#### Validation gate

- A dev user can request deletion, see the date, cancel it, and remain usable.
- Due accounts are purged automatically without manual SQL.
- Edge tests cover request, cancel, and due-processing logic.

#### Close only when

- The settings-page deletion flow actually exists and the legal copy can safely refer to it.

### P0.4 execution checklist: retention enforcement

#### Goal

Move retention from policy promises into actual deletion logic for app-controlled data.

#### Step-by-step

1. Create a retention matrix doc before writing purge code.
   Include at minimum:
   - table name
   - data category
   - retention period
   - purge mechanism
   - justification
   - exclusions
2. Choose retention periods that the product can truly enforce.
   Do not copy existing legal text forward if it is not implementable.
3. Add any supporting migration fields or indexes needed for efficient purging.
4. Implement purge logic for:
   - `ai_call_logs`
   - `recruiter_visits`
   - `recruiter_events`
   - `moderation_events`
   - `job_fit_analyses` if retained only for a bounded period
5. Decide whether purge rules are hardcoded or runtime-configurable.
   Recommendation:
   - use runtime settings only if there is a real operational need; otherwise hardcode and document.
6. Add a scheduler for purge execution using the same trusted scheduling pattern already used elsewhere in the repo.
7. Update legal copy so it matches the retention matrix exactly.
8. Add tests for expired-row selection and non-expired-row preservation.
9. Document anything the repo cannot enforce directly, especially backups.
10. Update [CHANGELOG.md](../../CHANGELOG.md).

#### Validation gate

- Expired rows are purged in dev using seeded fixtures.
- Non-expired rows remain intact.
- Legal text no longer promises unenforced durations.

#### Close only when

- Retention periods in public policy are backed by code or explicitly removed from policy.

### P0.5 execution checklist: DSAR minimum operational capability

#### Goal

Create enough process and tooling that a privacy request can actually be fulfilled.

#### Step-by-step

1. Create `docs/compliance/` if it does not already exist.
2. Write `docs/compliance/dsar-runbook.md`.
   Must cover:
   - request intake
   - identity verification
   - request classification
   - timeline handling
   - response templates
   - refusal or extension conditions
3. Write `docs/compliance/data-export-spec.md`.
   Must cover:
   - exact tables in scope
   - fields to include or exclude
   - export format
   - auth and delivery constraints
4. Write `docs/compliance/erasure-runbook.md`.
   Must cover:
   - deletion-request flow
   - immediate manual exceptions
   - what remains after deletion, if anything
5. Write `docs/compliance/privacy-requests-log-template.md`.
6. Decide whether to implement self-service export now or defer to P1.5.
   Decision rule:
   - if the export can be built quickly and safely on current surfaces, do it now
   - otherwise document the manual process clearly and defer the productized endpoint to P1.5
7. If deferring export implementation, add a manual operator procedure using specific queries or functions.
8. Update legal copy to point to the actual process.
9. Update [CHANGELOG.md](../../CHANGELOG.md).

#### Validation gate

- Another agent can follow the DSAR docs without inventing process.
- Export scope is explicit and table-based.
- Public rights language points to a real process.

#### Close only when

- Rights handling is operationally possible even if partially manual.

### P0.6 execution checklist: GDPR accountability pack

#### Goal

Produce the repo-resident accountability documents needed to explain and operate the system truthfully.

#### Step-by-step

1. Create `docs/compliance/ropa.md`.
   Must enumerate major processing activities and map them to systems, purposes, legal basis, recipients, retention, and safeguards.
2. Create `docs/compliance/lawful-bases.md`.
   Must align with public privacy text and distinguish contract, legitimate interest, consent, and legal obligation clearly.
3. Create `docs/compliance/dpia.md`.
   Must focus on:
   - uploaded professional documents
   - recruiter interactions
   - profiling and job-fit outputs
   - AI-assisted decision support risks
4. Create `docs/compliance/security-measures.md`.
   Use actual repo evidence only.
5. Create `docs/compliance/incident-response.md`.
   Include:
   - detection
   - triage
   - containment
   - notification decision points
   - post-incident review
6. Create `docs/compliance/vendor-register.md`.
   For each vendor include:
   - vendor name
   - service purpose
   - categories of data processed
   - privacy-policy link
   - public claim relied upon
   - whether Profiley only uses standard public terms
7. Cross-check all new docs against current public legal text.
8. Correct any mismatch immediately rather than leaving follow-up notes.
9. Update [CHANGELOG.md](../../CHANGELOG.md).

#### Validation gate

- Internal docs do not overclaim custom legal arrangements.
- Public and internal processing descriptions are consistent.

#### Close only when

- The repo contains a coherent GDPR accountability pack that matches the current implementation and operator facts.

### P0 final exit checklist

Do not start P1 until all of the following are true:

- Public legal copy is factually accurate.
- Acceptance is versioned and auditable.
- Settings supports deletion request and cancellation.
- Deletion processing is automated after 30 days.
- App-controlled retention is enforced by code.
- DSAR runbooks exist and are usable.
- Accountability docs exist and are internally consistent.
- All touched tests pass.
- [CHANGELOG.md](../../CHANGELOG.md) reflects the shipped P0 work.

## P1 backlog

### P1.1 AI transparency UX at point of use

#### Outcome

Users and recruiters see clear AI notices where automated features are used, not only on legal pages.

#### Repo surfaces

- [apps/frontend/src/app/pages/public-profile.tsx](../../apps/frontend/src/app/pages/public-profile.tsx)
- [apps/frontend/src/app/pages/job-fit-preview.tsx](../../apps/frontend/src/app/pages/job-fit-preview.tsx)
- [apps/frontend/src/app/components/chat-interface.tsx](../../apps/frontend/src/app/components/chat-interface.tsx)
- locale files under `apps/frontend/src/app/i18n/locales/`

#### Tasks

1. Add a persistent recruiter-facing notice before or adjacent to public chat and job-fit analysis.
2. Explain, in product language:
   - that the feature is AI-generated assistance
   - that outputs may be imperfect
   - that humans must make final decisions
   - where users can find privacy details and how to raise concerns
3. Make sure the notice is visible before the first interaction, not only after submission.
4. Add a stronger disclaimer to job-fit outputs and recruiter flows.

#### Acceptance criteria

- Every recruiter-facing AI surface includes an explicit notice.
- Copy is localized across supported locales.

### P1.2 Human oversight controls for recruiter-facing job-fit

#### Outcome

The product operationalizes non-reliance on automation instead of only asserting it.

#### Repo surfaces

- [apps/frontend/src/app/pages/public-profile.tsx](../../apps/frontend/src/app/pages/public-profile.tsx)
- [apps/frontend/src/app/pages/job-fit-preview.tsx](../../apps/frontend/src/app/pages/job-fit-preview.tsx)
- New docs under `docs/compliance/` and `docs/ops/`
- optional runtime settings or feature flags in `supabase/migrations/`

#### Tasks

1. Add recruiter-facing usage guidance near job-fit results.
2. Add operator docs defining intended use and prohibited use.
3. Consider gating public recruiter job-fit behind an explicit operator feature flag until governance maturity improves.
4. Document human-review requirements for any deployer or future admin.
5. If feasible, log explicit recruiter acknowledgements or operator enablement events when the public job-fit feature is activated.

#### Required docs

- `docs/compliance/ai-intended-purpose.md`
- `docs/compliance/ai-prohibited-uses.md`
- `docs/compliance/human-oversight.md`

#### Acceptance criteria

- The repo defines what the system may and may not be used for.
- Recruiter job-fit is framed as assistive, not authoritative.

### P1.3 AI governance baseline documents

#### Outcome

The repo contains the first governance layer needed for an employment-use AI system.

#### Repo surfaces

- New docs under `docs/compliance/`

#### Required docs

- `docs/compliance/ai-risk-register.md`
- `docs/compliance/ai-post-market-monitoring.md`
- `docs/compliance/ai-incident-management.md`
- `docs/compliance/ai-evaluation-plan.md`
- `docs/compliance/ai-literacy-plan.md`

#### Tasks

1. Create a risk register covering bias, automation bias, unsupported hiring reliance, hallucinated claims, privacy leakage, and prompt abuse.
2. Define post-market monitoring signals using existing telemetry such as moderation events and AI call logs.
3. Define an AI incident triage and escalation process.
4. Create an evaluation plan for job-fit and recruiter chat output quality.
5. Create an AI literacy plan for the operator and any future admin users.

#### Acceptance criteria

- The docs are specific to Profiley, not generic templates.
- Each governance doc maps to a real repo surface or operational step.

### P1.4 Vendor and transfer representation cleanup

#### Outcome

Vendor documentation becomes fact-based and maintainable.

#### Repo surfaces

- `docs/compliance/vendor-register.md`
- `docs/compliance/international-transfers.md`
- locale legal files

#### Tasks

1. Add a vendor register row for each active processor and subprocessor-level dependency that matters operationally.
2. For each vendor, track:
   - public privacy-policy link
   - region/hosting claims Profiley relies on
   - what evidence is public and what is unverified
3. Create an international transfers note that distinguishes:
   - actual known vendor public commitments
   - assumptions that are not yet evidenced
4. Update legal copy so it no longer implies more certainty than the operator has.

#### Acceptance criteria

- Vendor and transfer documentation can be reviewed and updated without editing product code.

### P1.5 Data export implementation

#### Outcome

Users can receive their Profiley data in a structured, machine-readable package.

#### Repo surfaces

- new edge function such as `supabase/functions/export-user-data/index.ts`
- [apps/frontend/src/app/pages/settings.tsx](../../apps/frontend/src/app/pages/settings.tsx)
- [apps/frontend/src/lib/api.ts](../../apps/frontend/src/lib/api.ts)
- new tests under `supabase/tests/` and frontend tests

#### Tasks

1. Build an authenticated export endpoint or asynchronous export job.
2. Include core user data sets such as:
   - `app_users`
   - `profiles`
   - `profile_preferences`
   - `onboarding_answers`
   - `uploaded_documents` metadata
   - `document_extractions` where appropriate
   - `knowledge_chunks` where appropriate
   - `conversations` and `messages`
   - `job_fit_analyses`
   - `recruiter_contacts`, `recruiter_events`, and `recruiter_visits` where legally appropriate for the data subject
3. Choose a package structure such as JSON manifest plus CSV/JSON tables.
4. Add a Settings entry point and status/error handling.

#### Acceptance criteria

- Export is authenticated, scoped, and machine-readable.
- DSAR runbooks reference the actual export mechanism.

## P2 backlog

### P2.1 DSAR case-management support

#### Outcome

The operator has a structured in-product or repo-supported way to track privacy requests and responses.

#### Tasks

1. Add a private case-log schema or structured operator log format.
2. Create repeatable templates for request intake, verification, response, and closure.
3. Optionally add admin tooling if the operator model grows beyond a single person.

### P2.2 Decision-trace and audit enhancements for recruiter-facing AI

#### Outcome

The system has better evidence of how AI outputs were produced and how they should be interpreted.

#### Tasks

1. Enrich job-fit and chat logs with model, prompt-version, and safety metadata where appropriate.
2. Consider versioning prompt templates used for job-fit and recruiter chat.
3. Add evaluation snapshots or benchmark fixtures for regression tracking.

### P2.3 Stronger operator-facing policy controls

#### Outcome

AI-risk controls are enforceable by configuration instead of only by documentation.

#### Tasks

1. Add feature flags or runtime settings for public recruiter job-fit availability.
2. Add operator-configurable retention windows where safe.
3. Add a compliance-checklist section to deployment docs.

## Recommended execution order

Agents should implement in this order unless blocked:

1. P0.1 legal accuracy reset
2. P0.2 acceptance capture
3. P0.3 deletion request and cancel flow
4. P0.4 retention enforcement
5. P0.5 DSAR runbooks and export spec
6. P0.6 GDPR accountability docs
7. P1.1 AI transparency UX
8. P1.2 human-oversight controls
9. P1.3 AI governance docs
10. P1.4 vendor and transfer documentation cleanup
11. P1.5 user data export implementation
12. P2 hardening items

## Cross-cutting implementation rules for AI agents

1. Do not reintroduce unsupported legal claims.
2. Prefer policy text that reflects implemented behavior over aspirational language.
3. Any new retention rule must have both code enforcement and documentation.
4. Any new compliance feature must ship with tests.
5. New docs must be specific to Profiley, not boilerplate placeholders.
6. Where a manual operator step remains, document it in-repo with a clear trigger, owner, and expected artifact.

## Testing matrix

### Frontend

- Settings deletion-request state transitions
- cancellation flow
- legal-acceptance gating
- AI notice rendering on public chat and job-fit surfaces

### Edge / backend

- legal acceptance persistence
- deletion request validation
- deletion cancellation validation
- due-account purge processing
- retention purge processing
- export endpoint auth and scope

### Documentation consistency review

- public legal text matches implementation
- internal compliance docs match public legal text where they overlap
- vendor register and privacy-policy processor table are consistent

## Deliverables checklist

The following files are expected by the end of the full plan:

### Product and backend

- new migration(s) for legal acceptance versioning
- new migration(s) for deletion-request state
- new migration(s) for retention support
- `supabase/functions/request-account-deletion/index.ts`
- `supabase/functions/cancel-account-deletion/index.ts`
- `supabase/functions/process-account-deletions/index.ts`
- optional `supabase/functions/export-user-data/index.ts`
- updated `apps/frontend/src/app/pages/settings.tsx`
- updated locale legal files

### Compliance docs

- `docs/compliance/dsar-runbook.md`
- `docs/compliance/data-export-spec.md`
- `docs/compliance/erasure-runbook.md`
- `docs/compliance/privacy-requests-log-template.md`
- `docs/compliance/ropa.md`
- `docs/compliance/lawful-bases.md`
- `docs/compliance/dpia.md`
- `docs/compliance/security-measures.md`
- `docs/compliance/incident-response.md`
- `docs/compliance/vendor-register.md`
- `docs/compliance/international-transfers.md`
- `docs/compliance/ai-intended-purpose.md`
- `docs/compliance/ai-prohibited-uses.md`
- `docs/compliance/human-oversight.md`
- `docs/compliance/ai-risk-register.md`
- `docs/compliance/ai-post-market-monitoring.md`
- `docs/compliance/ai-incident-management.md`
- `docs/compliance/ai-evaluation-plan.md`
- `docs/compliance/ai-literacy-plan.md`

## Explicit non-goals for this plan

- Formal legal sign-off by external counsel
- Claiming EU AI Act certification or CE-marking readiness before the governance work is actually complete
- Claiming contractual safeguards with vendors that the operator has not entered into

## Blocking decisions already resolved

No further operator input is required to begin implementation unless one of these changes:

- recruiter-facing job-fit should be removed or disabled
- deletion should become immediate rather than delayed
- compliance docs should move outside the repo
