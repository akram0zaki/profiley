-- 0012_ai_provider_configs.sql

create table if not exists public.ai_provider_configs (
  id uuid primary key default gen_random_uuid(),
  capability text not null, -- chat | embeddings | stt | tts | moderation
  provider text not null,   -- openai | gemini | mistral | elevenlabs
  model_key text not null,
  display_name text not null,
  is_active boolean not null default true,
  is_default boolean not null default false,
  config_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists uq_ai_provider_configs_capability_model
  on public.ai_provider_configs(capability, provider, model_key);

create unique index if not exists uq_ai_provider_configs_default
  on public.ai_provider_configs(capability)
  where is_default = true;

create table if not exists public.feature_model_assignments (
  id uuid primary key default gen_random_uuid(),
  feature_key text not null,
  capability text not null,
  provider_config_id uuid not null references public.ai_provider_configs(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint feature_model_assignments_unique unique (feature_key, capability)
);
