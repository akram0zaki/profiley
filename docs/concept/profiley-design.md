# Profile.org — Design Document

## Purpose
This document translates the PRD and platform specs into build-ready implementation guidance. It covers:

- SQL schema and migration plan
- edge function folder structure
- API contracts
- user flows
- backlog by phase and priority

The design assumes the following stack:

- Frontend: Cloudflare Pages + React/Vite
- Backend: Supabase Postgres + Auth + Storage + Edge Functions
- Retrieval: pgvector in Supabase Postgres
- AI: pluggable model providers with feature-based routing
- Future avatar integration: HeyGen / Synthesia via provider abstraction


---

# 1. SQL Schema and Migration Plan

## 1.1 Schema Design Principles

1. Auth identity lives in Supabase Auth; application metadata lives in app tables.
2. Every user-owned table must support row-level security.
3. Public recruiter experiences must expose only explicitly published data.
4. Structured facts and vectorized knowledge should coexist.
5. AI provider configuration must be centrally managed and feature-addressable.
6. Schema should support future voice and avatar capabilities without major redesign.


## 1.2 Required Extensions

### Migration 0001_extensions.sql

Required extensions:

- pgcrypto
- vector
- citext

Example:

```sql
create extension if not exists pgcrypto;
create extension if not exists vector;
create extension if not exists citext;
```


## 1.3 Core Tables

### Migration 0002_app_users.sql

```sql
create table if not exists public.app_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email citext unique not null,
  auth_provider text,
  browser_locale text,
  timezone text,
  preferred_language text,
  onboarding_completed boolean not null default false,
  terms_accepted_at timestamptz,
  privacy_accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_seen_at timestamptz
);
```

### Migration 0003_profiles.sql

```sql
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  slug citext unique not null,
  full_name text not null,
  headline text,
  short_bio text,
  long_bio text,
  current_location text,
  profile_photo_path text,
  public_visibility boolean not null default false,
  recruiter_intro text,
  persona_style text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_user_id_unique unique (user_id)
);

create index if not exists idx_profiles_slug on public.profiles(slug);
create index if not exists idx_profiles_user_id on public.profiles(user_id);
```

### Migration 0004_profile_preferences.sql

```sql
create table if not exists public.profile_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  response_language_mode text not null default 'query_language',
  allow_public_chat boolean not null default true,
  allow_job_fit_analysis boolean not null default true,
  allow_document_citation boolean not null default true,
  ai_persona_tone text,
  model_chat_override text,
  model_stt_override text,
  model_tts_override text,
  model_embedding_override text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profile_preferences_user_id_unique unique (user_id)
);
```

### Migration 0005_onboarding_answers.sql

```sql
create table if not exists public.onboarding_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  question_key text not null,
  answer_text text,
  answer_json jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_onboarding_answers_user_id on public.onboarding_answers(user_id);
create index if not exists idx_onboarding_answers_question_key on public.onboarding_answers(question_key);
```

### Migration 0006_uploaded_documents.sql

```sql
create table if not exists public.uploaded_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  storage_bucket text not null,
  storage_path text not null,
  original_filename text not null,
  mime_type text,
  file_size bigint,
  source_type text not null default 'upload',
  visibility text not null default 'private',
  processing_status text not null default 'pending',
  extracted_text_status text not null default 'pending',
  checksum_sha256 text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_uploaded_documents_user_id on public.uploaded_documents(user_id);
create index if not exists idx_uploaded_documents_processing_status on public.uploaded_documents(processing_status);
```

### Migration 0007_document_extractions.sql

```sql
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
```

### Migration 0008_knowledge_chunks.sql

```sql
create table if not exists public.knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  document_id uuid references public.uploaded_documents(id) on delete cascade,
  source_kind text not null,
  chunk_index integer not null,
  content text not null,
  token_count integer,
  metadata jsonb not null default '{}'::jsonb,
  embedding vector(1536),
  created_at timestamptz not null default now()
);

create index if not exists idx_knowledge_chunks_user_id on public.knowledge_chunks(user_id);
create index if not exists idx_knowledge_chunks_document_id on public.knowledge_chunks(document_id);
create index if not exists idx_knowledge_chunks_source_kind on public.knowledge_chunks(source_kind);
```

Recommended follow-up after model choice is stable:

```sql
create index if not exists idx_knowledge_chunks_embedding
on public.knowledge_chunks
using ivfflat (embedding vector_cosine_ops)
with (lists = 100);
```

### Migration 0009_public_pages.sql

```sql
create table if not exists public.public_pages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  slug citext unique not null,
  theme_name text,
  accent_color text,
  hero_layout text,
  intro_video_path text,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint public_pages_user_id_unique unique (user_id)
);
```

### Migration 0010_conversations_and_messages.sql

```sql
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  visitor_session_id text,
  initiated_by text not null,
  mode text not null,
  language text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  role text not null,
  content text not null,
  retrieval_context jsonb,
  model_used text,
  moderation_status text,
  created_at timestamptz not null default now()
);

create index if not exists idx_conversations_profile_id on public.conversations(profile_id);
create index if not exists idx_messages_conversation_id on public.messages(conversation_id);
```

### Migration 0011_job_fit_analyses.sql

```sql
create table if not exists public.job_fit_analyses (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete set null,
  job_title text,
  company_name text,
  job_description text not null,
  fit_score numeric,
  strengths text[] not null default '{}',
  gaps text[] not null default '{}',
  risks text[] not null default '{}',
  transferable_strengths text[] not null default '{}',
  reasoning_summary text,
  confidence_label text,
  model_used text,
  created_at timestamptz not null default now()
);

create index if not exists idx_job_fit_analyses_profile_id on public.job_fit_analyses(profile_id);
```

### Migration 0012_ai_provider_configs.sql

```sql
create table if not exists public.ai_provider_configs (
  id uuid primary key default gen_random_uuid(),
  capability text not null,
  provider text not null,
  model_key text not null,
  display_name text not null,
  is_active boolean not null default true,
  is_default boolean not null default false,
  config_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.feature_model_assignments (
  id uuid primary key default gen_random_uuid(),
  feature_key text not null,
  capability text not null,
  provider_config_id uuid not null references public.ai_provider_configs(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint feature_model_assignments_unique unique (feature_key, capability)
);
```

### Migration 0013_moderation_and_analytics.sql

```sql
create table if not exists public.moderation_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  conversation_id uuid references public.conversations(id) on delete set null,
  event_type text not null,
  input_excerpt text,
  resolution text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.recruiter_visits (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  visitor_session_id text,
  referrer text,
  locale text,
  timezone text,
  created_at timestamptz not null default now()
);

create table if not exists public.recruiter_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete set null,
  event_name text not null,
  event_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
```

### Migration 0014_avatar_foundation.sql

```sql
create table if not exists public.avatar_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  source_photo_path text not null,
  voice_provider text,
  voice_model text,
  avatar_provider text,
  avatar_profile_id text,
  status text not null default 'not_configured',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.avatar_sessions (
  id uuid primary key default gen_random_uuid(),
  avatar_profile_id uuid not null references public.avatar_profiles(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  session_status text not null,
  provider_session_id text,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now()
);
```


## 1.4 Helper Functions and Triggers

### Migration 0015_updated_at_triggers.sql

```sql
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
```

Attach to tables with `updated_at` columns.

Example:

```sql
create trigger set_updated_at_app_users
before update on public.app_users
for each row execute function public.set_updated_at();
```

Repeat for:
- profiles
- profile_preferences
- onboarding_answers
- uploaded_documents
- public_pages
- conversations
- ai_provider_configs
- feature_model_assignments
- avatar_profiles


## 1.5 RLS Policies

### Migration 0016_rls.sql

Enable RLS on all user-owned tables.

Example pattern:

```sql
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
```

Owner read/write policy example:

```sql
create policy "users_manage_own_profile"
on public.profiles
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
```

Public read policy for published recruiter pages should use a dedicated view instead of broad direct table exposure.

Recommended public view:

```sql
create or replace view public.public_profile_view as
select
  p.id,
  p.slug,
  p.full_name,
  p.headline,
  p.short_bio,
  p.recruiter_intro,
  p.persona_style,
  p.profile_photo_path,
  p.public_visibility
from public.profiles p
where p.public_visibility = true;
```


## 1.6 Storage Buckets

### Required Buckets

- `user-uploads`
- `profile-media`
- `avatar-media`

Recommended bucket visibility:

- all private by default
- public delivery only through signed URLs or explicitly public derivative assets


## 1.7 Seed Data Migrations

### Migration 0017_seed_ai_configs.sql

Seed default provider rows for:
- chat
- embeddings
- stt
- tts
- moderation

Seed default feature assignments for:
- persona_chat
- job_fit_analysis
- onboarding_assistant
- recruiter_summary


---

# 2. Edge Function Folder Structure

## 2.1 Design Principles

1. One function per externally-invoked capability.
2. Shared provider adapters and utilities live in `_shared`.
3. Retrieval, moderation, and prompt assembly must be reusable.
4. Avoid duplicating auth, validation, and logging logic.


## 2.2 Recommended Structure

```text
supabase/
  functions/
    _shared/
      auth/
        requireUser.ts
        optionalUser.ts
      db/
        serviceClient.ts
        typedQueries.ts
      ai/
        router.ts
        providers/
          openai.ts
          mistral.ts
          gemini.ts
          elevenlabs.ts
        capabilities/
          chat.ts
          embeddings.ts
          stt.ts
          tts.ts
          moderation.ts
      rag/
        retrieveKnowledge.ts
        buildContext.ts
        chunkText.ts
        rerank.ts
      prompts/
        personaChat.ts
        jobFit.ts
        moderation.ts
      documents/
        extractText.ts
        normalizeText.ts
        detectLanguage.ts
      analytics/
        trackEvent.ts
      validation/
        schemas.ts
      utils/
        errors.ts
        logger.ts
        cors.ts
        locale.ts
        time.ts

    initialize-user-profile/
      index.ts

    update-user-locale/
      index.ts

    complete-onboarding/
      index.ts

    create-upload-url/
      index.ts

    finalize-upload/
      index.ts

    process-document/
      index.ts

    chat-persona/
      index.ts

    analyze-job-fit/
      index.ts

    test-persona-chat/
      index.ts

    transcribe-audio/
      index.ts

    synthesize-speech/
      index.ts

    get-public-profile/
      index.ts

    list-user-documents/
      index.ts

    publish-profile/
      index.ts

    admin-list-models/
      index.ts

    admin-set-feature-model/
      index.ts

    admin-provider-health/
      index.ts

    create-avatar-profile/
      index.ts

    start-avatar-session/
      index.ts

    stop-avatar-session/
      index.ts
```


## 2.3 Function Responsibilities

### initialize-user-profile
Creates `app_users`, `profiles`, and `profile_preferences` if missing after first auth.

### update-user-locale
Stores browser locale, timezone, and preferred language.

### complete-onboarding
Stores onboarding answers and marks onboarding complete.

### create-upload-url
Returns signed upload target or storage flow details for client upload.

### finalize-upload
Creates `uploaded_documents` row after successful client upload.

### process-document
Extracts text, normalizes content, chunks it, embeds it, and inserts `knowledge_chunks`.

### chat-persona
Handles recruiter/public chat grounded only in profile context.

### analyze-job-fit
Produces structured match analysis using candidate-only evidence.

### test-persona-chat
Owner-only preview mode to test their own public AI persona before publishing.

### transcribe-audio
Optional STT capability for future voice mode.

### synthesize-speech
Optional TTS capability for future voice/avatar mode.

### get-public-profile
Returns sanitized public page payload by slug.

### publish-profile
Toggles public visibility and validates minimum publication requirements.

### admin-list-models
Returns model registry and feature assignments.

### admin-set-feature-model
Updates assigned model for a feature/capability pair.

### admin-provider-health
Returns latency/error/fallback stats per provider.

### create-avatar-profile / start-avatar-session / stop-avatar-session
Future-compatible avatar orchestration boundary.


---

# 3. API Contracts

## 3.1 API Design Principles

- JSON over HTTPS
- edge functions return consistent envelope shapes
- all write endpoints validate auth unless explicitly public
- public recruiter endpoints expose only published content
- structured outputs should use stable field names for frontend rendering

Recommended response envelope:

```json
{
  "success": true,
  "data": {},
  "error": null,
  "meta": {}
}
```

Recommended error envelope:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request payload"
  },
  "meta": {}
}
```


## 3.2 Authenticated Endpoints

### POST /functions/v1/initialize-user-profile

Purpose:
Create missing app-layer user records after auth.

Request:

```json
{
  "email": "user@example.com",
  "browserLocale": "en-NL",
  "timezone": "Europe/Amsterdam",
  "preferredLanguage": "en"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "profileId": "uuid",
    "slug": "akram-zaki"
  },
  "error": null,
  "meta": {}
}
```

### POST /functions/v1/update-user-locale

Request:

```json
{
  "browserLocale": "en-NL",
  "timezone": "Europe/Amsterdam",
  "preferredLanguage": "en"
}
```

### POST /functions/v1/complete-onboarding

Request:

```json
{
  "answers": [
    {
      "questionKey": "target_roles",
      "answerText": "AI product engineer, full-stack builder"
    },
    {
      "questionKey": "industries",
      "answerJson": ["fitness", "AI", "SaaS"]
    }
  ]
}
```

### POST /functions/v1/create-upload-url

Request:

```json
{
  "filename": "Akram_CV.pdf",
  "mimeType": "application/pdf",
  "bucket": "user-uploads"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "path": "user-id/uuid-Akram_CV.pdf",
    "bucket": "user-uploads",
    "signedUrl": "https://..."
  },
  "error": null,
  "meta": {}
}
```

### POST /functions/v1/finalize-upload

Request:

```json
{
  "bucket": "user-uploads",
  "path": "user-id/uuid-Akram_CV.pdf",
  "originalFilename": "Akram_CV.pdf",
  "mimeType": "application/pdf",
  "fileSize": 532001
}
```

Response:

```json
{
  "success": true,
  "data": {
    "documentId": "uuid",
    "processingStatus": "pending"
  },
  "error": null,
  "meta": {}
}
```

### POST /functions/v1/process-document

Request:

```json
{
  "documentId": "uuid"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "documentId": "uuid",
    "chunksCreated": 28,
    "processingStatus": "completed"
  },
  "error": null,
  "meta": {}
}
```

### GET /functions/v1/list-user-documents

Response:

```json
{
  "success": true,
  "data": {
    "documents": [
      {
        "id": "uuid",
        "originalFilename": "Akram_CV.pdf",
        "processingStatus": "completed",
        "createdAt": "2026-03-16T12:00:00Z"
      }
    ]
  },
  "error": null,
  "meta": {}
}
```

### POST /functions/v1/test-persona-chat

Owner-only test mode.

Request:

```json
{
  "message": "What kind of engineer am I?",
  "conversationId": null,
  "language": "en"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "conversationId": "uuid",
    "reply": "You are presented as a full-stack AI product engineer...",
    "citations": [
      {
        "label": "CV",
        "sourceType": "document",
        "documentId": "uuid"
      }
    ],
    "modelUsed": "provider:model"
  },
  "error": null,
  "meta": {}
}
```

### POST /functions/v1/publish-profile

Request:

```json
{
  "publicVisibility": true
}
```

Response:

```json
{
  "success": true,
  "data": {
    "slug": "akram-zaki",
    "publicVisibility": true,
    "publicUrl": "/public/akram-zaki"
  },
  "error": null,
  "meta": {}
}
```


## 3.3 Public Recruiter Endpoints

### GET /functions/v1/get-public-profile?slug=akram-zaki

Response:

```json
{
  "success": true,
  "data": {
    "profile": {
      "slug": "akram-zaki",
      "fullName": "Akram Zaki",
      "headline": "AI product engineer and founder",
      "shortBio": "Builds privacy-first AI products",
      "recruiterIntro": "Ask the AI about projects, fit, and strengths"
    },
    "highlights": [
      "AI product architecture",
      "Supabase and Cloudflare",
      "privacy-first product design"
    ]
  },
  "error": null,
  "meta": {}
}
```

### POST /functions/v1/chat-persona

Public or rate-limited guest endpoint.

Request:

```json
{
  "slug": "akram-zaki",
  "message": "Would Akram be a good fit for a senior AI product role?",
  "conversationId": null,
  "language": "en",
  "visitorSessionId": "anon-session-123"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "conversationId": "uuid",
    "reply": "Based on the candidate materials, Akram appears strongest in...",
    "citations": [
      {
        "label": "Project summary",
        "sourceType": "onboarding"
      }
    ],
    "guardrailTriggered": false,
    "modelUsed": "provider:model"
  },
  "error": null,
  "meta": {
    "rateLimitRemaining": 9
  }
}
```

### POST /functions/v1/analyze-job-fit

Request:

```json
{
  "slug": "akram-zaki",
  "jobTitle": "Senior Product Engineer",
  "companyName": "Example AI",
  "jobDescription": "We are looking for a product-minded engineer with AI experience...",
  "language": "en",
  "visitorSessionId": "anon-session-123"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "analysisId": "uuid",
    "fitBand": "Good match with gaps",
    "fitScore": 78,
    "strengths": [
      "Strong product+engineering crossover",
      "Experience with AI-powered application design"
    ],
    "gaps": [
      "No clear evidence of large enterprise procurement ownership"
    ],
    "risks": [
      "Some leadership scope may need validation"
    ],
    "transferableStrengths": [
      "Founder-level execution",
      "Privacy-aware architecture"
    ],
    "reasoningSummary": "The candidate appears well aligned on product-building and AI implementation...",
    "confidenceLabel": "medium",
    "citations": [
      {
        "label": "CV",
        "sourceType": "document"
      }
    ],
    "modelUsed": "provider:model"
  },
  "error": null,
  "meta": {}
}
```


## 3.4 Admin Endpoints

### GET /functions/v1/admin-list-models
Returns provider configs and current assignments.

### POST /functions/v1/admin-set-feature-model

Request:

```json
{
  "featureKey": "persona_chat",
  "capability": "chat",
  "providerConfigId": "uuid"
}
```

### GET /functions/v1/admin-provider-health
Returns operational stats.


## 3.5 Future Voice/Avatar Endpoints

### POST /functions/v1/transcribe-audio
### POST /functions/v1/synthesize-speech
### POST /functions/v1/create-avatar-profile
### POST /functions/v1/start-avatar-session
### POST /functions/v1/stop-avatar-session

These should exist as reserved contracts even if disabled behind feature flags initially.


---

# 4. User Flows

## 4.1 First-Time User Authentication and Setup

### Goal
Convert first login directly into an initialized account without separate sign-up flow.

### Flow
1. User opens landing page.
2. User clicks Continue with Google, Continue with Apple, or Magic Link.
3. Supabase Auth completes authentication.
4. Frontend detects authenticated session.
5. Frontend calls `initialize-user-profile` with locale, timezone, preferred language.
6. Backend creates `app_users`, `profiles`, and `profile_preferences` if missing.
7. User is redirected to onboarding.

### Edge Cases
- Returning user skips onboarding if completed.
- Missing locale/timezone falls back to browser values captured client-side.
- Slug collision resolved automatically with suffixing.


## 4.2 Onboarding Flow

### Goal
Collect enough structured information to improve AI quality beyond uploaded documents.

### Flow
1. User confirms full name, headline, and preferred language.
2. User uploads CV and optional portfolio materials.
3. User answers onboarding questions.
4. User previews AI persona summary.
5. User chooses whether to publish profile now or later.
6. `complete-onboarding` stores responses and marks completion.

### Recommended Questions
- What roles are you targeting?
- What industries are you strongest in?
- What are your top strengths?
- What should the AI avoid claiming unless explicitly supported?
- What tone should your public AI representation use?


## 4.3 Document Upload and Knowledge Ingestion

### Goal
Convert uploads into grounded retrieval-ready knowledge.

### Flow
1. User selects file.
2. Frontend requests upload URL via `create-upload-url`.
3. Frontend uploads file to Supabase Storage.
4. Frontend calls `finalize-upload`.
5. Frontend triggers `process-document` or a queued process kicks off.
6. Backend extracts text, chunks content, embeds chunks, stores them.
7. UI updates processing state from pending to completed.

### Failure States
- unsupported file type
- extraction failure
- embedding failure
- document too large

UI should show retriable states.


## 4.4 Owner Persona Preview Flow

### Goal
Allow candidate to test and refine their AI before publishing.

### Flow
1. User opens Chat Preview.
2. User asks sample recruiter questions.
3. Frontend calls `test-persona-chat`.
4. Backend retrieves knowledge and responds with citations.
5. User identifies weak or inaccurate areas.
6. User updates onboarding data or uploads more evidence.


## 4.5 Publish Public Profile Flow

### Goal
Make the profile available to recruiters only after minimum quality standards are met.

### Flow
1. User clicks Publish.
2. Frontend calls `publish-profile`.
3. Backend validates:
   - profile has name/headline/bio
   - at least one processed knowledge source exists
   - public chat preference is allowed
4. Backend sets `public_visibility = true`.
5. User receives public URL.

### Optional Validation Rule
Require at least one successful persona preview before publish.


## 4.6 Recruiter Public Exploration Flow

### Goal
Allow a visitor to quickly understand the candidate and ask targeted questions.

### Flow
1. Recruiter opens `/public/{slug}`.
2. Frontend calls `get-public-profile`.
3. Page shows hero summary, strengths, and chat panel.
4. Recruiter asks question.
5. Frontend calls `chat-persona` with visitor session id.
6. Backend applies moderation and retrieval.
7. AI responds with grounded answer.
8. Recruiter optionally asks follow-up questions.

### Guardrails
- rate limit anonymous sessions
- block off-topic use
- allow profile owner to disable public chat


## 4.7 Job-Fit Analysis Flow

### Goal
Provide structured, conservative match analysis for a pasted job description.

### Flow
1. Recruiter pastes job description on public page.
2. Frontend calls `analyze-job-fit`.
3. Backend moderates input.
4. Backend retrieves relevant candidate evidence.
5. AI returns structured strengths, gaps, risks, fit band, and confidence.
6. Frontend renders analysis cards.
7. Event is logged for analytics.

### Critical Rule
The analysis must use only candidate materials, not broad internet research.


## 4.8 Admin Model Assignment Flow

### Goal
Allow central control of providers and fallbacks.

### Flow
1. Admin opens model registry page.
2. Frontend calls `admin-list-models`.
3. Admin changes feature assignment.
4. Frontend submits `admin-set-feature-model`.
5. Backend updates assignment row.
6. Future calls use new provider mapping.


## 4.9 Future Avatar Setup Flow

### Goal
Prepare for live avatar without blocking MVP.

### Flow
1. User opens avatar settings.
2. User uploads source image and chooses voice preferences.
3. Frontend calls `create-avatar-profile`.
4. Backend stores config and optionally registers with external provider.
5. Status remains hidden/experimental until feature flag enabled.


---

# 5. Backlog by Phase and Priority

## 5.1 Priority Definitions

- P0: required for MVP launch
- P1: should follow soon after MVP or included if capacity allows
- P2: valuable but deferrable
- P3: future/experimental


## Phase 0 — Foundation and Platform Setup

### P0
- Set up Supabase project, environments, and secrets strategy
- Set up Cloudflare Pages project and deployment pipeline
- Create initial SQL migrations
- Enable pgvector and storage buckets
- Configure Supabase Auth providers: Google, Apple, magic link
- Create shared edge function utilities
- Define feature flag system

### P1
- Add admin-only environment diagnostics screen
- Add structured logging and request correlation ids


## Phase 1 — Auth, Profile, and Onboarding MVP

### P0
- Unified login/sign-up UX
- `initialize-user-profile` edge function
- Browser locale and timezone capture
- Preferred language persistence
- Profile editor basics
- Onboarding questionnaire
- Profile slug generation

### P1
- Better locale fallback strategy
- Inline profile completeness scoring

### P2
- Multi-step guided onboarding polish


## Phase 2 — Uploads and Knowledge Ingestion MVP

### P0
- Secure upload flow
- `create-upload-url`, `finalize-upload`, `process-document`
- Basic text extraction for PDF, DOCX, TXT
- Semantic chunking utility
- Embeddings integration
- Knowledge chunk persistence
- Upload processing UI states

### P1
- Extraction quality scoring
- Retry failed ingestion jobs
- Structured fact extraction from documents

### P2
- GitHub/portfolio metadata import
- OCR fallback for difficult documents only when necessary


## Phase 3 — Persona Chat MVP

### P0
- `chat-persona` endpoint
- retrieval pipeline
- persona chat prompt template
- grounding and citation support
- owner preview chat
- public chat UI
- anonymous session rate limiting
- moderation input/output pass

### P1
- follow-up memory within conversation thread
- answer quality instrumentation
- response banding for confidence

### P2
- multilingual answer refinement by query language
- richer evidence cards


## Phase 4 — Job-Fit Analysis MVP

### P0
- `analyze-job-fit` endpoint
- structured response schema
- fit bands and confidence labels
- public job-fit widget
- analytics logging for job-fit usage

### P1
- recruiter-friendly downloadable summary
- improved gap classification logic

### P2
- multiple JD comparison mode
- role-family templates


## Phase 5 — Admin AI Routing and Observability

### P0
- model registry tables and seed data
- `admin-list-models`
- `admin-set-feature-model`
- shared provider router
- logging for model/provider usage

### P1
- provider health dashboard
- fallback tracking
- cost estimation dashboard

### P2
- per-user model override settings


## Phase 6 — Public Profile Experience and Analytics

### P0
- public profile page
- hero summary and strengths
- recruiter analytics tables
- visit/event tracking
- publish/unpublish flow

### P1
- customizable themes
- SEO metadata controls
- recruiter contact CTA variations

### P2
- A/B testing of public layouts


## Phase 7 — Hardening, Trust, and Compliance

### P0
- RLS review and tests
- abuse prevention rules
- clear AI disclosure copy
- unknown-claim handling enforcement
- privacy and terms capture

### P1
- claim validation pass for high-impact outputs
- admin moderation review screen

### P2
- advanced prompt injection defense heuristics


## Phase 8 — Voice and Avatar Foundation

### P1
- `transcribe-audio`
- `synthesize-speech`
- avatar tables and settings page
- provider abstraction for avatar service

### P2
- candidate voice preview
- audio chat beta

### P3
- live avatar session orchestration
- recruiter video call mode


## 5.2 Suggested Delivery Sequence

### Release 1
- auth
- onboarding
- uploads
- ingestion
- owner preview chat

### Release 2
- public profile
- public recruiter chat
- job-fit analysis
- analytics basics

### Release 3
- admin model routing
- provider observability
- trust hardening

### Release 4
- voice foundation
- avatar setup foundation


## 5.3 Definition of Done for MVP Launch

The MVP is launch-ready when all of the following are true:

- users can authenticate with Google, Apple, or magic link
- locale, timezone, and preferred language are stored
- users can upload documents securely
- at least one supported document type can be processed into knowledge chunks
- profile owner can test persona chat privately
- public profile page can be published and visited
- recruiters can ask grounded questions
- recruiters can submit a job description and receive structured job-fit output
- admin can switch chat and embedding model assignments without code changes
- analytics capture visits, chats, and job-fit usage
- all critical tables and storage rules are protected by RLS


---

# 6. Recommended Immediate Next Deliverables

After this design document, the next build-ready artifacts should be:

1. actual SQL migration files in repo-ready order
2. TypeScript types for API request/response contracts
3. edge function implementation stubs
4. frontend route map and component tree
5. prompt pack for persona chat and job-fit analysis
6. admin panel wireframes

This sequence will let you move directly from design into implementation without rethinking the platform structure.

