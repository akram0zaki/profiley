-- 0024_runtime_settings.sql
-- Store runtime settings for pg_cron/process-document in a normal table.
-- Supabase's managed Postgres roles may reject ALTER DATABASE ... SET for
-- custom app.settings.* GUCs, so we persist them here instead.

create table if not exists public.runtime_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.runtime_settings is
  'Small key/value store for runtime settings needed by database jobs.';

revoke all on table public.runtime_settings from anon, authenticated;

create or replace function public.process_pending_documents()
returns void
language plpgsql
security definer
as $$
declare
  rec record;
  url text;
  secret text;
begin
  select rs.value into url
  from public.runtime_settings rs
  where rs.key = 'process_document_url';

  select rs.value into secret
  from public.runtime_settings rs
  where rs.key = 'cron_secret';

  if url is null or url = '' then
    return; -- not configured yet; skip silently.
  end if;

  for rec in
    select id from public.uploaded_documents
    where processing_status = 'pending'
      and retry_count < 3
    order by created_at asc
    limit 5
  loop
    update public.uploaded_documents
    set processing_status = 'running'
    where id = rec.id and processing_status = 'pending';

    perform net.http_post(
      url := url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'X-Cron-Secret', coalesce(secret, '')
      ),
      body := jsonb_build_object('documentId', rec.id)
    );
  end loop;
end$$;