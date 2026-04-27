-- 0015_updated_at_triggers.sql

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  t text;
  tables text[] := array[
    'app_users',
    'profiles',
    'profile_preferences',
    'onboarding_answers',
    'uploaded_documents',
    'public_pages',
    'conversations',
    'ai_provider_configs',
    'feature_model_assignments',
    'avatar_profiles'
  ];
begin
  foreach t in array tables loop
    execute format(
      'drop trigger if exists set_updated_at_%1$I on public.%1$I', t
    );
    execute format(
      'create trigger set_updated_at_%1$I before update on public.%1$I for each row execute function public.set_updated_at()', t
    );
  end loop;
end$$;
