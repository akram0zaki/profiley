-- 0031_retention_purge.sql
-- Adds supporting indexes and a pg_cron trigger for the retention purge job.

create index if not exists idx_recruiter_visits_created_at
  on public.recruiter_visits(created_at desc);

create index if not exists idx_recruiter_events_created_at
  on public.recruiter_events(created_at desc);

create or replace function public.process_retention_purge()
returns void
language plpgsql
security definer
as $$
declare
  url text;
  secret text;
begin
  select rs.value into url
  from public.runtime_settings rs
  where rs.key = 'retention_purge_url';

  select rs.value into secret
  from public.runtime_settings rs
  where rs.key = 'cron_secret';

  if url is null or url = '' then
    return;
  end if;

  perform net.http_post(
    url := url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Cron-Secret', coalesce(secret, '')
    ),
    body := jsonb_build_object('trigger', 'pg_cron')
  );
end$$;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'profiley_process_retention_purge') then
    perform cron.unschedule('profiley_process_retention_purge');
  end if;

  perform cron.schedule(
    'profiley_process_retention_purge',
    '20 2 * * *',
    $cmd$select public.process_retention_purge();$cmd$
  );
end$$;