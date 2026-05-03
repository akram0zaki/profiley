-- 0032_ai_audit_controls.sql
-- Add structured AI audit fields and a global public job-fit runtime switch.

alter table public.ai_call_logs
  add column if not exists prompt_version text,
  add column if not exists safety_flagged boolean not null default false,
  add column if not exists safety_categories text[] not null default '{}'::text[],
  add column if not exists policy_context jsonb not null default '{}'::jsonb;

alter table public.job_fit_analyses
  add column if not exists prompt_version text,
  add column if not exists safety_flagged boolean not null default false,
  add column if not exists safety_categories text[] not null default '{}'::text[];

insert into public.runtime_settings (key, value)
values ('public_job_fit_enabled', 'true')
on conflict (key) do nothing;