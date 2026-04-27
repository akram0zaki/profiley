-- 0010_conversations_and_messages.sql

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  visitor_session_id text,
  initiated_by text not null, -- owner | visitor
  mode text not null,         -- chat | preview
  language text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  role text not null, -- user | assistant | system
  content text not null,
  retrieval_context jsonb,
  model_used text,
  moderation_status text,
  created_at timestamptz not null default now()
);

create index if not exists idx_conversations_profile_id on public.conversations(profile_id);
create index if not exists idx_messages_conversation_id on public.messages(conversation_id);
create index if not exists idx_messages_created_at on public.messages(conversation_id, created_at);
