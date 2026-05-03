-- 0029_legal_acceptance_versions.sql
-- Adds versioned legal-acceptance metadata to app_users so acknowledgements
-- are auditable and can be re-requested after future policy updates.

alter table public.app_users
  add column if not exists terms_version text,
  add column if not exists privacy_version text,
  add column if not exists terms_acceptance_source text,
  add column if not exists privacy_acceptance_source text;