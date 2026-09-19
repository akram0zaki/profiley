# Supabase Changes - 2026-05-12

## Dev project sync status

- Dev project: `nfckhijropipalhqkmqn`
- Synced on: 2026-05-13
- Database: `0035_onboarding_rework_foundation.sql` applied via `supabase db push --include-all --yes`
- Edge functions: all tracker-listed functions deployed to dev
- Shared helpers: shipped through the function deployments listed below; no separate remote deployment step exists for `_shared/*`

## Added / modified inventory

### Added migrations

- [x] Added `0035_onboarding_rework_foundation.sql` — applied to dev on 2026-05-13

### Modified edge functions

- [x] Modified `complete-onboarding` — deployed to dev on 2026-05-13
- [x] Added `complete-activation` — deployed to dev on 2026-05-13
- [x] Modified `create-upload-url` — deployed to dev on 2026-05-13
- [x] Modified `finalize-upload` — deployed to dev on 2026-05-13
- [x] Modified `list-user-documents` — deployed to dev on 2026-05-13
- [x] Added `upsert-profile-answer` — deployed to dev on 2026-05-13
- [x] Modified `get-public-profile` — deployed to dev on 2026-05-13 with `--no-verify-jwt`
- [x] Modified `chat-persona` — deployed to dev on 2026-05-13 with `--no-verify-jwt`
- [x] Modified `analyze-job-fit` — deployed to dev on 2026-05-13 with `--no-verify-jwt`
- [x] Added `generate-profile-answer-draft` — deployed to dev on 2026-05-13
- [x] Added `approve-profile-answer-draft` — deployed to dev on 2026-05-13
- [x] Added `reject-profile-answer-draft` — deployed to dev on 2026-05-13

### Modified shared validation helpers

- [x] Updated `_shared/validation/schemas.ts` — included in the 2026-05-13 dev deployments for `complete-onboarding`, `complete-activation`, `create-upload-url`, `finalize-upload`, `upsert-profile-answer`, `generate-profile-answer-draft`, `approve-profile-answer-draft`, `reject-profile-answer-draft`, `get-public-profile`, `chat-persona`, and `analyze-job-fit`

## Migrations

- Added `public.app_users.activation_completed_at` so first-run activation can be tracked independently from the legacy `onboarding_completed` flag.
- Added `public.uploaded_documents.document_kind` with MVP values `cv` and `supporting_document`.
- Extended `public.onboarding_answers` with reusable answer metadata for question sets, capture provenance, visibility, review state, approval, and freshness/version support.

## Edge functions

- Updated `complete-onboarding` to write the new answer metadata defaults for legacy form submissions and stamp `activation_completed_at` for compatibility during the transition.
- Added `complete-activation` so quick-start skip and CV-upload initiation can mark activation complete without reusing the legacy wizard endpoint.
- Updated upload endpoints and document listing to accept and surface `documentKind` so the quick-start flow can mark CV uploads explicitly.
- Added `upsert-profile-answer` so the new interview-answer flow can persist validated manual answers and sync avatar-queryable knowledge chunks.
- Updated public AI/profile endpoints to require at least one processed CV before exposing or serving public chat and job-fit capabilities.
- Added AI draft generation plus approve/reject edge functions and centralized profile-answer persistence so chat-authored answers remain draft/private until explicit approval while still carrying version and freshness metadata.