-- 0013_moderation_and_analytics.sql

create table if not exists public.moderation_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  conversation_id uuid references public.conversations(id) on delete set null,
  event_type text not null, -- input_blocked | output_blocked | rate_limited | suspected_injection
  input_excerpt text,
  resolution text not null default 'auto_blocked',
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_moderation_events_profile on public.moderation_events(profile_id);
create index if not exists idx_moderation_events_created_at on public.moderation_events(created_at desc);

create table if not exists public.recruiter_visits (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  visitor_session_id text,
  referrer text,
  locale text,
  timezone text,
  user_agent text,
  ip_hash text,
  created_at timestamptz not null default now()
);

create index if not exists idx_recruiter_visits_profile on public.recruiter_visits(profile_id, created_at desc);

create table if not exists public.recruiter_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete set null,
  visitor_session_id text,
  event_name text not null,
  event_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_recruiter_events_profile on public.recruiter_events(profile_id, created_at desc);
create index if not exists idx_recruiter_events_name on public.recruiter_events(event_name);
