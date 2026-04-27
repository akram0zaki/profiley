# Changelog

All notable changes to Profiley are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres
to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - Unreleased

Initial backend + critical-path frontend wiring. Everything is workspace-only;
no Supabase project has been created yet. Follow
[`docs/concept/profiley-init-guide.md`](docs/concept/profiley-init-guide.md) to
provision and deploy.

### Added — Database (`supabase/migrations/0001` … `0023_*.sql`)

- Extensions: `pgcrypto`, `vector`, `citext`, `pg_cron`, `pg_net`.
- Core tables: `profiles`, `profile_preferences`, `profile_links`,
  `onboarding_answers`, `documents`, `knowledge_chunks` (pgvector
  `embedding vector(1536)` with HNSW index), `conversations`,
  `conversation_messages`, `recruiter_contacts`, `recruiter_events`,
  `profile_visits`, `ai_provider_configs`, `ai_models`,
  `feature_model_assignments`, `ai_call_logs`, `moderation_flags`,
  `rate_limit_buckets`, `audit_log`, `feature_flags`, plus avatar/voice
  scaffolding tables behind a flag.
- RLS policies for every user-scoped table + `is_admin()` helper +
  `match_knowledge_chunks(query_embedding, owner, k)` SQL RPC.
- `public_profile_view` exposing only published, non-private columns.
- Storage buckets `user_uploads`, `avatars`, `documents` with per-user
  path policies.
- AI provider/model seed (`0022_seed_ai_configs.sql`) — OpenAI default
  for chat / embeddings / moderation / STT / TTS, Gemini + Mistral chat
  fallbacks.
- `pg_cron` job (every minute) → `process_pending_documents()` →
  `pg_net.http_post` to the `process-document` edge function with
  `X-Cron-Secret`.

### Changed

- Added `0024_runtime_settings.sql` so cron/runtime config is stored in
  `public.runtime_settings` instead of custom `ALTER DATABASE ... SET`
  GUCs, which Supabase-managed Postgres rejected for this project.
- Updated the init guide and env example so the manual post-deploy step is
  an `insert ... on conflict` into `public.runtime_settings`.

### Added — Edge functions (`supabase/functions/`)

- `_shared/`: CORS, error envelope, structured logger, locale helpers,
  rate-limit helper, slug generator, service & user Supabase clients,
  `requireUser()` auth, Zod validation (`schemas.ts` + `parseJsonBody`),
  AI router (`router.ts` + capability adapters for chat / embeddings /
  moderation / STT / TTS) over OpenAI + Gemini + Mistral with
  `ai_call_logs` instrumentation, RAG (`chunkText`, `retrieveKnowledge`,
  `buildContext`), prompt builders (`personaChat`, `jobFit`),
  PDF/DOCX text extraction (unpdf + mammoth), recruiter analytics.
- Auth / profile / onboarding: `initialize-user-profile`,
  `update-user-locale`, `complete-onboarding`, `publish-profile`.
- Uploads + ingestion: `create-upload-url`, `finalize-upload`,
  `process-document` (cron-gated), `list-user-documents`,
  `delete-document`.
- Persona chat: `chat-persona` (public, rate-limited 20/hr session +
  60/hr IP, moderation + RAG + persisted conversations),
  `test-persona-chat` (owner preview, no rate limit, debug citations).
- `analyze-job-fit` with structured JSON schema output.
- Public profile + recruiters: `get-public-profile` (reads
  `public_profile_view`, logs visits), `track-recruiter-event`,
  `submit-recruiter-contact` (hCaptcha + Resend).
- Admin: `admin-list-models`, `admin-set-feature-model`,
  `admin-create-model`, `admin-toggle-model`, `admin-provider-health`
  (p50/p95/error/fallback aggregation), `admin-list-moderation`,
  `admin-resolve-moderation`, `admin-list-profiles`,
  `admin-force-unpublish`, `admin-rename-slug`.
- Post-MVP stubs: `create-avatar-profile`, `voice-transcribe` (return
  `501` unless `ENABLE_AVATAR_FOUNDATION=true`).

### Added — Frontend (`apps/frontend/src/`)

- `lib/supabase.ts` — Supabase client + `FUNCTIONS_BASE`.
- `lib/api.ts` — typed `callFn` helper (attaches anon key, bearer token,
  visitor session UUID) + per-endpoint wrappers; `ApiError` with HTTP
  status + error code.
- `lib/auth.ts` — `useAuth()` (loading/session/user/role), magic-link
  email sign-in, Google + GitHub OAuth, sign-out.
- `app/components/auth-guards.tsx` — `<RequireAuth>` and
  `<RequireAdmin>`.
- `app/pages/auth-callback.tsx` — completes OAuth/magic-link, calls
  `initialize-user-profile`, redirects to `?redirect=` or `/dashboard`.
- `app/pages/login.tsx` — replaced demo handlers with real magic-link
  + Google/GitHub OAuth, busy/error states, success banner.
- `app/components/chat-interface.tsx` — accepts `{profileSlug?,
  ownerMode?}` props, calls `api.chatPersona` or `api.testPersonaChat`,
  renders citation pills, surfaces 429 cooldown.
- `app/pages/chat-preview.tsx` — passes `ownerMode` to chat.
- `app/pages/public-profile.tsx` — passes `profileSlug` (router param)
  to chat.
- `app/App.tsx` — routes wrapped in `<RequireAuth>` / `<RequireAdmin>`,
  `/auth/callback` route added.

### Added — Infrastructure

- `apps/frontend/functions/public/[slug].ts` — Cloudflare Pages Function
  performing SSR meta injection (`<title>`, OG tags, JSON-LD Person
  schema) by fetching `get-public-profile` before delivering the SPA
  shell.
- `.github/workflows/ci.yml` — pnpm install + frontend build + Deno
  type-check of every `supabase/functions/*/index.ts`.
- `.github/workflows/deploy.yml` — Supabase migrations + edge function
  fan-out deploy + Cloudflare Pages publish via `wrangler-action`.

### Known follow-ups (not blocking initial bring-up)

- Wire remaining frontend pages against `lib/api.ts`: dashboard,
  onboarding, uploads, knowledge, job-fit-preview, settings,
  settings-ai, settings-avatar, admin (currently still scaffold UI from
  the Figma import).
- Add pgTAP RLS tests, k6 load tests, Sentry/PostHog instrumentation.
- Full a11y audit (Phases 11–12 in [profiley-plan.md](docs/concept/profiley-plan.md)).
