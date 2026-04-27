-- 0022_seed_ai_configs.sql
-- Seed AI provider registry and feature/capability defaults.

-- Provider configs
insert into public.ai_provider_configs (capability, provider, model_key, display_name, is_active, is_default, config_json)
values
  -- chat
  ('chat',       'openai',  'gpt-4o-mini',                 'OpenAI · GPT-4o mini',          true, true,  '{"cost_per_1k_input": 0.00015, "cost_per_1k_output": 0.0006}'::jsonb),
  ('chat',       'openai',  'gpt-4o',                      'OpenAI · GPT-4o',               true, false, '{"cost_per_1k_input": 0.0025,  "cost_per_1k_output": 0.01}'::jsonb),
  ('chat',       'gemini',  'gemini-1.5-pro',              'Google · Gemini 1.5 Pro',       true, false, '{}'::jsonb),
  ('chat',       'mistral', 'mistral-large-latest',        'Mistral · Large',               true, false, '{}'::jsonb),
  -- embeddings
  ('embeddings', 'openai',  'text-embedding-3-small',      'OpenAI · text-embedding-3-small', true, true, '{"dim": 1536}'::jsonb),
  ('embeddings', 'openai',  'text-embedding-3-large',      'OpenAI · text-embedding-3-large', true, false, '{"dim": 3072}'::jsonb),
  -- moderation
  ('moderation', 'openai',  'omni-moderation-latest',      'OpenAI · Omni Moderation',     true, true,  '{}'::jsonb),
  -- stt
  ('stt',        'openai',  'whisper-1',                   'OpenAI · Whisper',             true, true,  '{}'::jsonb),
  -- tts
  ('tts',        'openai',  'tts-1',                       'OpenAI · TTS-1',               true, true,  '{"voice": "alloy"}'::jsonb)
on conflict (capability, provider, model_key) do nothing;

-- Feature → model assignments (resolve via the default rows just inserted).
with chat_default as (
  select id from public.ai_provider_configs where capability='chat' and provider='openai' and model_key='gpt-4o-mini'
),
chat_strong as (
  select id from public.ai_provider_configs where capability='chat' and provider='openai' and model_key='gpt-4o'
),
emb_default as (
  select id from public.ai_provider_configs where capability='embeddings' and provider='openai' and model_key='text-embedding-3-small'
),
mod_default as (
  select id from public.ai_provider_configs where capability='moderation' and provider='openai' and model_key='omni-moderation-latest'
),
stt_default as (
  select id from public.ai_provider_configs where capability='stt' and provider='openai' and model_key='whisper-1'
),
tts_default as (
  select id from public.ai_provider_configs where capability='tts' and provider='openai' and model_key='tts-1'
)
insert into public.feature_model_assignments (feature_key, capability, provider_config_id)
select 'persona_chat',         'chat',       id from chat_default union all
select 'job_fit_analysis',     'chat',       id from chat_strong union all
select 'onboarding_assistant', 'chat',       id from chat_default union all
select 'recruiter_summary',    'chat',       id from chat_default union all
select 'persona_chat',         'embeddings', id from emb_default union all
select 'job_fit_analysis',     'embeddings', id from emb_default union all
select 'persona_chat',         'moderation', id from mod_default union all
select 'job_fit_analysis',     'moderation', id from mod_default union all
select 'avatar_voice_chat',    'stt',        id from stt_default union all
select 'avatar_voice_chat',    'tts',        id from tts_default
on conflict (feature_key, capability) do nothing;
