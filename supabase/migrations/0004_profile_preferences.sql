-- 0004_profile_preferences.sql

create table if not exists public.profile_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  response_language_mode text not null default 'query_language',
  allow_public_chat boolean not null default true,
  allow_job_fit_analysis boolean not null default true,
  allow_document_citation boolean not null default true,
  allow_contact_form boolean not null default true,
  ai_persona_tone text,
  model_chat_override text,
  model_stt_override text,
  model_tts_override text,
  model_embedding_override text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profile_preferences_user_id_unique unique (user_id)
);
