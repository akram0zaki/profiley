-- 0011_job_fit_analyses.sql

create table if not exists public.job_fit_analyses (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete set null,
  visitor_session_id text,
  job_title text,
  company_name text,
  job_description text not null,
  fit_score numeric,
  fit_band text,
  strengths text[] not null default '{}',
  gaps text[] not null default '{}',
  risks text[] not null default '{}',
  transferable_strengths text[] not null default '{}',
  reasoning_summary text,
  confidence_label text,
  citations jsonb not null default '[]'::jsonb,
  model_used text,
  created_at timestamptz not null default now()
);

create index if not exists idx_job_fit_analyses_profile_id on public.job_fit_analyses(profile_id);
create index if not exists idx_job_fit_analyses_created_at on public.job_fit_analyses(created_at desc);
