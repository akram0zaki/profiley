-- 0006_uploaded_documents.sql

create table if not exists public.uploaded_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  storage_bucket text not null,
  storage_path text not null,
  original_filename text not null,
  mime_type text,
  file_size bigint,
  source_type text not null default 'upload', -- upload | paste | link
  visibility text not null default 'private',
  processing_status text not null default 'pending', -- pending | running | completed | failed | quarantined
  extracted_text_status text not null default 'pending',
  retry_count integer not null default 0,
  last_error text,
  checksum_sha256 text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_uploaded_documents_user_id on public.uploaded_documents(user_id);
create index if not exists idx_uploaded_documents_processing_status on public.uploaded_documents(processing_status);
create index if not exists idx_uploaded_documents_pending
  on public.uploaded_documents(created_at)
  where processing_status in ('pending', 'running');
