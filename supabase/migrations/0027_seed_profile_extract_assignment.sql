-- Map the `profile_extract` feature (extract-profile-from-cv edge function)
-- to the default chat provider/model. The router falls back to the default
-- when no assignment exists, but we register one here for parity with other
-- chat-driven features and so the assignment shows up in admin tooling.

with chat_default as (
  select id from public.ai_provider_configs
  where capability = 'chat'
    and is_default = true
    and is_active = true
  limit 1
)
insert into public.feature_model_assignments (feature_key, capability, provider_config_id)
select 'profile_extract', 'chat', id from chat_default
on conflict (feature_key, capability) do nothing;
