-- 0014_avatar_foundation.sql

create table if not exists public.avatar_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  source_photo_path text not null,
  voice_provider text,
  voice_model text,
  avatar_provider text,
  avatar_profile_id text,
  status text not null default 'not_configured',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.avatar_sessions (
  id uuid primary key default gen_random_uuid(),
  avatar_profile_id uuid not null references public.avatar_profiles(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  session_status text not null,
  provider_session_id text,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now()
);
