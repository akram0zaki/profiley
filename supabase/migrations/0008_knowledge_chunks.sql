-- 0008_knowledge_chunks.sql

create table if not exists public.knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  document_id uuid references public.uploaded_documents(id) on delete cascade,
  source_kind text not null, -- cv | portfolio | paste | note | extracted_section | onboarding
  chunk_index integer not null,
  content text not null,
  token_count integer,
  metadata jsonb not null default '{"public": true}'::jsonb,
  embedding vector(1536),
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_knowledge_chunks_user_id on public.knowledge_chunks(user_id);
create index if not exists idx_knowledge_chunks_document_id on public.knowledge_chunks(document_id);
create index if not exists idx_knowledge_chunks_source_kind on public.knowledge_chunks(source_kind);
create index if not exists idx_knowledge_chunks_active on public.knowledge_chunks(user_id) where deleted_at is null;
