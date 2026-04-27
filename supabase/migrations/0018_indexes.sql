-- 0018_indexes.sql
-- Search and vector indexes that are best applied after data flow is stable.

-- Full-text search on knowledge content.
create index if not exists idx_knowledge_chunks_content_tsv
  on public.knowledge_chunks
  using gin (to_tsvector('simple', content));

-- IVFFLAT cosine index for vector similarity. Lists tuning depends on dataset size.
do $$
begin
  if not exists (
    select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where c.relname = 'idx_knowledge_chunks_embedding' and n.nspname = 'public'
  ) then
    execute 'create index idx_knowledge_chunks_embedding on public.knowledge_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100)';
  end if;
end$$;
