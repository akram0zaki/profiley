# Supabase Changes - 2026-04-28

## Migrations

- Created `0028_make_avatars_bucket_public.sql` to update the `avatars` bucket to `public = true`. This fixes the HTTP 400 error when retrieving profile photos via `getPublicUrl`.
- Updated `0021_storage.sql` to explicitly define the `avatars` bucket as public from scratch (the script is idempotent).
