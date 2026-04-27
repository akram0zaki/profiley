-- 0026_recover_running_documents_one_off.sql
-- One-off operational recovery: between migration 0025 applying and the
-- process-document function being redeployed with verify_jwt = false, the
-- cron tick at 18:16 UTC flipped two recovered rows back to 'running' and
-- fired pg_net calls that were 401'd by the gateway. Reset any rows left in
-- 'running' so the next cron tick (now hitting the JWT-disabled function)
-- can process them.
--
-- Idempotent: only matches rows currently in 'running'.

update public.uploaded_documents
set processing_status = 'pending',
    last_error = coalesce(last_error, 'reclaimed by migration 0026'),
    updated_at = timezone('utc', now())
where processing_status = 'running';
