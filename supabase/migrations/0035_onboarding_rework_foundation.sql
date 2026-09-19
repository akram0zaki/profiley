-- 0035_onboarding_rework_foundation.sql

alter table public.app_users
  add column if not exists activation_completed_at timestamptz;

alter table public.uploaded_documents
  add column if not exists document_kind text not null default 'supporting_document';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'uploaded_documents_document_kind_check'
      and conrelid = 'public.uploaded_documents'::regclass
  ) then
    alter table public.uploaded_documents
      add constraint uploaded_documents_document_kind_check
      check (document_kind in ('cv', 'supporting_document'));
  end if;
end $$;

alter table public.onboarding_answers
  add column if not exists question_set_key text not null default 'legacy_onboarding',
  add column if not exists answer_summary text,
  add column if not exists capture_method text not null default 'form',
  add column if not exists visibility text not null default 'avatar_queryable',
  add column if not exists review_state text not null default 'confirmed',
  add column if not exists approved_at timestamptz,
  add column if not exists version integer not null default 1,
  add column if not exists stale_after_at timestamptz,
  add column if not exists last_reviewed_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'onboarding_answers_capture_method_check'
      and conrelid = 'public.onboarding_answers'::regclass
  ) then
    alter table public.onboarding_answers
      add constraint onboarding_answers_capture_method_check
      check (capture_method in ('form', 'chat', 'imported'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'onboarding_answers_visibility_check'
      and conrelid = 'public.onboarding_answers'::regclass
  ) then
    alter table public.onboarding_answers
      add constraint onboarding_answers_visibility_check
      check (visibility in ('private', 'avatar_queryable', 'public_profile'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'onboarding_answers_review_state_check'
      and conrelid = 'public.onboarding_answers'::regclass
  ) then
    alter table public.onboarding_answers
      add constraint onboarding_answers_review_state_check
      check (review_state in ('draft', 'confirmed', 'stale'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'onboarding_answers_version_check'
      and conrelid = 'public.onboarding_answers'::regclass
  ) then
    alter table public.onboarding_answers
      add constraint onboarding_answers_version_check
      check (version >= 1);
  end if;
end $$;

drop index if exists public.uq_onboarding_answers_user_question;

create unique index if not exists uq_onboarding_answers_user_question_set
  on public.onboarding_answers(user_id, question_set_key, question_key);