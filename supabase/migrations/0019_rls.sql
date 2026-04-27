-- 0019_rls.sql
-- Row level security: enable on every user-scoped table and add policies.

-- Helper to detect admin role from JWT claim.
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce((auth.jwt() ->> 'role') = 'admin', false);
$$;

-- Vector cosine match RPC (used by chat retrieval). Marked SECURITY DEFINER so the
-- service role caller can read across all of a single user's chunks safely.
create or replace function public.match_knowledge_chunks(
  p_user_id uuid,
  p_query_embedding vector(1536),
  p_match_count integer default 8,
  p_only_public boolean default true
)
returns table (
  id uuid,
  content text,
  source_kind text,
  document_id uuid,
  similarity float,
  metadata jsonb
)
language sql
stable
as $$
  select
    kc.id,
    kc.content,
    kc.source_kind,
    kc.document_id,
    1 - (kc.embedding <=> p_query_embedding) as similarity,
    kc.metadata
  from public.knowledge_chunks kc
  where kc.user_id = p_user_id
    and kc.deleted_at is null
    and (not p_only_public or coalesce((kc.metadata ->> 'public')::boolean, true) = true)
    and kc.embedding is not null
  order by kc.embedding <=> p_query_embedding
  limit greatest(p_match_count, 1);
$$;

-- Enable RLS on user-owned tables.
alter table public.app_users enable row level security;
alter table public.profiles enable row level security;
alter table public.profile_preferences enable row level security;
alter table public.onboarding_answers enable row level security;
alter table public.uploaded_documents enable row level security;
alter table public.document_extractions enable row level security;
alter table public.knowledge_chunks enable row level security;
alter table public.public_pages enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.job_fit_analyses enable row level security;
alter table public.avatar_profiles enable row level security;
alter table public.avatar_sessions enable row level security;
alter table public.ai_provider_configs enable row level security;
alter table public.feature_model_assignments enable row level security;
alter table public.moderation_events enable row level security;
alter table public.recruiter_visits enable row level security;
alter table public.recruiter_events enable row level security;
alter table public.recruiter_contacts enable row level security;
alter table public.ai_call_logs enable row level security;
alter table public.rate_limit_buckets enable row level security;

-- ---------- app_users ----------
drop policy if exists "users_select_self" on public.app_users;
create policy "users_select_self" on public.app_users
  for select using (auth.uid() = id or public.is_admin());

drop policy if exists "users_update_self" on public.app_users;
create policy "users_update_self" on public.app_users
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "admin_all_app_users" on public.app_users;
create policy "admin_all_app_users" on public.app_users
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- profiles ----------
drop policy if exists "owners_manage_profile" on public.profiles;
create policy "owners_manage_profile" on public.profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "anyone_reads_public_profile" on public.profiles;
create policy "anyone_reads_public_profile" on public.profiles
  for select using (public_visibility = true);

drop policy if exists "admin_all_profiles" on public.profiles;
create policy "admin_all_profiles" on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- profile_preferences ----------
drop policy if exists "owners_manage_preferences" on public.profile_preferences;
create policy "owners_manage_preferences" on public.profile_preferences
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- onboarding_answers ----------
drop policy if exists "owners_manage_onboarding" on public.onboarding_answers;
create policy "owners_manage_onboarding" on public.onboarding_answers
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- uploaded_documents ----------
drop policy if exists "owners_manage_documents" on public.uploaded_documents;
create policy "owners_manage_documents" on public.uploaded_documents
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- document_extractions ----------
drop policy if exists "owners_read_extractions" on public.document_extractions;
create policy "owners_read_extractions" on public.document_extractions
  for select using (auth.uid() = user_id);

drop policy if exists "owners_update_extractions" on public.document_extractions;
create policy "owners_update_extractions" on public.document_extractions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- knowledge_chunks ----------
drop policy if exists "owners_manage_chunks" on public.knowledge_chunks;
create policy "owners_manage_chunks" on public.knowledge_chunks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- public_pages ----------
drop policy if exists "owners_manage_public_pages" on public.public_pages;
create policy "owners_manage_public_pages" on public.public_pages
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "anyone_reads_public_pages" on public.public_pages;
create policy "anyone_reads_public_pages" on public.public_pages
  for select using (
    exists (
      select 1 from public.profiles p
      where p.user_id = public_pages.user_id and p.public_visibility = true
    )
  );

-- ---------- conversations / messages ----------
drop policy if exists "owners_read_conversations" on public.conversations;
create policy "owners_read_conversations" on public.conversations
  for select using (
    exists (
      select 1 from public.profiles p
      where p.id = conversations.profile_id and p.user_id = auth.uid()
    )
  );

drop policy if exists "owners_read_messages" on public.messages;
create policy "owners_read_messages" on public.messages
  for select using (
    exists (
      select 1 from public.conversations c
      join public.profiles p on p.id = c.profile_id
      where c.id = messages.conversation_id and p.user_id = auth.uid()
    )
  );

-- ---------- job_fit_analyses ----------
drop policy if exists "owners_read_job_fit" on public.job_fit_analyses;
create policy "owners_read_job_fit" on public.job_fit_analyses
  for select using (
    exists (
      select 1 from public.profiles p
      where p.id = job_fit_analyses.profile_id and p.user_id = auth.uid()
    )
  );

-- ---------- avatar tables ----------
drop policy if exists "owners_manage_avatar_profiles" on public.avatar_profiles;
create policy "owners_manage_avatar_profiles" on public.avatar_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "owners_read_avatar_sessions" on public.avatar_sessions;
create policy "owners_read_avatar_sessions" on public.avatar_sessions
  for select using (
    exists (
      select 1 from public.profiles p
      where p.id = avatar_sessions.profile_id and p.user_id = auth.uid()
    )
  );

-- ---------- recruiter_contacts ----------
drop policy if exists "owners_read_contacts" on public.recruiter_contacts;
create policy "owners_read_contacts" on public.recruiter_contacts
  for select using (
    exists (
      select 1 from public.profiles p
      where p.id = recruiter_contacts.profile_id and p.user_id = auth.uid()
    )
  );

-- ---------- recruiter_visits / recruiter_events ----------
drop policy if exists "owners_read_visits" on public.recruiter_visits;
create policy "owners_read_visits" on public.recruiter_visits
  for select using (
    exists (
      select 1 from public.profiles p
      where p.id = recruiter_visits.profile_id and p.user_id = auth.uid()
    )
  );

drop policy if exists "owners_read_events" on public.recruiter_events;
create policy "owners_read_events" on public.recruiter_events
  for select using (
    exists (
      select 1 from public.profiles p
      where p.id = recruiter_events.profile_id and p.user_id = auth.uid()
    )
  );

-- ---------- admin-only tables ----------
drop policy if exists "admin_only_provider_configs" on public.ai_provider_configs;
create policy "admin_only_provider_configs" on public.ai_provider_configs
  for all using (public.is_admin()) with check (public.is_admin());

-- Allow authenticated users to read provider configs (so the FE can render the
-- list without admin rights), but writes require admin.
drop policy if exists "auth_read_provider_configs" on public.ai_provider_configs;
create policy "auth_read_provider_configs" on public.ai_provider_configs
  for select using (auth.role() = 'authenticated');

drop policy if exists "admin_only_feature_assignments" on public.feature_model_assignments;
create policy "admin_only_feature_assignments" on public.feature_model_assignments
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "auth_read_feature_assignments" on public.feature_model_assignments;
create policy "auth_read_feature_assignments" on public.feature_model_assignments
  for select using (auth.role() = 'authenticated');

drop policy if exists "admin_only_moderation" on public.moderation_events;
create policy "admin_only_moderation" on public.moderation_events
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin_only_call_logs" on public.ai_call_logs;
create policy "admin_only_call_logs" on public.ai_call_logs
  for all using (public.is_admin()) with check (public.is_admin());

-- rate_limit_buckets is service-role only (no policies → blocked for clients).
-- Service role bypasses RLS, so no policies are required.
