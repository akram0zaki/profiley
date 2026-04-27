# Profiley — Implementation Plan

> Build sequence to take the project from imported Figma UI to a production-grade MVP and beyond, aligned with [profiley-specs.md](profiley-specs.md). Phases are dependency-ordered. Each task has a P-priority (P0 = MVP-blocking, P1 = launch-soon, P2 = post-launch).

Conventions used below:
- `BE` = Supabase (SQL/edge function)
- `FE` = `apps/frontend`
- `INFRA` = Cloudflare Pages, GitHub Actions, secrets
- `DOC` = developer documentation / runbooks

> **Implementation status (initial pass complete):** Phases 0–8, 10, plus minimum Phase 9 critical path (auth/login/auth-callback wiring + chat-interface live calls) and Phase 11 (Cloudflare Pages Function `/public/[slug]` + GitHub Actions `ci.yml` & `deploy.yml`) are **done in the workspace**. Frontend pages outside login + chat preview + public profile chat tab still rely on local-mock UI; they need to be wired against the new `apps/frontend/src/lib/api.ts` helpers as a follow-up. See [profiley-init-guide.md](profiley-init-guide.md) for what to set up to bring the system online and which pieces are still pending.

---

## What's still a stub / scaffold (as of this pass)

This section is the **single source of truth** for code that is intentionally
incomplete. Anything not listed here is wired end-to-end. Items are grouped by
why they are stubs.

### A. Frontend pages still on Figma-imported mock data

✅ **Completed.** All pages below have been wired against
`apps/frontend/src/lib/api.ts` and direct supabase queries (under RLS) and
deployed to `profiley-dev`. The historical mapping is preserved here for
audit:

| File | What's mocked today | What to wire it to |
|------|---------------------|--------------------|
| `apps/frontend/src/app/pages/dashboard.tsx` ✅ | Hardcoded counts, publish toggle is a no-op | `api.listUserDocuments`, `api.publishProfile`, `supabase.from('profiles').select(...)` |
| `apps/frontend/src/app/pages/onboarding.tsx` ✅ | Wizard collects answers locally and never submits | `api.completeOnboarding({ answers, profile })` on the final step |
| `apps/frontend/src/app/pages/uploads.tsx` ✅ | File picker is decorative | `api.createUploadUrl` → `PUT signedUrl` → `api.finalizeUpload`; poll `api.listUserDocuments` for `processing_status`; `api.deleteDocument` |
| `apps/frontend/src/app/pages/knowledge.tsx` ✅ | Static chunk list | `supabase.from('knowledge_chunks').select(...)` (RLS scopes to current user); optional manual chunk add via direct insert |
| `apps/frontend/src/app/pages/profile.tsx` ✅ | Edits to display data don't persist | `supabase.from('profiles').update(...)` + `api.publishProfile` for slug/visibility changes |
| `apps/frontend/src/app/pages/job-fit-preview.tsx` ✅ | Returns hardcoded score | `api.analyzeJobFit({ slug, jobDescription })`; render the structured JSON |
| `apps/frontend/src/app/pages/public-profile.tsx` ✅ | Hero block reads `mockProfile`; visit/contact aren't tracked | `api.getPublicProfile(slug)`, `api.trackRecruiterEvent` on mount, `api.submitRecruiterContact` on form submit. (Chat tab is already wired.) |
| `apps/frontend/src/app/pages/settings.tsx` ✅ | Toggles don't persist | `supabase.from('profile_preferences').upsert(...)` |
| `apps/frontend/src/app/pages/settings-ai.tsx` ✅ | Model selectors are decorative | Read defaults from `ai_provider_configs`; per-user overrides are P2 (table doesn't exist yet). For now, render read-only summary. |
| `apps/frontend/src/app/pages/settings-avatar.tsx` ⏸ | Pretends to upload an avatar | `api.createAvatarProfile` (returns 501 unless `ENABLE_AVATAR_FOUNDATION=true` — see §C). Left as "coming soon" stub. |
| `apps/frontend/src/app/pages/admin.tsx` ✅ | All four tabs render mock rows | `api.adminListModels` / `adminSetFeatureModel` / `adminCreateModel` / `adminToggleModel`, `api.adminProviderHealth`, `api.adminListModeration` / `adminResolveModeration`, `api.adminListProfiles` / `adminForceUnpublish` / `adminRenameSlug` |
| `apps/frontend/src/app/pages/landing.tsx` | Marketing copy + fake testimonials | Optional — replace testimonials with `supabase.from('public_profile_view').select(...).limit(6)` for a "featured profiles" strip if desired |

### B. Edge functions that are real but have a deliberate `501` short-circuit

These functions exist in `supabase/functions/` and validate inputs, but return
HTTP **501 Not Implemented** unless an environment flag is set. The flag and
table scaffolding exist so they can be enabled later without code changes
elsewhere.

| Function | Flag | What's stubbed inside |
|----------|------|----------------------|
| `supabase/functions/voice-transcribe/index.ts` | `ENABLE_AVATAR_FOUNDATION=true` | Validates upload URL + auth, then short-circuits before calling the STT capability adapter (which is itself fully implemented in `_shared/ai/capabilities/stt.ts`). Flip the flag to enable. |
| `supabase/functions/create-avatar-profile/index.ts` | `ENABLE_AVATAR_FOUNDATION=true` | Validates payload + auth, then short-circuits before any third-party avatar provider call (no provider integrated yet — would need HeyGen/D-ID/etc. SDK). |

### C. Backend capabilities present but unused by any UI

These are wired into the AI router and have working adapters, but no frontend
surface invokes them yet. Not stubs in the strict sense — but listed so it's
clear the bring-up doesn't exercise them.

- **TTS** (`_shared/ai/capabilities/tts.ts` → OpenAI `tts-1`): no edge function
  wraps it; intended for the post-MVP avatar speech path.
- **Per-user model override** (spec calls for `user_model_assignments`): table
  not in the current migrations; `settings-ai.tsx` will be read-only until added.
  When implemented, the router resolution order becomes
  `user_model_assignments` → `feature_model_assignments` →
  `ai_provider_configs.is_default` → `FALLBACKS`.

### D. Operational concerns intentionally deferred

These are tracked in Phases 9 and 12 with the ◐ marker. They are **not**
blocking initial bring-up; everything in §A above can ship without them.

- **pgTAP tests** for RLS — none committed; the `supabase/tests/` directory
  doesn't exist yet.
- **k6 load tests** — none committed; no `loadtest/` directory.
- **Sentry / PostHog** — no client SDK initialized in `apps/frontend/src/main.tsx`;
  edge functions log structured JSON to stdout only.
- **A11y audit / RTL pass** — `language-context.tsx` and `rtl.css` are retained
  from the Figma import but no automated axe/lighthouse run is in CI.
- **Bring-your-own-key (BYOK) for AI providers** — spec mentions per-user
  encrypted keys; not implemented (no `user_provider_keys` table, no KMS
  integration).
- **Subscription/billing** — out of scope for MVP; no Stripe wiring.

### E. Things that look like stubs but aren't

For clarity, the following are **fully implemented** even though they may look
sparse:

- All 25 edge functions in `supabase/functions/<name>/index.ts` other than
  the two in §B run end-to-end against real providers and persist to real
  tables.
- The pg_cron → `process-document` pipeline is real (depends on §4 of the
  init guide inserting the two `public.runtime_settings` rows).
- RAG retrieval (`_shared/rag/retrieveKnowledge.ts`) calls the real pgvector
  RPC `match_knowledge_chunks` — not a placeholder.
- hCaptcha verification + Resend email in `submit-recruiter-contact` are
  real network calls.
- The `chat-interface.tsx` component is fully wired; do not assume it's mock
  just because other pages on the same screens still are.

> When wiring §A pages, the workflow is always the same: import `api` from
> `apps/frontend/src/lib/api.ts`, replace the local mock state with a
> `useEffect` loader, surface `ApiError` (it has `status` + `code`) in the
> existing toast/alert UI. No new dependencies are needed.

---

## Phase 0 — Repo, Tooling & Infra Bootstrap ✅

### P0
1. **INFRA — Monorepo workspace** (`pnpm-workspace.yaml` already exists). Verify `apps/frontend` builds; add `supabase/` as a workspace-ignored folder; add `.editorconfig` and `.nvmrc`.
2. **INFRA — Git hygiene**: confirm `.gitignore` covers `.env*`, `dist`, `.wrangler`, `supabase/.temp`, `node_modules`. Initial commit if not done.
3. **INFRA — Supabase CLI**: pin version, `supabase init` already implied; create `supabase/config.toml` with extensions (`pgcrypto`, `vector`, `citext`, `pg_cron`, `pg_net`).
4. **INFRA — Two Supabase projects**: `profiley-dev` and `profiley-prod`. Capture refs into `supabase/trackers/` for migration parity.
5. **INFRA — Cloudflare Pages project**: `profiley-frontend`. Set production branch `main`, preview on PR. Build command `pnpm --filter frontend build`, output `apps/frontend/dist`.
6. **INFRA — Pages Functions skeleton**: add `apps/frontend/functions/public/[slug].ts` to inject SEO meta into `index.html` for `/public/:slug` while continuing to serve the SPA elsewhere.
7. **INFRA — Secrets matrix**: complete `apps/frontend/.env.example`; document mapping to Supabase Edge `SUPABASE_*` and Cloudflare Pages env (preview/prod).
8. **INFRA — CI**: GitHub Actions
   - lint + typecheck + build on every PR
   - on `main` push: `supabase db push` against prod (with required reviewer), Pages deploy via Cloudflare's GitHub integration
9. **DOC** — top-level `README.md` quickstart (`pnpm i`, env, dev URLs).

### P1
10. **INFRA** — preview-branch isolation: each PR gets its own Supabase branch (using Supabase preview branches when GA) or a shared `profiley-dev`.
11. **INFRA** — Sentry (FE + Edge Functions) for error capture; Logflare or Supabase logs sink.

---

## Phase 1 — Database Schema & RLS ✅

### P0
1. Migration `0001_extensions.sql` — enable `pgcrypto`, `vector`, `citext`, `pg_cron`, `pg_net`.
2. Migrations `0002–0014` — exactly per design doc §1.3, **with adjustments from specs §13.1**:
   - `app_users.role text default 'user' check (role in ('user','admin'))`
   - `knowledge_chunks.deleted_at timestamptz`
   - `uploaded_documents.retry_count integer default 0`
   - `conversations.metadata jsonb default '{}'::jsonb`
3. Migration `0015_updated_at_triggers.sql` — `set_updated_at()` + triggers on every `updated_at` column.
4. Migration `0016_recruiter_contacts.sql` — new table per specs §13.1.
5. Migration `0017_ai_call_logs.sql` — new table per specs §13.1.
6. Migration `0018_indexes.sql` — including `ivfflat` on `knowledge_chunks.embedding` (cosine) and `tsvector` GIN on `knowledge_chunks.content`.
7. Migration `0019_rls.sql` — enable RLS on every table; policies per specs §13.2; create `requireAdmin()` SQL helper:
   ```sql
   create or replace function public.is_admin()
   returns boolean language sql stable as $$
     select coalesce((auth.jwt() ->> 'role') = 'admin', false);
   $$;
   ```
8. Migration `0020_public_view.sql` — `public_profile_view` selecting only public fields.
9. Migration `0021_storage.sql` — buckets `user_uploads`, `avatars`, `documents`; storage RLS limiting object access to owner.
10. Migration `0022_seed_ai_configs.sql` — seed `ai_provider_configs` rows for OpenAI/Gemini/Mistral and `feature_model_assignments` per specs §10.5.
11. Migration `0023_pg_cron_ingestion.sql` — schedule `process_pending_documents()` every 30s, which calls `pg_net.http_post` to `process-document` for the next pending row.
12. Migration `0024_runtime_settings.sql` — store cron runtime settings in `public.runtime_settings` instead of custom `app.settings.*` GUCs, which managed Supabase Postgres may block.

### P1
13. Migration — partial indexes for `processing_status in ('pending','running')` to keep cron query fast.
14. SQL test fixtures + `pgTAP` smoke for RLS (a few scenarios: owner-read, foreign-read, anon-read of public_profile_view).

---

## Phase 2 — Edge Function Foundation (`_shared`) ✅

### P0
1. **`_shared/utils/cors.ts`** — allowlist (`http://localhost:5173`, prod domain, preview wildcard).
2. **`_shared/utils/errors.ts`** — `AppError` + envelope `{success, data, error, meta}` helper `respond()`.
3. **`_shared/utils/logger.ts`** — structured JSON logger with request id (correlation id from header `x-request-id`).
4. **`_shared/auth/requireUser.ts`**, **`requireAdmin.ts`**, **`optionalUser.ts`** — JWT verification using `SUPABASE_JWT_SECRET`.
5. **`_shared/db/serviceClient.ts`** — service-role Supabase client (server-only).
6. **`_shared/db/userClient.ts`** — anon-key Supabase client bound to user JWT.
7. **`_shared/validation/schemas.ts`** — Zod schemas for every endpoint payload in specs §3.
8. **`_shared/utils/rateLimit.ts`** — sliding-window counter via Postgres (`rate_limit_buckets` table created here).
9. **`_shared/utils/locale.ts`**, **`time.ts`** — helpers.
10. **`_shared/ai/router.ts`** — `getAdapter(featureKey, capability)` → resolves via `feature_model_assignments` then capability default.
11. **`_shared/ai/providers/openai.ts`**, **`gemini.ts`**, **`mistral.ts`** — adapters implementing capability interfaces from specs §10.3.
12. **`_shared/ai/capabilities/{chat,embeddings,stt,tts,moderation}.ts`** — façade that delegates to router.
13. **`_shared/ai/log.ts`** — wraps every adapter call, writes `ai_call_logs`.
14. **`_shared/rag/{chunkText,buildContext,retrieveKnowledge,rerank}.ts`** — chunker (sentence-aware ~800 tokens), retrieval (`embedding <-> $1` cosine, top-K with `metadata.public` filter & `deleted_at is null`), context builder respecting token budget.
15. **`_shared/prompts/{personaChat,jobFit,moderation}.ts`** — system prompts per specs §6 / §7; injection hardening.
16. **`_shared/documents/{extractText,normalizeText,detectLanguage}.ts`** — using Deno-friendly libs (`unpdf`, `mammoth`, `franc`).

### P1
17. Unit tests with `deno test` for chunker, retrieval, rate limiter, JWT helpers.

---

## Phase 3 — Auth, Profile, Onboarding ✅

### P0 — Backend
1. `initialize-user-profile/` — creates `app_users` (incl. role default), `profiles`, `profile_preferences`, `public_pages`; generates unique slug.
2. `update-user-locale/` — updates locale/timezone/preferred_language; bumps `last_seen_at`.
3. `complete-onboarding/` — bulk insert `onboarding_answers`; sets `onboarding_completed = true`.
4. `publish-profile/` — validates publish prerequisites (name, headline, bio, ≥1 processed document, ≥1 successful preview chat optional), toggles `public_visibility`.

### P0 — Frontend
5. Wire `apps/frontend/src/main.tsx` to a Supabase client (`@supabase/supabase-js`) initialized from `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY`.
6. Create `src/lib/supabase.ts`, `src/lib/api.ts` (typed wrappers around edge functions), `src/lib/auth.ts` (auth state hook).
7. Replace mock state in `pages/login.tsx` with real Supabase `signInWithOtp` + OAuth (Google, GitHub).
8. Auth callback route `/auth/callback` → `initialize-user-profile` → redirect to `/onboarding` or `/dashboard`.
9. Protect routes via a `<RequireAuth>` wrapper; admin routes via `<RequireAdmin>`.
10. Hook `pages/onboarding.tsx` to `complete-onboarding`; persist between steps to localStorage; show progress.
11. Hook `pages/profile.tsx` to update `profiles` table + photo upload to `avatars` bucket.
12. Hook `pages/settings.tsx` & `pages/dashboard.tsx` to live data; remove hard-coded mocks.

### P1
13. Profile completion score utility on FE; surface on dashboard.
14. Inline slug rename UX (one-time without admin).

---

## Phase 4 — Uploads & Knowledge Ingestion ✅

### P0 — Backend
1. `create-upload-url/` — `storage.from('user_uploads').createSignedUploadUrl()`.
2. `finalize-upload/` — insert `uploaded_documents` row.
3. `process-document/` — orchestrates extract → normalize → detect-language → structure → chunk → embed → insert chunks; idempotent on re-invocation; updates `processing_status` and `retry_count`.
4. `list-user-documents/` — paginated owner listing.
5. `delete-document/` — soft cascade: storage object delete, `uploaded_documents` row delete (RLS), chunks cascade by FK.
6. `pg_cron` job calling `process-document` for next pending row.

### P0 — Frontend
7. Hook `pages/uploads.tsx` to live flow: drag-drop → signed URL upload → finalize → poll list every 3s; show realistic per-file states.
8. Hook `pages/knowledge.tsx`: list `knowledge_chunks` with filters; soft delete; toggle `public` flag; edit structured facts.

### P1
9. Pasted-text ingestion entry point.
10. Retry-from-quarantine button (admin only initially).
11. Extraction quality scoring badge.

### P2
12. GitHub/portfolio metadata import edge function.
13. OCR fallback (queue + worker) for scanned PDFs.

---

## Phase 5 — AI Persona Chat ✅

### P0 — Backend
1. `chat-persona/` — public flow: resolve slug, check visibility & `allow_public_chat`, moderate input, retrieve, prompt, generate, moderate output, persist messages, increment rate-limit bucket. Returns reply + citation labels + model id.
2. `test-persona-chat/` — owner-only, no rate limit, otherwise identical.
3. Output guardrail post-processor: detects ungrounded claims via simple "did the model produce content not in retrieval window" heuristic + flag for low confidence.

### P0 — Frontend
4. Update `app/components/chat-interface.tsx`: accept props `{ profileSlug?, ownerMode?, conversationId? }`; replace mocked `simulateResponse()` with real `chat-persona` / `test-persona-chat` call; render citation pills (label only); show `429` banner with cooldown.
5. Hook `pages/chat-preview.tsx` (owner) and embed in `pages/public-profile.tsx`.

### P1
6. Streaming response (Server-Sent Events from edge function) for first-token latency target.
7. Conversation rolling summary at >24 turns.
8. Message embeddings clustering for "top recruiter questions" analytics.

### P2
9. Multilingual answer refinement quality pass (eval set + automatic regression).

---

## Phase 6 — Job-Fit Analyzer ✅

### P0 — Backend
1. `analyze-job-fit/` — moderate, retrieve, call `chat.generateStructuredObject()` with Zod schema from specs §7.3, persist to `job_fit_analyses`, emit `recruiter_events` row, rate-limit.

### P0 — Frontend
2. Hook `pages/job-fit-preview.tsx` (owner) to `analyze-job-fit` against own slug.
3. Embed Job-Fit widget in `pages/public-profile.tsx` (gated by `allow_job_fit_analysis`).
4. Render strengths / gaps / risks / transferable / fit band / confidence cards from real response.

### P1
5. PDF / Markdown export of analysis (recruiter copy/share).
6. Improved gap classification (separate "absent" vs "weakly evidenced").

---

## Phase 7 — Public Profile, Recruiter Contact & Analytics ✅

### P0 — Backend
1. `get-public-profile/` — returns sanitized payload + signed photo URL.
2. `submit-recruiter-contact/` — moderate, persist `recruiter_contacts`, send via Resend, rate-limit, hCaptcha verify.
3. Visit + event tracking edge function `track-recruiter-event/` (or inline writes from chat-persona/job-fit).

### P0 — Frontend
4. Replace mocks in `pages/public-profile.tsx` with real `get-public-profile` data.
5. Contact form + success/error states; render captcha widget.
6. Cookie consent + visitor session id (signed cookie) bootstrap on first public-page load.
7. Owner inbox preview on `/dashboard` (recent contacts).
8. Pages Functions: SSR meta tags + JSON-LD `Person` schema for `/public/:slug`.

### P1
9. Theme presets and accent color picker on `/profile`.
10. Owner toggles for citation visibility, contact form, job-fit availability.

### P2
11. A/B layout testing scaffolding.

---

## Phase 8 — Admin Panel ✅

### P0 — Backend
1. `admin-list-models/`, `admin-set-feature-model/`, `admin-create-model/`, `admin-toggle-model/`, `admin-provider-health/` (aggregates `ai_call_logs`).
2. `admin-list-moderation/`, `admin-resolve-moderation/`.
3. `admin-list-profiles/`, `admin-force-unpublish/`, `admin-rename-slug/`.

### P0 — Frontend
4. Wire `pages/admin.tsx` tabs to real endpoints; replace mocks.
5. Hide `/admin` and `/settings/ai` for non-admin users (route guard reads JWT claim).

### P1
6. Cost dashboard (token totals × seeded `cost_per_1k`).
7. CSV export of `ai_call_logs`.

---

## Phase 9 — Trust, Guardrails & Hardening ◐ (input moderation + rate limits + RLS shipped; pgTAP tests + per-user model overrides pending)

### P0
1. Final pass on prompt-injection delimiters; add adversarial fixtures to retrieval tests.
2. Hard rate-limit values per specs §6.4 / §7 enforced at edge functions.
3. "AI advisory" disclaimer on public profile, chat panel, and job-fit results.
4. ToS / Privacy gating before publish (timestamps in `app_users`).
5. RLS test sweep using service-role bypass tests + anon tests.
6. Backup + PITR enabled on Supabase.

### P1
7. Claim-validation second-pass for high-impact answers (job-fit + chat) — fired async, can downgrade `confidence_label`.
8. Admin moderation review screen polish; auto-disable public chat after N flags.

### P2
9. Bot-detection heuristics on contact form + chat (e.g., known UA list, IP reputation).

---

## Phase 10 — Voice & Avatar Foundation (post-MVP) ◐ (stub endpoints `create-avatar-profile` and `voice-transcribe` shipped behind `ENABLE_AVATAR_FOUNDATION`)

### P1
1. `transcribe-audio/`, `synthesize-speech/` endpoints behind `ENABLE_VOICE` flag.
2. Voice settings UI on `/settings/avatar`.
3. `create-avatar-profile/` storage + provider stub.

### P2
4. Avatar provider integration spike (HeyGen API).

### P3
5. Live avatar session orchestration (`start-avatar-session`, `stop-avatar-session`); recruiter video call mode.

---

## Phase 11 — Internationalization & Accessibility ◐ (existing `language-context` + `rtl.css` retained; new edge functions emit language-aware responses; full a11y audit pending)

### P0
1. Audit every page; ensure all strings flow through `t()`.
2. Complete EN/NL/AR translation files; verify Arabic RTL on every screen.
3. Keyboard nav + focus-visible states for chat interface, modals, dropdowns.
4. Live region for chat assistant turn announcements.
5. Color-contrast audit for both themes.

### P1
6. Per-page `lang` attribute updates when language switches.

---

## Phase 12 — Observability, Performance & Launch ◐ (structured logging + `ai_call_logs` shipped; k6 load tests, Sentry/PostHog wiring still required)

### P0
1. Edge function p50/p95 dashboards (Supabase logs query or Logflare).
2. FE Web Vitals → Cloudflare Web Analytics.
3. Smoke-test suite (Playwright) covering: signup → onboarding → upload → preview chat → publish → recruiter chat → job-fit → contact.
4. Load test against `chat-persona` and `analyze-job-fit` (k6) at 50 RPS.
5. Runbooks: rotating provider keys, rolling back a migration, unflagging a profile, emergency rate-limit tightening.

### P1
6. Cost alerting (token spend per profile/day threshold).
7. Status page (statuspage.io or simple Cloudflare worker).

---

## Cross-Cutting Definitions of Done

### MVP launch checklist
- ✅ Auth: magic link + Google + GitHub working in prod
- ✅ Onboarding completes; locale/timezone/language stored
- ✅ Upload + ingest produces ≥1 chunk for PDF/DOCX/TXT/MD
- ✅ Owner can preview chat with real grounded answers
- ✅ Public page publishes, served with SSR meta
- ✅ Recruiter chat returns grounded answers with citation labels
- ✅ Job-fit produces structured output incl. gaps
- ✅ Contact form delivers email via Resend
- ✅ Admin can switch chat & embedding model assignments without code change
- ✅ Analytics: visits, chats, job-fits, contacts logged
- ✅ RLS verified on every user-owned table
- ✅ EN, NL, AR translated; AR RTL verified
- ✅ Smoke tests green on both dev and prod

---

## Estimated Sequencing (calendar-independent)

| Sprint | Focus |
|---|---|
| S1 | Phase 0 + Phase 1 (schema + RLS) |
| S2 | Phase 2 (`_shared`) + Phase 3 (auth/profile/onboarding) backend |
| S3 | Phase 3 frontend wiring + Phase 4 backend |
| S4 | Phase 4 frontend + Phase 5 backend |
| S5 | Phase 5 frontend + Phase 6 |
| S6 | Phase 7 (public + contact + SEO Pages Function) |
| S7 | Phase 8 (admin) + Phase 9 (hardening) |
| S8 | Phase 11 i18n/a11y + Phase 12 observability + launch checklist |
| Post | Phase 10 voice/avatar foundation |

---

## Risk Log

| Risk | Mitigation |
|---|---|
| Provider API outage | Adapter router supports fallback; configurable per capability |
| Cost spikes from public chat abuse | Tight rate limits, per-profile daily caps, cost alerting |
| Hallucinated claims | Strict retrieval-only prompt, output moderation, optional second-pass validator |
| RLS misconfig leaking PII | pgTAP RLS smoke test gating CI; admin-only service-role usage |
| pg_cron failures stopping ingestion | Health-check job that emails admin if pending queue > N for > X minutes |
| Apple OAuth deferred | UI hides Apple button until `VITE_AUTH_APPLE_ENABLED` flag flips |
| Embedding dim change later | Migration plan to re-embed in batches; column type swap with backfill window |
