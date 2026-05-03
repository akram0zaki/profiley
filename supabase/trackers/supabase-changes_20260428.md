# Supabase Changes - 2026-04-28

## Migrations

- Created `0028_make_avatars_bucket_public.sql` to update the `avatars` bucket to `public = true`. This fixes the HTTP 400 error when retrieving profile photos via `getPublicUrl`.
- Updated `0021_storage.sql` to explicitly define the `avatars` bucket as public from scratch (the script is idempotent).
- Created `0029_legal_acceptance_versions.sql` to add versioned legal acknowledgement fields to `public.app_users`.
- Created `0030_account_deletion_requests.sql` to add deferred account-deletion state to `public.app_users` and schedule the `process-account-deletions` cron trigger through `public.runtime_settings`.
- Created `0031_retention_purge.sql` to add retention purge indexes and a daily `process-retention-purge` cron trigger through `public.runtime_settings`.
