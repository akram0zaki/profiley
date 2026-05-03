-- 0030_account_deletion_requests.sql
-- Adds deferred account-deletion state and a pg_cron-triggered processor.

alter table public.app_users
  add column if not exists deletion_requested_at timestamptz,
  add column if not exists deletion_scheduled_for timestamptz,
  add column if not exists deletion_cancelled_at timestamptz,
  add column if not exists deletion_request_source text,
  add column if not exists deletion_restore_public_visibility boolean;

create index if not exists idx_app_users_deletion_due
  on public.app_users (deletion_scheduled_for)
  where deletion_scheduled_for is not null and deletion_cancelled_at is null;

create or replace function public.process_due_account_deletions()
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
  where rs.key = 'account_deletions_url';

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
  if exists (select 1 from cron.job where jobname = 'profiley_process_account_deletions') then
    perform cron.unschedule('profiley_process_account_deletions');
  end if;

  perform cron.schedule(
    'profiley_process_account_deletions',
    '15 * * * *',
    $cmd$select public.process_due_account_deletions();$cmd$
  );
end$$;