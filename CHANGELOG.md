# Changelog

All notable changes to Profiley are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres
to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - Unreleased

Initial backend + critical-path frontend wiring. Everything is workspace-only;
no Supabase project has been created yet. Follow
[`docs/concept/profiley-init-guide.md`](docs/concept/profiley-init-guide.md) to
provision and deploy.

### Added — "Fill from CV" on the profile page

- New edge function `extract-profile-from-cv` reads the user's most recent
  successfully-processed CVs (or a specific `documentId`), pulls the stored
  text from `document_extractions`, and returns a structured profile object
  (`fullName`, `headline`, `location`, `shortBio`, `longBio`, `skills[]`)
  via `chatStructured` against `PROFILE_EXTRACT_JSON_SCHEMA`. It does not
  persist anything — the frontend prefills the profile form for the user to
  review and save.

### Changed — multi-CV recency merge in `extract-profile-from-cv`

- When no specific `documentId` is provided, the function now feeds up to
  the 5 most recently uploaded processed CVs to the model (newest-first,
  per-CV and total character caps) instead of only the latest upload. Each
  CV is wrapped in its own `<CV index filename uploaded_at>` block.
- `PROFILE_EXTRACT_SYSTEM` instructs the model to determine recency from
  CV content (latest end date in Work Experience / Education) with upload
  date as tiebreaker, prefer values from the most recent CV for mutable
  fields (`fullName`, `headline`, `location`, `shortBio`, `longBio`), and
  merge `skills` across all versions. This fixes cases where uploading
  older CVs after a newer one caused stale name / location / role to
  override current values.
- Response now also includes `cvCount` and `sourceDocumentIds`.
- The profile page (`apps/frontend/src/app/pages/profile.tsx`) gains a
  "Fill from CV" button in the Basic Information card. Skills are merged
  case-insensitively with whatever the user already had. Surfaces specific
  errors for `NO_PROCESSED_CV` and `EMPTY_CV_TEXT`.
- Migration `0027_seed_profile_extract_assignment.sql` registers the
  `profile_extract` feature against the default chat model so it shows up in
  the admin model assignments UI (the router already falls back to the
  default when no assignment exists).

### Fixed — unsaved form state cleared on window refocus

- `useAuth` (`apps/frontend/src/lib/auth.ts`) now ignores benign
  `onAuthStateChange` events that don't change the user id, role, or
  access token. Supabase-js fires `SIGNED_IN` every time the tab regains
  visibility, which previously caused `useCurrentProfile.reload()` to
  re-run and overwrite unsaved edits on the profile and knowledge-base
  pages whenever the user switched apps and came back.

### Changed — Clearer rejection for legacy `.doc` uploads

- Legacy Microsoft Word `.doc` files are not extractable in our edge runtime
  (mammoth handles only the modern `.docx` zip-based format). Both the
  frontend uploads page and `create-upload-url` now detect `.doc` /
  `application/msword` early and surface a translated, actionable message
  ("save as `.docx` or PDF") instead of a generic "unsupported type"
  error.

### Fixed — Document ingestion stuck in `running`

- `process-document` is invoked by `pg_cron` via `pg_net` with an
  `X-Cron-Secret` header — but the Supabase Edge Functions gateway was
  rejecting every call with 401 `UNAUTHORIZED_NO_AUTH_HEADER` before the
  handler ran, because JWT verification was on. Each cron tick still flipped
  rows from `pending` → `running`, so they were trapped in `running` forever
  (the cron only picks up `pending`).
- `supabase/config.toml` now declares
  `[functions.process-document] verify_jwt = false`. The function must be
  deployed with `supabase functions deploy --no-verify-jwt process-document`
  (CLI v2.72.x doesn't honor the config-toml flag at deploy time yet).
- Migration 0025 hardens `public.process_pending_documents()` to also reclaim
  rows stuck in `running` for more than 5 minutes (incrementing
  `retry_count`), so transient gateway/network failures no longer require a
  manual reset.
- Migration 0026 is a one-off recovery that resets rows currently stuck in
  `running` so the JWT-disabled function can pick them up.

### Fixed — Uploads page polling flicker

- `apps/frontend/src/app/pages/uploads.tsx` now polls in the background without
  toggling the page-level `loading` flag, so the "Your Documents" card no
  longer unmounts/remounts (and the section no longer flickers) every 5
  seconds. The list state is also only swapped when a poll detects a real
  change (status, retry count, error, or timestamp), and chunk-count updates
  are skipped when the new map is identical to the previous one.

### Fixed — Edge function authentication

- `supabase/functions/_shared/auth/requireUser.ts` no longer relies on
  supabase-js to validate the caller. It now extracts the bearer JWT from the
  request `Authorization` header and calls `GET /auth/v1/user` directly with
  explicit `apikey` + `Authorization` headers. supabase-js's auth client
  manages its own Authorization header (ignoring the `global.headers` we set)
  and exhibits intermittent issues with the new `sb_publishable_*` API key
  format — both effects caused every authenticated edge function to return
  `UNAUTHORIZED` for valid signed-in users (observed on
  `initialize-user-profile`, `list-user-documents`, `create-upload-url`).
  New tests in `supabase/tests/requireUser.test.ts` cover the missing-header,
  success (asserts JWT + apikey are forwarded), and invalid-token paths.

### Added — Internationalization

- Per-locale JSON namespaces under
  `apps/frontend/src/app/i18n/locales/{en,nl,ar}/*.json` (19 namespaces × 3
  languages = 57 files), bundled at build time via Vite's
  `import.meta.glob` — no runtime fetch.
- Build-time loader at `apps/frontend/src/app/i18n/loader.ts` exposing
  `SUPPORTED_LANGUAGES`, `RTL_LANGUAGES`, `directionFor`,
  `isSupportedLanguage`, `translate`, and `detectLanguage`.
- Auto-detection of the user's language from `localStorage['profiley-language']`
  → `navigator.languages` → `navigator.language` → English fallback. Detection
  runs synchronously on first render so the initial paint is correct.
- `{param}` interpolation in `t(key, params?)` (e.g.
  `t('dashboard.subtitle', { name })`). Missing placeholders are preserved as
  `{name}` for visibility in development.
- Full Dutch (`nl`) and Arabic (`ar`) translations of every page: landing,
  dashboard, login, auth callback, onboarding, profile, uploads, knowledge,
  chat preview, job-fit, settings, AI settings, avatar settings, admin, and
  the public profile.
- RTL layout for Arabic: the language provider applies
  `document.documentElement.dir` / `lang` on every change, and `rtl.css`
  flips margins, alignment, and dropdown positioning.
- Test coverage for detection (stored value, navigator base subtag, fallback,
  unsupported codes), translate fallback chain, `{param}` interpolation,
  unknown-placeholder preservation, RTL flag application, and rejection of
  unsupported codes via `setLanguage`.

### Changed — Internationalization

- Migrated from a single in-context flat translation map in
  `language-context.tsx` to the per-namespace JSON loader; the context now
  delegates to `translate()` and accepts a `params` object for placeholders.
- Reduced the user-facing language picker on the settings and onboarding pages
  from seven options (en/ar/es/fr/de/zh/ja) to the three supported UI locales
  (en/nl/ar). Saving a preferred language on Settings now also updates the
  active UI language.
- Rewrote `docs/I18N_RTL_GUIDE.md` to document the new file layout, the
  `t(key, params)` API, the auto-detection chain, and the
  per-language-folder workflow for adding translations.

### Added — Testing

- Frontend unit test harness in `apps/frontend/` using Vitest + jsdom +
  Testing Library, with coverage support and setup shims for `localStorage`,
  `crypto.randomUUID`, and `import.meta.env`.
- Frontend tests covering `lib/api.ts`, `lib/auth.ts`, `lib/profile.ts`, the
  `cn()` class helper, and the language context's translation, direction, and
  persistence behavior.
- Deno unit test suite in `supabase/tests/` covering shared edge-function
  utilities: CORS handling, response envelopes, locale helpers, visitor-session
  and IP hashing helpers, slug normalization, prompt builders, text
  normalization, RAG chunking/context assembly, and request validation schemas.
- `supabase/deno.jsonc` task wiring so edge-function shared modules can be
  tested independently of deployment.
- Root package test commands: `test`, `test:frontend`,
  `test:frontend:watch`, `test:frontend:coverage`, `test:edge`, and
  `test:edge:watch`.
- `docs/testing.md` documenting the current test strategy, runtime split,
  coverage scope, deferred integration/e2e work, and contributor conventions
  for adding new tests.

### Changed

- `_shared/utils/slug.ts` now exports `baseSlug()` so the slug-normalization
  logic can be tested directly without coupling the suite to the live service
  client.
- `_shared/rag/chunkText.ts` now uses a Unicode-safe sentence-splitting regex;
  the previous escaped Arabic/CJK punctuation pattern was rejected by Deno's
  stricter regex parser under `/u` mode.

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
- `lib/profile.ts` — `useCurrentProfile()` + `updateProfile`,
  `updatePreferences`, `updateAppUser`, `avatarPublicUrl` helpers
  (direct supabase reads/writes under RLS).
- Wired §A deferred frontend pages to live Supabase API and storage:
  - `pages/dashboard.tsx` — aggregate counts (`recruiter_visits`,
    `conversations`, `job_fit_analyses`, `uploaded_documents`,
    `knowledge_chunks`) and recent `recruiter_events` feed.
  - `pages/onboarding.tsx` — calls `initialize-user-profile` on mount
    and `complete-onboarding` on step-3 finish; redirects to dashboard.
  - `pages/profile.tsx` — bound to `profiles` + `profile_preferences`;
    avatar upload to `avatars/{user.id}/avatar-*`; skills persisted
    via `onboarding_answers`; share-link copy + publish toggle.
  - `pages/uploads.tsx` — signed-URL flow (`create-upload-url` →
    storage `uploadToSignedUrl` → `finalize-upload` with SHA-256);
    polling for processing status; delete via `delete-document`.
  - `pages/knowledge.tsx` — direct `knowledge_chunks` query with
    document filename join, client-side filter, soft-delete aware.
  - `pages/job-fit-preview.tsx` — owner-side preview calling
    `analyze-job-fit` with current user's slug.
  - `pages/public-profile.tsx` — `get-public-profile`, recruiter
    tab-view tracking, owner-controlled chat / job-fit / contact tabs
    with hCaptcha (`VITE_CAPTCHA_SITE_KEY`) for `submit-recruiter-contact`.
  - `pages/settings.tsx` — language change via `update-user-locale`,
    privacy switches via `profile_preferences`, public toggle via
    `publish-profile`, sign-out.
  - `pages/settings-ai.tsx` — read-only registry view (per-user model
    overrides not yet supported); persona tone saved to
    `profile_preferences.ai_persona_tone`.
  - `pages/admin.tsx` — wired to `admin-list-models`,
    `admin-toggle-model`, `admin-create-model`,
    `admin-set-feature-model`, `admin-provider-health` with summary
    stats and Add-Model dialog.

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

- `pages/settings-avatar.tsx` left as the existing "coming soon"
  stub — the avatar foundation feature flag is still off.
- Add pgTAP RLS tests, k6 load tests, Sentry/PostHog instrumentation.
- Full a11y audit (Phases 11–12 in [profiley-plan.md](docs/concept/profiley-plan.md)).
