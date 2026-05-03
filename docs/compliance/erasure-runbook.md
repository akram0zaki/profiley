# Erasure Runbook

Last updated: 2026-05-03

This runbook covers the normal and exceptional account-erasure paths for Profiley.

## Normal path: self-service deletion

1. The user signs in and opens Settings.
2. The user types `DELETE` and submits the deletion request.
3. Profiley records:
   - `deletion_requested_at`
   - `deletion_scheduled_for`
   - `deletion_request_source`
   - whether public visibility should be restored if the request is cancelled
4. Profiley immediately turns off `profiles.public_visibility`.
5. The user can cancel the request from Settings until the scheduled deletion time.
6. `process-account-deletions` removes storage artifacts and deletes the `auth.users` record, which cascades through the application tables.

## Manual path

Use the manual path when the requester cannot access the account session.

1. Verify identity per `dsar-runbook.md`.
2. If the request should follow the normal 30-day path, submit the same deletion request through the product on behalf of the user or use the equivalent operator tooling.
3. If an immediate exception is required, document the reason before taking action. Examples: duplicate account created in error, clear legal obligation to erase faster, or security compromise.
4. Confirm when the deletion was scheduled or completed.

## What the automated deletion currently removes

- `auth.users`, which cascades to `app_users`
- profile, preferences, onboarding answers, public page metadata, uploaded documents, extracted text, knowledge chunks, avatar profiles, conversations, messages, and job-fit analyses through existing foreign keys
- storage artifacts referenced by uploaded documents, profile photos, and avatar source photos

## What may persist after deletion

- Provider-managed backups for an unspecified rolling period
- Records that law or fraud-prevention duties require Profiley to keep
- External vendor logs outside direct repo control

Profiley does not currently keep a separate permanent tombstone record after the final `auth.users` delete.

## Failure handling

If the cron processor fails:

1. Check the edge-function logs for `process-account-deletions`.
2. Verify `public.runtime_settings.account_deletions_url` and `public.runtime_settings.cron_secret`.
3. Confirm that the function is deployed with `--no-verify-jwt`.
4. Retry the function manually with the correct `X-Cron-Secret` header.
5. Record the incident in `incident-response.md` if any scheduled deletion misses its expected date.