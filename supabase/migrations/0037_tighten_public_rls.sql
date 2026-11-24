-- 0037_tighten_public_rls.sql
-- Close direct anonymous reads of public profile rows.
--
-- "anyone_reads_public_profile" let anon/authenticated callers select every
-- column of any public profile through PostgREST. Since 0034 that includes
-- profiles.social_links, so links the owner hid via
-- profile_preferences.public_social_visibility were readable with
-- `GET /rest/v1/profiles?select=social_links`, bypassing the filtering in
-- public_profile_view.
--
-- Public profile data is served only through public_profile_view (read by edge
-- functions with the service role), so the table-level public read policies
-- are dropped. "anyone_reads_public_pages" goes too: its visibility check
-- subqueries profiles, which anon can no longer see, and nothing reads
-- public_pages anonymously.
--
-- Owners keep full access to their own rows via the owner policies in 0019.

drop policy if exists "anyone_reads_public_profile" on public.profiles;
drop policy if exists "anyone_reads_public_pages" on public.public_pages;

-- runtime_settings already has all privileges revoked from anon/authenticated
-- (0024). Enable RLS with no policies as defence in depth, so a future grant
-- does not silently expose cron secrets.
alter table public.runtime_settings enable row level security;
