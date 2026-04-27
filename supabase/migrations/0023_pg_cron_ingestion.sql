-- 0023_pg_cron_ingestion.sql
-- Schedule periodic invocation of the process-document edge function for
-- queued uploads. Requires `app.settings.process_document_url` and
-- `app.settings.cron_secret` to be set in Postgres after migration:
--
--   alter database postgres set app.settings.process_document_url = 'https://<ref>.supabase.co/functions/v1/process-document';
--   alter database postgres set app.settings.cron_secret = '<random-secret>';
--
-- The same `cron_secret` must be set as the `CRON_SECRET` env var on the
-- process-document edge function so it can verify the call.

create or replace function public.process_pending_documents()
returns void
language plpgsql
security definer
as $$
declare
  rec record;
  url text := current_setting('app.settings.process_document_url', true);
  secret text := current_setting('app.settings.cron_secret', true);
begin
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

-- Schedule every 30 seconds. pg_cron's smallest interval expression is one
-- minute, so we register two jobs offset by 30s using a wrapper.
do $$
begin
  if exists (select 1 from cron.job where jobname = 'profiley_process_documents') then
    perform cron.unschedule('profiley_process_documents');
  end if;

  perform cron.schedule(
    'profiley_process_documents',
    '* * * * *',
    $cmd$select public.process_pending_documents();$cmd$
  );
end$$;
