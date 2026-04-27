-- 0007_document_extractions.sql

create table if not exists public.document_extractions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.uploaded_documents(id) on delete cascade,
  user_id uuid not null references public.app_users(id) on delete cascade,
  extraction_text text,
  extraction_json jsonb,
  language text,
  created_at timestamptz not null default now()
);

create index if not exists idx_document_extractions_document_id on public.document_extractions(document_id);
create index if not exists idx_document_extractions_user_id on public.document_extractions(user_id);
