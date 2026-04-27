-- 0017_ai_call_logs.sql

create table if not exists public.ai_call_logs (
  id uuid primary key default gen_random_uuid(),
  feature_key text,
  capability text not null,
  provider text not null,
  model_key text not null,
  latency_ms integer,
  prompt_tokens integer,
  completion_tokens integer,
  total_tokens integer,
  error_code text,
  fallback_triggered boolean not null default false,
  request_id text,
  user_id uuid references public.app_users(id) on delete set null,
  profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_call_logs_created_at on public.ai_call_logs(created_at desc);
create index if not exists idx_ai_call_logs_feature on public.ai_call_logs(feature_key, capability);
create index if not exists idx_ai_call_logs_error on public.ai_call_logs(error_code) where error_code is not null;

create table if not exists public.rate_limit_buckets (
  bucket_key text not null,
  window_start timestamptz not null,
  count integer not null default 0,
  primary key (bucket_key, window_start)
);

create index if not exists idx_rate_limit_buckets_window on public.rate_limit_buckets(window_start);
