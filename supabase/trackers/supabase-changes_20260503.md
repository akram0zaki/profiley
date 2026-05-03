# Supabase Changes - 2026-05-03

## Added / modified inventory

### Added migrations

- Added `0029_legal_acceptance_versions.sql`
- Added `0030_account_deletion_requests.sql`
- Added `0031_retention_purge.sql`
- Added `0032_ai_audit_controls.sql`
- Added `0033_backfill_runtime_function_urls.sql`

### Added edge functions

- Added `accept-legal-documents`
- Added `request-account-deletion`
- Added `cancel-account-deletion`
- Added `process-account-deletions`
- Added `process-retention-purge`
- Added `export-user-data`

### Modified edge functions

- Modified `analyze-job-fit`
- Modified `chat-persona`
- Modified `get-public-profile`
- Modified `test-persona-chat`

### Added shared function helpers

- Added `_shared/accountDeletion.ts`
- Added `_shared/exportUserData.ts`
- Added `_shared/legal.ts`
- Added `_shared/retention.ts`
- Added `_shared/runtimeSettings.ts`
- Added `_shared/prompts/versions.ts`

### Modified shared function helpers

- Modified `_shared/ai/capabilities/chat.ts`
- Modified `_shared/ai/capabilities/moderation.ts`
- Modified `_shared/ai/log.ts`
- Modified `_shared/validation/schemas.ts`

## Migrations

- Created `0032_ai_audit_controls.sql` to add prompt-version and safety metadata fields to `public.ai_call_logs` and `public.job_fit_analyses`.
- Seeded `public.runtime_settings.public_job_fit_enabled` in `0032_ai_audit_controls.sql` so operators can disable public recruiter job-fit globally without code changes.
- Created `0033_backfill_runtime_function_urls.sql` to derive `account_deletions_url` and `retention_purge_url` from the existing `process_document_url`, avoiding project-ref-specific SQL in the repo.

## Edge functions

- Added `export-user-data` to generate the self-service JSON export bundle used by Settings.
- Updated `get-public-profile` to apply the global `public_job_fit_enabled` runtime control to the public profile payload.
- Updated `analyze-job-fit` to enforce the global runtime control, moderate recruiter job descriptions, and persist prompt-version plus safety metadata.
- Updated `chat-persona` and `test-persona-chat` to log prompt versions and policy context for recruiter-facing and owner-preview chat traffic.