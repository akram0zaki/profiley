# Supabase Changes - 2026-05-04

## Added / modified inventory

### Added migrations

- Added `0034_profile_social_links.sql`

### Modified edge functions

- Modified `extract-profile-from-cv`
- Modified `process-document`

### Added shared function helpers

- Added `_shared/profile/socialLinks.ts`

## Migrations

- Created `0034_profile_social_links.sql` to store canonical structured social/profile links on `public.profiles.social_links` and per-platform visibility flags on `public.profile_preferences.public_social_visibility`.
- Updated `public.public_profile_view` to expose only the platform links whose visibility flags are enabled.

## Edge functions

- Updated `process-document` to extract supported social/profile links from uploaded document text during ingestion and merge newly discovered platforms into the owner profile without overwriting existing values.
- Updated `extract-profile-from-cv` to return the normalized social/profile links it finds across the selected CV sources so the profile editor can prefill them.