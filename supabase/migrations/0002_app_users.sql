-- 0002_app_users.sql
-- Application user record linked to Supabase Auth.

create table if not exists public.app_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email citext unique not null,
  auth_provider text,
  browser_locale text,
  timezone text,
  preferred_language text,
  role text not null default 'user' check (role in ('user', 'admin')),
  onboarding_completed boolean not null default false,
  terms_accepted_at timestamptz,
  privacy_accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_seen_at timestamptz
);

create index if not exists idx_app_users_role on public.app_users(role);
