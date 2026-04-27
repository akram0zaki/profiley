-- 0025_process_documents_running_recovery.sql
-- Make the document ingestion job self-healing.
--
-- Background: process_pending_documents() flips a row from 'pending' to
-- 'running' BEFORE issuing the async net.http_post() call to the
-- process-document edge function. If that HTTP call fails before our
-- handler can update the row (e.g. the gateway returns 401 because
-- verify_jwt was on, the function crashed mid-request, or pg_net dropped
-- the response), the row is left in 'running' forever and the job — which
-- only picks up 'pending' rows — never retries it.
--
-- Fix: also reclaim rows that have been 'running' for more than 5 minutes.
-- Their retry_count is bumped so genuinely-broken rows still hit the
-- retry-cap and move to 'failed' instead of looping indefinitely.
--
-- This migration also resets any currently-stuck 'running' rows so they
-- get picked up on the next cron tick after deploy.

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

  -- Reclaim rows that were marked 'running' but never finished. Bumping
  -- retry_count ensures permanently-broken rows still reach the retry cap.
  update public.uploaded_documents
  set processing_status = 'pending',
      retry_count = retry_count + 1,
      last_error = coalesce(last_error, 'reclaimed: stuck in running'),
      updated_at = timezone('utc', now())
  where processing_status = 'running'
    and updated_at < timezone('utc', now()) - interval '5 minutes';

  for rec in
    select id from public.uploaded_documents
    where processing_status = 'pending'
      and retry_count < 3
    order by created_at asc
    limit 5
  loop
    update public.uploaded_documents
    set processing_status = 'running',
        updated_at = timezone('utc', now())
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

-- One-off recovery for rows stuck in 'running' before this migration ran.
-- Idempotent: only matches rows currently in that state.
update public.uploaded_documents
set processing_status = 'pending',
    last_error = coalesce(last_error, 'reclaimed by migration 0025'),
    updated_at = timezone('utc', now())
where processing_status = 'running';
