-- 0033_backfill_runtime_function_urls.sql
-- Backfill cron target URLs from the existing process-document URL so
-- environment-specific project refs do not need to be hardcoded in repo SQL.

with process_base as (
  select regexp_replace(value, '/functions/v1/process-document$', '') as base_url
  from public.runtime_settings
  where key = 'process_document_url'
    and value ~ '/functions/v1/process-document$'
)
insert into public.runtime_settings (key, value)
select key, base_url || suffix
from process_base
cross join (
  values
    ('account_deletions_url', '/functions/v1/process-account-deletions'),
    ('retention_purge_url', '/functions/v1/process-retention-purge')
) as targets(key, suffix)
on conflict (key) do update
set value = excluded.value,
    updated_at = timezone('utc', now());