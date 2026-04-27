-- 0005_onboarding_answers.sql

create table if not exists public.onboarding_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  question_key text not null,
  answer_text text,
  answer_json jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_onboarding_answers_user_id on public.onboarding_answers(user_id);
create index if not exists idx_onboarding_answers_question_key on public.onboarding_answers(question_key);
create unique index if not exists uq_onboarding_answers_user_question on public.onboarding_answers(user_id, question_key);
