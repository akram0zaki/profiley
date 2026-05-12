# Changelog

All notable changes to Profiley are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres
to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 2026-05-04

### Added — Structured social links with per-platform public visibility

- Uploaded document ingestion now detects supported social/profile links and IDs (`linkedin`, `github`, `twitter`, `reddit`, `discord`, `instagram`, `tiktok`, `youtube`) and stores canonical values on the owner profile without overwriting existing entries.
- The profile editor now exposes those structured fields directly, lets the owner review or edit each value, and adds a per-platform switch to decide whether it appears on the public profile.
- Public profile payloads and the recruiter-facing profile page now only expose social links whose per-platform visibility switch is enabled.

### Fixed — Logo gradient missing in RTL (Arabic) mode

- Fixed a regression where the Profiley "P" logo lost its purple-to-blue gradient background in Arabic (RTL) mode. Tailwind v4 changed how gradients are implemented: the direction is now set via the `--tw-gradient-position` CSS variable, not in `background-image`. The RTL CSS now correctly overrides `--tw-gradient-position` for `.bg-gradient-to-br` and related classes, restoring the logo's appearance in RTL layouts.

## 2026-05-03 - Initial Release

### Added — WCAG 2.2 AA accessibility audit and remediation

- Added [docs/audits/a11y-20260504.md](docs/audits/a11y-20260504.md), a comprehensive 19-item accessibility audit report covering all frontend pages, components, styles, and UI patterns against WCAG 2.2 Level AA.
- Implemented fixes for all 19 findings across 40+ files:
  - **Skip-to-content link** — new `SkipLink` component as the first focusable element, `id="main-content"` on `<main>`.
  - **Page title management** — `useDocumentTitle` hook created and applied to all 18 page components so `document.title` updates on every route change.
  - **Focus management on SPA navigation** — `ScrollToTop` now moves keyboard focus to `<main>` after route transitions.
  - **SimpleDropdown replaced with Radix DropdownMenu** — removed the inaccessible custom dropdown in `app-layout.tsx`, `landing.tsx`, and `legal-layout.tsx` in favor of the existing Radix UI dropdown with full keyboard and ARIA support.
  - **Icon-only button labels** — added `aria-label` to theme toggles, mobile menu, language selector, user menu, chat send, and file upload buttons; added `aria-pressed` on theme toggles and `aria-expanded` on mobile menu.
  - **Color contrast** — darkened `--muted-foreground` in both light mode (`#59596b`, ≈5.5:1) and dark mode (`oklch(0.645 0 0)`, ≈6:1) to meet WCAG AA 4.5:1 minimum for normal text.
  - **Reduced motion** — added `@media (prefers-reduced-motion: reduce)` rule to disable all animations and transitions when the user's OS preference is set.
  - **Chat screen-reader announcements** — message list uses `role="log"` with `aria-live="polite"`; citations use `aria-label` instead of `title`; errors use `role="alert"`; cooldowns use `role="status"`.
  - **Form labels** — added visible `<Label>` components to job-fit inputs (title, company, description); added `aria-label` to knowledge search and file upload buttons.
  - **Progress bar** — exposed `aria-label`, `aria-labelledby`, and `getValueLabel` props; applied labels to onboarding progress.
  - **Toast accessibility** — configured sonner `Toaster` with `role="status"`, `aria-live="polite"`, and close button.
  - **Loading states** — auth guards now render an accessible spinner with `role="status"` instead of returning `null`.
  - **Onboarding stepper** — added `role="list"`, `role="listitem"`, and `aria-current="step"` semantics.
  - **Account deletion** — linked confirmation input to its hint via `aria-describedby`.
- Added 23 new i18n keys across all 3 supported languages (English, Dutch, Arabic) covering a11y labels, chat announcements, onboarding progress, and form placeholders.

### Fixed — Chat greeting uses the profile owner name

- Updated the chat opening message to introduce the assistant as the AI avatar of the profile owner instead of a generic AI persona label.
- Wired the public-profile and owner-preview chat surfaces to pass the owner name into the shared chat component, and added focused frontend coverage for the greeting update.

### Fixed — Legal footer navigation and AI settings visibility

- Footer links to Terms, Privacy, and Cookies now reset the document scroll position to the top on route change so legal pages open from the beginning instead of preserving the prior page scroll.
- Updated the frontend HTML title to `Profiley — Let Your Experience Speak`.
- Removed the end-user `Custom System Prompt` block and limited the `Active Models` section in Settings → AI Configuration to admin users only.

### Fixed — Selective legal re-acceptance prompt

- The legal acceptance screen now only prompts for the document whose version is stale instead of forcing users to re-check both Terms and Privacy when only one changed.
- Added a focused frontend test covering the partial re-acceptance flow.

### Added — Compliance feature validation plan

- Added `docs/testing/features/compliance-20260503-test-plan.md`, a comprehensive execution checklist for validating the completed compliance rollout end to end.
- The plan covers automated regressions, manual browser flows, scheduler-backed deletion and retention jobs, DSAR/export operations, AI transparency checks, and documentation consistency review with per-case status tracking.

### Added — Compliance controls, runbooks, and governance baseline

- Implemented versioned legal acceptance with a dedicated acceptance gate, shared legal-version constants, persistence tests, and protected-route enforcement.
- Added a Settings account-deletion flow with a 30-day grace period, cancellation support, and scheduled backend processing for due deletions.
- Added enforced retention support for recruiter telemetry, moderation events, AI call logs, and job-fit analyses, plus the retention matrix and runtime wiring for scheduled purge processing.
- Added a self-service Settings export flow backed by the new `export-user-data` edge function, plus updated DSAR/export documentation under [docs/compliance](docs/compliance).
- Added the GDPR accountability pack under [docs/compliance](docs/compliance), including ROPA, lawful bases, DPIA, security measures, incident response, vendor register, and international transfers notes.
- Added recruiter-facing AI transparency notices, human-oversight guidance, and AI governance documents for intended use, prohibited use, risk monitoring, incident handling, evaluation, and operator literacy.
- Added P2 hardening controls for recruiter-facing AI: prompt-versioned audit logs, structured safety metadata, evaluation fixtures, response/case templates for privacy requests, and a runtime setting that can disable public job-fit globally.
- Added migration `0033_backfill_runtime_function_urls.sql` so environments with an existing `process_document_url` can backfill the newer cron target URLs through repo-managed SQL instead of ad hoc remote updates.
- Expanded the public privacy-policy processor table and related legal tests so the documented processor footprint matches the vendors currently evidenced in the repo.

### Added — GDPR and EU AI Act compliance audit

- Added [docs/audits/compliance.md](docs/audits/compliance.md), an evidence-based repository audit of Profiley's current GDPR and EU AI Act posture.
- Documented current strengths, direct policy-to-product mismatches, unverified legal and operational dependencies, and the highest-priority remediation items.

### Added — Compliance implementation plan

- Added [docs/plans/compliance-20260503.md](docs/plans/compliance-20260503.md), a comprehensive P0/P1/P2 execution plan to address the GDPR and EU AI Act gaps identified in the compliance audit.
- The plan is agent-oriented and includes fixed operator decisions, file-level implementation targets, acceptance criteria, validation scope, and required docs-as-code deliverables.
- Expanded the plan with a strict step-by-step P0 execution checklist so another AI agent can implement the compliance critical path sequentially, with validation gates and exit criteria.

### Fixed — Chat AI bot uses default avatar

- The `ChatInterface` AI bot now dynamically displays the user's uploaded profile photo instead of a hardcoded default avatar.
- Updated `ChatPreviewPage` and `PublicProfilePage` to pass the correct avatar URL into the chat interface.

### Added — Shareable AI pipeline diagrams

- Added a new `docs/flows/` documentation set covering the two core Profiley
  AI pipelines in both text and image form for external sharing.
- `document-ingestion.mmd` / `.svg` / `.png` explain the upload,
  extraction, chunking, embedding, and `knowledge_chunks` storage flow.
- `persona-chat.mmd` / `.svg` / `.png` explain how `chat-persona` embeds the
  visitor question, retrieves top matching chunks, builds prompt context, and
  generates a grounded response with citations.
- Added `docs/flows/README.md` with a concise narrative for both pipelines and
  re-render commands for the Mermaid assets.

### Fixed — Missing bottom padding on info cards (Chat Preview & Job Fit)

- Added `[&:last-child]:pb-6` to the reusable `CardHeader` component in `apps/frontend/src/app/components/ui/card.tsx` to fix visual alignment issues where cards exclusively containing a header had a large top margin but no bottom margin. This corrects the UI on the Chat Preview, Job Fit, and other places using the info-card pattern.

### Fixed — Profile photo uploads fail to display

- Made the `avatars` Storage bucket public so `supabase.storage.getPublicUrl()` can successfully serve uploaded profile photos.
- Updated the header layout avatar (`AppLayout`) to use `useCurrentProfile()` and dynamically display the uploaded profile photo instead of a hardcoded generic caricature.
- Added a `profile-updated` custom event to `updateProfile()`, `updatePreferences()`, and `updateAppUser()` in `lib/profile.ts` so `useCurrentProfile()` can instantly refresh and keep the header avatar in sync across navigation when changes are made.

### Fixed — Logout returns users to the landing page

- Added a shared frontend logout helper so both the app navigation and
  settings sign-out actions clear the Supabase session and redirect to `/`
  instead of sending users to `/login`.
- Updated the settings sign-out note in all supported locales to reflect the
  landing-page redirect.

### Changed — GitHub Actions no longer run on `main` pushes

- Removed the `push` trigger from `.github/workflows/ci.yml` and
  `.github/workflows/deploy.yml`. Pull requests into `main` still run CI, and
  production deploys remain available through the manual `Deploy` workflow.
- Updated the init guide to reflect that deployments are now manual instead of
  happening automatically on every commit to `main`.

Initial backend + critical-path frontend wiring. Everything is workspace-only;
no Supabase project has been created yet. Follow
[`docs/concept/profiley-init-guide.md`](docs/concept/profiley-init-guide.md) to
provision and deploy.

### Added — Site Logo Favicon

- Created an SVG favicon (`favicon.svg`) that matches the site logo (purple-to-blue gradient stylized "P") and injected it into `apps/frontend/index.html`.

### Fixed — Off-center layout containers

- Fixed a visual bug on wide screens where content was left-aligned instead of centered. Added Tailwind's `mx-auto` directly to `className="container"` across the React front-end (e.g., landing page, dashboard layout, public profile, and legal pages).

### Changed — Primary domain is now `profiley.ai`

- Replaced all `profiley.org` and placeholder `profiley.app` references with
  `profiley.ai` (and `dev.profiley.ai` for the dev environment) across env
  files, env templates (`apps/frontend/.dev.vars.example`,
  `supabase/functions/.env.example`), the recruiter email default in
  `supabase/functions/submit-recruiter-contact/index.ts`, and the legal
  contact email (`privacy@profiley.ai`) in all locale JSON files.
- Supabase Auth Site URL and Redirect URLs were updated in the dashboard
  for both prod and dev projects.

### Added — Mandatory legal documents (Terms, Privacy, Cookies)

- New routes `/legal/terms`, `/legal/privacy`, and `/legal/cookies` rendered
  with a shared `LegalLayout` that follows the design system (gradient
  header, glassy card, prose typography, RTL-safe back arrow).
- The Privacy Policy is GDPR/UAVG compliant for an operator hosted in the
  Netherlands by Akram Zaki acting in a personal capacity. It enumerates
  every active third-party processor with the data they receive and the
  legal transfer mechanism: Supabase, Cloudflare, OpenAI, Google Gemini,
  and Mistral AI. It also documents data subject rights, retention, AI
  automated processing scope under Article 22, and the path to lodge a
  complaint with the Autoriteit Persoonsgegevens.
- The Cookie Policy lists the four storage entries Profiley actually uses
  (`sb-access-token`/`sb-refresh-token`, `profiley-language`,
  `profiley-theme`, Cloudflare bot mitigation).
- Footer links added on the landing page and the login page; cross-links
  between the three documents on every legal page.
- All three documents are translated for `en`, `nl`, and `ar`. Locale parity
  is enforced by a Vitest test that asserts the same processor IDs are
  declared in every language.
- New i18n helper `translateList` / `tList` returns string arrays for
  bulleted lists while keeping the existing `t()` semantics.

### Fixed — Persona chat truncated retrieved CV/cover-letter chunks

- `_shared/rag/buildContext.ts` raised the default `maxChars` budget from
  `6000` to `28000`. Knowledge chunks are produced at ~3200 chars each
  (`chunkText.ts`) and retrieval returns the top 8, so the previous budget
  only fit ~2 chunks; if the relevant excerpt (e.g. an "Education" section
  with the graduation year) was outside that pair, the persona answered
  "I don't have that information yet" even when the fact was in an uploaded
  CV. New default fits the full top-K of worst-case-sized chunks. Verified
  by `supabase/tests/buildContext.test.ts`.

### Added — Public profile sharing UX + custom slug

- New edge function `update-profile-slug` lets a signed-in user rename their
  own profile slug (the path segment used in the public URL
  `/public/<slug>`). Slugs must be 3–40 lowercase letters/digits/hyphens, can
  not start or end with a hyphen, and can not be one of the route-conflict
  reserved words listed in `RESERVED_SLUGS`. Returns `409 SLUG_TAKEN` when
  another user already owns the slug. The matching `public_pages.slug` mirror
  is updated in the same call.
- Profile page: the public URL, "Copy link" button, and new editable username
  field are now hidden until the user toggles **Public Profile Visibility** on
  — replacing the previous always-on URL row that pointed at an unreachable
  link. When public, users can claim a different slug inline.
- Dashboard: the "View public profile" CTA now only renders when the profile
  is public, matching the new gating on the profile page.
- Public-facing edge functions (`get-public-profile`, `chat-persona`,
  `analyze-job-fit`, `submit-recruiter-contact`, `track-recruiter-event`) are
  now deployed with `--no-verify-jwt` and flagged in `supabase/config.toml`
  so the platform gateway no longer rejects anonymous visitors with
  `UNAUTHORIZED_INVALID_JWT_FORMAT` when the frontend uses an
  `sb_publishable_*` API key.

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

### Fixed — Job-fit analysis 400 from OpenAI structured outputs

- `JOB_FIT_JSON_SCHEMA` (`supabase/functions/_shared/prompts/jobFit.ts`) now
  sets `additionalProperties: false` on the nested `citations[].items` object
  schema. OpenAI's `response_format: { type: "json_schema", strict: true }`
  rejects any nested object that omits this flag, which previously caused
  `analyze-job-fit` to fail with `Invalid schema for response_format 'result':
  In context=('properties', 'citations', 'items'), 'additionalProperties' is
  required to be supplied and to be false.` Public visitors hitting the
  job-fit analyzer on a public profile now get a successful response.

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
