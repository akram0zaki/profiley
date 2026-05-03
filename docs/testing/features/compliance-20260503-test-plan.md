# Compliance Test Plan

Last updated: 2026-05-03

This plan validates the full compliance implementation described in `docs/plans/compliance-20260503.md`. It is designed to be executed end-to-end in a dev or staging environment and to leave a clear pass/fail trail for every new or updated compliance feature.

## Status legend

- `Pending`: not run yet
- `Pass`: passed as expected
- `Fail`: executed but did not meet the expected result
- `Blocked`: could not be completed because of an environment or data issue
- `N/A`: not applicable in the current environment

## Test run record

| Field | Value |
| --- | --- |
| Tester | |
| Date | |
| Environment | |
| Frontend URL | |
| Supabase project ref | |
| Commit / branch | |
| Overall status | `Pending` |
| Notes | |

## Preconditions

1. Install dependencies with `pnpm install`.
2. Make sure the target environment has the latest migrations and edge functions deployed.
3. Start the frontend locally when running browser checks with `pnpm dev`.
4. Have SQL access to the target Supabase database for fixture setup and verification.
5. Have the cron secret available for manual scheduler invocations.
6. Confirm these runtime settings exist and are populated:
   - `cron_secret`
   - `account_deletions_url`
   - `retention_purge_url`
   - `public_job_fit_enabled`
7. Prepare these test actors:
   - `active_user`: onboarded, current legal versions accepted, public profile enabled, public chat enabled, public job-fit enabled
   - `outdated_legal_user`: same as above, but `terms_version` and/or `privacy_version` set to an older value or `null`
   - `deletion_user`: disposable account for request/cancel/purge checks
   - `recruiter_visitor`: signed-out browser session for public profile checks

## Recommended execution order

1. Run the automated baseline.
2. Validate product flows in the browser.
3. Validate background jobs and operator workflows.
4. Finish with documentation consistency checks.

## Summary checklist

| ID | Area | Type | Status | Notes |
| --- | --- | --- | --- | --- |
| C01 | Baseline automated regression | Automated | `Pass` | |
| C02 | Legal pages and locale parity | Automated + Manual | `Pass` | |
| C03 | Legal version source of truth | Manual | `Pass` | |
| C04 | Legal acceptance first-time gate | Automated + Manual | `Pass` | |
| C05 | Legal acceptance no-overwrite behavior | Automated + Manual | `Pass` | |
| C06 | Legal re-acceptance on outdated version | Automated + Manual | `Pass` | |
| C07 | Account deletion request flow | Automated + Manual | `Pass` | |
| C08 | Account deletion cancellation flow | Automated + Manual | `Pass` | |
| C09 | Public visibility change during deletion window | Manual | `Pass` | |
| C10 | Due-account purge processor | Automated + Manual | `Pending` | |
| C11 | Retention purge logic and schedule | Automated + Manual | `Pending` | |
| C12 | Self-service data export | Automated + Manual | `Pass` | |
| C13 | DSAR operator workflow | Manual | `Pending` | |
| C14 | Accountability docs consistency | Manual | `Pass` | |
| C15 | Public recruiter AI transparency notices | Automated + Manual | `Pass` | |
| C16 | Owner-side job-fit preview notice | Automated + Manual | `Pass` | |
| C17 | Human-oversight controls and feature flag | Automated + Manual | `Pass` | |
| C18 | AI governance and monitoring docs | Manual | `Pass` | |
| C19 | Vendor and transfer documentation consistency | Manual | `Pass` | |
| C20 | P2 auditability and privacy-case artifacts | Automated + Manual | `Pass` | |

## Detailed cases

### C01. Baseline automated regression

Status: `Pass`

Purpose: confirm the full compliance implementation does not break the existing automated suites or the frontend build.

Commands:

```bash
pnpm test
pnpm build
pnpm build:prod
```

Expected result:

- Frontend Vitest suite passes.
- Edge Deno suite passes.
- Development and production builds both complete successfully.

Evidence to record:

- Command completion time
- Any failing test names or build errors

### C02. Legal pages and locale parity

Status: `Pass`

Automated coverage:

- `apps/frontend/src/app/pages/__tests__/legal.test.tsx`

Manual steps:

1. Open `/legal/terms`, `/legal/privacy`, and `/legal/cookies` in the browser.
2. Confirm each page renders without missing translation keys or broken layout.
3. Switch the app language to English, Dutch, and Arabic.
4. Confirm the legal footer links remain present and the processor table still renders in each locale.
5. Confirm the privacy page names the current vendors and links to public privacy-policy pages.
6. Confirm there are no claims about unsupported signed DPAs, unsupported SCC arrangements, or immediate self-service deletion if that is not the implemented behavior.

Expected result:

- All three legal routes render correctly.
- Locale structure remains aligned across `en`, `nl`, and `ar`.
- Public legal copy is factual and matches the implemented product behavior.

### C03. Legal version source of truth

Status: `Pass`

Manual steps:

1. Open `shared/legal-versions.json`.
2. Confirm `termsVersion` and `privacyVersion` both match the published version expected for this release.
3. Open the legal acceptance screen as a user who still needs acceptance.
4. Confirm the displayed version notice matches the values in `shared/legal-versions.json`.
5. Confirm the legal acceptance flow references the same versions on both frontend and backend behavior.

Expected result:

- The current terms and privacy versions come from a single source of truth.
- The UI and persisted acceptance checks use the same values.

### C04. Legal acceptance first-time gate

Status: `Pass`

Automated coverage:

- `apps/frontend/src/app/components/__tests__/auth-guards.test.tsx`
- `supabase/tests/legal.test.ts`

Manual steps:

1. Use `outdated_legal_user` with missing or null legal acceptance fields.
2. Sign in and navigate to a protected route such as `/dashboard`, `/settings`, or `/onboarding`.
3. Confirm the app redirects to `/legal/acceptance` before protected content loads.
4. Open the Terms and Privacy links from that screen and verify they work.
5. Accept the required acknowledgements.
6. Confirm the app resumes the protected flow after successful acceptance.
7. Verify in `public.app_users` that these fields are populated:
   - `terms_accepted_at`
   - `privacy_accepted_at`
   - `terms_version`
   - `privacy_version`
   - `terms_acceptance_source`
   - `privacy_acceptance_source`

Expected result:

- Protected routes are blocked until current legal versions are accepted.
- Acceptance writes timestamps, versions, and sources together.

### C05. Legal acceptance no-overwrite behavior

Status: `Pass`

Automated coverage:

- `supabase/tests/legal.test.ts`

Manual steps:

1. Start from a user who already accepted the current versions.
2. Record the current values of `terms_accepted_at`, `privacy_accepted_at`, `terms_version`, and `privacy_version`.
3. Refresh the app, sign out and back in, and revisit protected routes.
4. Re-check the same database fields.

Expected result:

- Acceptance timestamps and sources are not rewritten when the user already accepted the current versions.
- The user is not forced back through the acceptance screen.

### C06. Legal re-acceptance on outdated version

Status: `Pass`

Automated coverage:

- `apps/frontend/src/app/components/__tests__/auth-guards.test.tsx`
- `supabase/tests/legal.test.ts`

Manual steps:

1. Take an accepted user and set either `terms_version` or `privacy_version` in `public.app_users` to an older value.
2. Reload the app and navigate to a protected route.
3. Confirm the app redirects to `/legal/acceptance`.
4. Confirm the screen asks for acknowledgement only for the stale document and does not require re-checking the still-current document.
5. Accept again.
6. Confirm the stored version is updated to the current published version.

Expected result:

- A stale version triggers re-acceptance.
- The acceptance screen only requires the document version that is out of date.
- Re-acceptance updates only the document version that is out of date.

### C07. Account deletion request flow

Status: `Pass`

Automated coverage:

- `apps/frontend/src/app/components/__tests__/account-deletion-card.test.tsx`
- `supabase/tests/accountDeletion.test.ts`

Manual steps:

1. Sign in as `deletion_user` and open `/settings`.
2. Confirm the danger-zone card requires explicit confirmation input before the action is enabled.
3. Submit the deletion request.
4. Confirm the UI switches to the pending-deletion state and shows the scheduled deletion date.
5. Verify `public.app_users` now has:
   - `deletion_requested_at`
   - `deletion_scheduled_for`
   - `deletion_request_source`
6. Confirm the scheduled date is exactly 30 days after the request timestamp.

Expected result:

- The request is explicit, deliberate, and persists a recoverable 30-day deletion schedule.

### C08. Account deletion cancellation flow

Status: `Pass`

Automated coverage:

- `supabase/tests/accountDeletion.test.ts`

Manual steps:

1. Start from a user with a pending deletion request.
2. Open `/settings`.
3. Confirm the pending-deletion banner or card shows the scheduled deletion date.
4. Click the cancel action.
5. Verify `public.app_users` clears:
   - `deletion_requested_at`
   - `deletion_scheduled_for`
   - `deletion_request_source`
6. Verify `deletion_cancelled_at` is populated.
7. Confirm the UI returns to the non-pending deletion state.

Expected result:

- A user can recover the account during the grace period.
- Pending deletion state is cleared cleanly.

### C09. Public visibility change during deletion window

Status: `Pass`

Manual steps:

1. Use a profile that is public before deletion is requested.
2. Open the public profile URL in a separate signed-out browser session and confirm it is visible.
3. From `/settings`, request account deletion.
4. Reload the public profile URL in the signed-out session.
5. Confirm the profile is no longer publicly visible.
6. Cancel the deletion request.
7. Reload the public profile URL again.

Expected result:

- Public visibility is disabled immediately when deletion is requested.
- If the implementation restores prior public visibility on cancel, the public profile becomes visible again after cancellation.

### C10. Due-account purge processor

Status: `Pending`

Automated coverage:

- `supabase/tests/accountDeletion.test.ts`

Fixture setup example:

```sql
update public.app_users
set deletion_requested_at = now() - interval '31 days',
    deletion_scheduled_for = now() - interval '1 day',
    deletion_cancelled_at = null,
    deletion_request_source = 'manual-test'
where id = '<deletion-user-id>';
```

Manual steps:

1. Create or identify a disposable user whose deletion is due.
2. Invoke the scheduled processor manually.
3. Recommended invocation:

```bash
curl -i -X POST "$SUPABASE_URL/functions/v1/process-account-deletions" \
  -H "Content-Type: application/json" \
  -H "X-Cron-Secret: $CRON_SECRET" \
  -d '{"trigger":"manual-test"}'
```

4. Verify the target row is removed from `auth.users`.
5. Verify related rows are deleted or handled consistently through the existing cascade rules.
6. Verify a non-due pending account is not deleted.

Expected result:

- Only due accounts are purged.
- The final purge path deletes the `auth.users` row and the dependent data behaves as expected.

### C11. Retention purge logic and schedule

Status: `Pending`

Automated coverage:

- `supabase/tests/retention.test.ts`

Fixture setup guidance:

Seed expired and non-expired rows for these tables:

- `public.recruiter_visits` at 90-day boundary
- `public.recruiter_events` at 180-day boundary
- `public.ai_call_logs` at 180-day boundary
- `public.moderation_events` at 365-day boundary
- `public.job_fit_analyses` at 365-day boundary

Manual steps:

1. Confirm the retention windows in `docs/compliance/retention-matrix.md` match the intended release behavior.
2. Invoke the purge processor manually.

```bash
curl -i -X POST "$SUPABASE_URL/functions/v1/process-retention-purge" \
  -H "Content-Type: application/json" \
  -H "X-Cron-Secret: $CRON_SECRET" \
  -d '{"trigger":"manual-test"}'
```

3. Verify expired rows are deleted.
4. Verify newer rows remain.
5. Verify the cron jobs are present:

```sql
select jobname, schedule
from cron.job
where jobname in (
  'profiley_process_account_deletions',
  'profiley_process_retention_purge'
)
order by jobname;
```

Expected result:

- Purge behavior matches the documented retention matrix exactly.
- Scheduler entries exist for both deletion and retention jobs.

### C12. Self-service data export

Status: `Pass`

Automated coverage:

- `apps/frontend/src/app/components/__tests__/account-data-export-card.test.tsx`
- `apps/frontend/src/lib/__tests__/api.test.ts`
- `supabase/tests/exportUserData.test.ts`

Manual steps:

1. Sign in as `active_user` and open `/settings`.
2. Click the export action.
3. Confirm a JSON bundle is downloaded.
4. Open the exported file and validate:
   - `manifest.exportedAt` is present
   - `manifest.profileyVersion` is present
   - `manifest.subjectUserId` matches the signed-in user
   - `manifest.tables` lists the documented default tables
   - `manifest.tableCounts` matches the included data
   - `manifest.storageArtifacts` lists uploaded documents and profile photo references when they exist
5. Confirm excluded operational tables are not present by default.
6. Cross-check the bundle against `docs/compliance/data-export-spec.md`.

Expected result:

- The self-service export is authenticated, downloadable, and machine-readable.
- The downloaded structure matches the documented export spec.

### C13. DSAR operator workflow

Status: `Pending`

Manual steps:

1. Open `docs/compliance/dsar-runbook.md` and walk through a dummy access request from intake to closure.
2. Create a sample log entry in `docs/compliance/privacy-requests-log-template.md`.
3. For a more complex case, verify `docs/compliance/privacy-request-case-schema.md` supplies the additional fields needed.
4. Confirm `docs/compliance/privacy-request-response-templates.md` contains templates for:
   - acknowledgement
   - verification
   - self-service export guidance
   - extension
   - completion
   - partial refusal
5. Verify the runbook explains identity verification, timing, scope handling, and exception handling.
6. Confirm the self-service export path in the runbook matches the implemented Settings flow.

Expected result:

- Another operator or agent can execute a DSAR without inventing missing process.
- The documentation reflects the current export and erasure capabilities accurately.

### C14. Accountability docs consistency

Status: `Pass`

Manual steps:

1. Review these documents together:
   - `docs/compliance/ropa.md`
   - `docs/compliance/lawful-bases.md`
   - `docs/compliance/dpia.md`
   - `docs/compliance/security-measures.md`
   - `docs/compliance/incident-response.md`
   - `docs/compliance/vendor-register.md`
2. Confirm they consistently describe the operator as an individual in the Netherlands.
3. Confirm retention statements align with `docs/compliance/retention-matrix.md` and the public legal copy.
4. Confirm there are no claims about signed custom vendor agreements unless evidence exists.
5. Confirm the incident-response and security docs describe controls that exist in the repo or operator process.

Expected result:

- Internal accountability docs are internally consistent and match the public policy text.

### C15. Public recruiter AI transparency notices

Status: `Pass`

Automated coverage:

- `apps/frontend/src/app/pages/__tests__/public-profile.test.tsx`

Manual steps:

1. Open a public profile as `recruiter_visitor`.
2. Confirm the general AI-assisted notice is visible on the page.
3. Open the AI chat tab before sending any message.
4. Confirm the notice explains that the output is AI-generated assistance and important claims should be verified with the candidate.
5. Open the Job Fit tab before running analysis.
6. Confirm the notice states the analysis is assistive only and not an automated hiring decision.
7. Confirm links to privacy details and concern-reporting paths are visible where applicable.

Expected result:

- Recruiter-facing AI surfaces show the required transparency and non-reliance framing before first use.

### C16. Owner-side job-fit preview notice

Status: `Pass`

Automated coverage:

- `apps/frontend/src/app/pages/__tests__/job-fit-preview.test.tsx`

Manual steps:

1. Sign in as a normal user and open `/job-fit-preview`.
2. Before entering a job description, confirm the page shows:
   - AI-generated assistance language
   - a warning against automated hiring or employment decisions
   - a link to privacy details
   - a way to raise a concern

Expected result:

- The owner-side preview flow shows pre-use transparency and support links.

### C17. Human-oversight controls and feature flag

Status: `Pass`

Automated coverage:

- `supabase/tests/runtimeSettings.test.ts`
- `supabase/tests/promptVersions.test.ts`

Manual steps:

1. Review `docs/compliance/human-oversight.md`, `docs/compliance/ai-intended-purpose.md`, and `docs/compliance/ai-prohibited-uses.md` together.
2. Confirm the product behavior matches the documentation:
   - AI outputs are assistive
   - human review is required
   - prohibited use is documented
3. Set `public.runtime_settings.public_job_fit_enabled = 'false'` in a non-production environment.
4. Reload a public profile that normally allows job-fit analysis.
5. Confirm the public job-fit feature is disabled globally.
6. Restore the setting to `true` and confirm the feature becomes available again.

Expected result:

- Human-oversight requirements are documented and reflected in product behavior.
- The global job-fit feature flag works as an operator control.

### C18. AI governance and monitoring docs

Status: `Pass`

Manual steps:

1. Review these documents:
   - `docs/compliance/ai-risk-register.md`
   - `docs/compliance/ai-post-market-monitoring.md`
   - `docs/compliance/ai-incident-management.md`
   - `docs/compliance/ai-evaluation-plan.md`
   - `docs/compliance/ai-literacy-plan.md`
2. Confirm each document references real repo surfaces, telemetry, or operator actions.
3. Confirm the monitoring plan references currently available signals such as `moderation_events`, `ai_call_logs`, `job_fit_analyses`, and support complaints.
4. Confirm the AI incident flow points to practical escalation and follow-up actions.
5. Confirm the literacy plan references the current oversight and risk documentation.

Expected result:

- Governance documents are specific to Profiley and can be executed as written.

### C19. Vendor and transfer documentation consistency

Status: `Pass`

Manual steps:

1. Review `docs/compliance/vendor-register.md` and `docs/compliance/international-transfers.md`.
2. Cross-check them against the vendor table on `/legal/privacy`.
3. Confirm each active vendor has a documented purpose, data-category description, and public privacy-policy link.
4. Confirm the wording distinguishes public vendor commitments from any unsupported claim of custom signed agreements.
5. Confirm transfer wording is factual and does not overstate certainty.

Expected result:

- Vendor and international transfer documentation matches the public privacy policy and avoids unsupported claims.

### C20. P2 auditability and privacy-case artifacts

Status: `Pass`

Automated coverage:

- `supabase/tests/promptVersions.test.ts`
- `supabase/tests/runtimeSettings.test.ts`

Manual steps:

1. Confirm prompt versions are stable and documented for recruiter-facing AI flows.
2. Run one recruiter chat interaction and one job-fit analysis in a non-production environment.
3. Check the owner-readable persisted records in SQL:
    - `public.conversations`: confirm a new conversation exists for the recruiter chat run.
    - `public.messages`: confirm the user and assistant messages were stored, and inspect `model_used` and `retrieval_context`.
    - `public.job_fit_analyses`: confirm the job-fit run stored `model_used`, `prompt_version`, `safety_flagged`, `safety_categories`, and `citations`.
4. Check the admin-only AI audit log in SQL:
    - `public.ai_call_logs`: confirm one `feature_key = 'persona-chat'` row and one `feature_key = 'job-fit'` row exist for the test interactions.
    - Verify `provider`, `model_key`, `prompt_version`, `safety_flagged`, `safety_categories`, and `policy_context` are populated as expected.
    - Note: chat prompt-version metadata is logged in `ai_call_logs`, not stored on `messages` or `conversations`.
5. Check `public.moderation_events` only if a request was blocked or flagged. A successful interaction may not create any moderation row.
6. Confirm `docs/compliance/privacy-request-case-schema.md` and `docs/compliance/privacy-request-response-templates.md` are sufficient to run a complex privacy case from start to finish.
7. Confirm the post-market monitoring and incident docs reference deletion and retention failures as review triggers.

Suggested SQL:

```sql
select
   c.id as conversation_id,
   c.created_at as conversation_created_at,
   c.initiated_by,
   c.mode,
   c.language,
   m.created_at as message_created_at,
   m.role,
   m.model_used,
   m.retrieval_context,
   m.content
from public.conversations c
join public.messages m on m.conversation_id = c.id
order by m.created_at desc
limit 20;
```

```sql
select
   id,
   created_at,
   profile_id,
   model_used,
   prompt_version,
   safety_flagged,
   safety_categories,
   fit_score,
   fit_band,
   citations
from public.job_fit_analyses
order by created_at desc
limit 10;
```

```sql
select
   created_at,
   feature_key,
   capability,
   provider,
   model_key,
   prompt_version,
   safety_flagged,
   safety_categories,
   policy_context,
   prompt_tokens,
   completion_tokens,
   total_tokens,
   error_code
from public.ai_call_logs
where feature_key in ('persona-chat', 'job-fit')
order by created_at desc
limit 20;
```

Expected result:

- Audit-oriented metadata and operator artifacts exist for the hardening work added after the core compliance features.

Current blocker:

- Full validation requires SQL or admin access to `public.ai_call_logs`. Without that access, recruiter chat prompt-version metadata cannot be fully verified in the target environment.

## Targeted re-run commands

Use these when a single area fails and you want a narrower retest.

### Frontend

```bash
pnpm --filter @profiley/frontend test -- src/app/pages/__tests__/legal.test.tsx
pnpm --filter @profiley/frontend test -- src/app/components/__tests__/auth-guards.test.tsx
pnpm --filter @profiley/frontend test -- src/app/components/__tests__/account-deletion-card.test.tsx
pnpm --filter @profiley/frontend test -- src/app/components/__tests__/account-data-export-card.test.tsx
pnpm --filter @profiley/frontend test -- src/app/pages/__tests__/public-profile.test.tsx
pnpm --filter @profiley/frontend test -- src/app/pages/__tests__/job-fit-preview.test.tsx
```

### Edge

```bash
cd supabase && deno test --allow-env --allow-net --allow-read tests/legal.test.ts
cd supabase && deno test --allow-env --allow-net --allow-read tests/accountDeletion.test.ts
cd supabase && deno test --allow-env --allow-net --allow-read tests/retention.test.ts
cd supabase && deno test --allow-env --allow-net --allow-read tests/exportUserData.test.ts
cd supabase && deno test --allow-env --allow-net --allow-read tests/runtimeSettings.test.ts
cd supabase && deno test --allow-env --allow-net --allow-read tests/promptVersions.test.ts
```

## Sign-off checklist

Mark this release as validated only when all of the following are true:

- Every summary checklist item is marked `Pass`, `N/A`, or has an explicit follow-up issue.
- `pnpm test` passes.
- `pnpm build` and `pnpm build:prod` pass.
- Legal copy matches implemented behavior.
- Acceptance, deletion, retention, export, and AI transparency flows all pass in the target environment.
- Documentation checks do not reveal unsupported legal or operational claims.