# Profiley — Feature Specification

> Authoritative, build‑ready feature spec derived from `profiley-prd.md` and `profiley-design.md` and reconciled with the imported Figma UI in `apps/frontend/`. Where the PRD and design doc differed, the choices below were resolved with the project owner (see §0.3).

---

## 0. Foundations

### 0.1 Stack
- **Frontend**: React 19 + Vite + Tailwind v4 + shadcn/ui, deployed to **Cloudflare Pages** as an SPA, with **Pages Functions** providing SSR snippets for `/public/:slug` SEO (OG/Twitter meta + pre-rendered hero text).
- **Backend**: **Supabase** (Postgres, Auth, Storage, Edge Functions) + `pgvector`, `pgcrypto`, `citext`, `pg_cron`, `pg_net` extensions.
- **AI**: capability-based router (`chat`, `embeddings`, `stt`, `tts`, `moderation`) with adapters for **OpenAI** (primary), **Google Gemini**, **Mistral**. Provider/model assignable per feature.
- **Email**: Resend (transactional — recruiter contact, magic link branding optional).
- **i18n**: English, Dutch, Arabic from day 1; auto RTL for Arabic; AI answers in the language of the recruiter's query.

### 0.2 Personas
- **Candidate (owner)** — creates, curates, and publishes a profile.
- **Visitor / Recruiter** — anonymous by default, rate-limited; uses public profile, persona chat, job-fit analyzer, contact form.
- **Admin** — Supabase user with role `admin` (JWT claim `role: admin` enforced by RLS); manages model registry, feature assignments, provider health, moderation review.

### 0.3 Resolved Open Decisions
| Topic | Decision |
|---|---|
| Public chat access | Anonymous, rate-limited per visitor session + IP |
| AI providers at MVP | OpenAI primary; Gemini & Mistral wired through router |
| Embeddings | `text-embedding-3-small` → `vector(1536)` |
| Storage buckets | `user_uploads`, `avatars`, `documents` (PRD naming) |
| Auth providers | Email magic link, Google OAuth, GitHub OAuth (no Apple at MVP) |
| Ingestion runtime | `pg_cron`-driven queue; client polls `processing_status` |
| Citation visibility | Source **labels only** (no excerpt text) at MVP |
| Recruiter contact | In-app contact form → server emails owner via Resend |
| Admin gating | Supabase auth role + RLS; no separate app |
| Per-user model overrides | Disabled at MVP; `/settings/ai` hidden for non-admins |
| Cloudflare Pages | SPA + Pages Functions for `/public/:slug` SEO meta |

---

## 1. Information Architecture & Routes

| Route | Auth | Purpose |
|---|---|---|
| `/` | public | Landing page |
| `/login` | public | Unified auth (Google, GitHub, magic link) |
| `/onboarding` | owner | 5-step setup wizard |
| `/dashboard` | owner | Profile completion, recruiter analytics, recent activity |
| `/profile` | owner | Edit identity, headline, bio, skills, photo |
| `/uploads` | owner | Upload manager, processing status |
| `/knowledge` | owner | Browse extracted chunks, structured facts, confidence |
| `/chat-preview` | owner | Test own AI persona |
| `/job-fit-preview` | owner | Test job-fit analyzer with own profile |
| `/public/:slug` | public | Recruiter-facing profile + chat + job-fit + contact |
| `/settings` | owner | Account, preferences, privacy, language, visibility |
| `/settings/ai` | admin only | Per-feature model overrides (hidden for non-admins) |
| `/settings/avatar` | owner | Avatar foundation (feature-flagged) |
| `/admin` | admin | Model registry, feature assignments, health, moderation review |

Pages Functions render server-side `<head>` for `/public/:slug` (title, description, OG image) by calling `get-public-profile`; the SPA hydrates the rest.

---

## 2. Authentication & Account Lifecycle

### 2.1 Providers
- **Email magic link** (Supabase Auth `signInWithOtp`)
- **Google OAuth**
- **GitHub OAuth**

### 2.2 First-login flow
1. Auth callback completes; SPA detects session.
2. SPA captures `navigator.language`, `Intl.DateTimeFormat().resolvedOptions().timeZone`.
3. SPA calls `initialize-user-profile` with `email`, `browserLocale`, `timezone`, `preferredLanguage` (fallback chain: stored pref → URL param → browser locale → `en`).
4. Backend creates `app_users`, `profiles` (slug auto-generated, collision-suffixed), `profile_preferences`, `public_pages` rows if missing, and accepts ToS/Privacy timestamps when checkbox shown on first login.
5. Returning user with `onboarding_completed = true` → `/dashboard`; otherwise `/onboarding`.

### 2.3 Session
- JWT in HTTP-only cookie (Supabase default); refresh handled client-side.
- `last_seen_at` updated on auth callback and once per active day via lightweight `update-user-locale` ping.

### 2.4 Slug rules
- lowercase, kebab-case, ASCII; built from `full_name`. Reserved list (`admin`, `api`, `public`, `login`, `onboarding`, `dashboard`, `profile`, `settings`, `uploads`, `knowledge`, `chat-preview`, `job-fit-preview`).
- collision → append `-2`, `-3`, …
- owner can rename slug once after onboarding; further changes require admin override.

---

## 3. Profile Domain

### 3.1 Editable fields (`/profile`)
- Identity: `full_name`*, `headline`, `short_bio`, `long_bio`, `current_location`, `profile_photo_path`.
- Skills: tag list (chips) — stored as JSON in `onboarding_answers` under key `skills` for MVP; promotable to a typed table later.
- Visibility toggle (`public_visibility`).
- Slug (read-only after first change; admin override).

### 3.2 Profile completion score
Weighted: name 10, headline 10, bio 15, photo 10, ≥1 processed document 25, onboarding answers 20, ≥1 successful preview chat 10. Surface as percentage on `/dashboard`.

### 3.3 Public payload (`get-public-profile`)
Returns sanitized projection: `slug`, `full_name`, `headline`, `short_bio`, `recruiter_intro`, `persona_style`, `profile_photo_path` (signed URL), `highlights` (top strengths from onboarding), `accent_color`, `theme_name`, capabilities flags (`allow_public_chat`, `allow_job_fit_analysis`, contact form enabled).

---

## 4. Onboarding (5 steps)

| Step | Content |
|---|---|
| 1 Welcome | Confirm `full_name`, `preferred_language`, `timezone` |
| 2 Profile basics | `headline`, `short_bio`, `current_location`, photo upload |
| 3 Documents | Drop CV + portfolio files (≥1 required to publish later) |
| 4 Questionnaire | `target_roles`, `industries`, `top_strengths`, `seniority`, `working_style`, `tone`, `do_not_claim` |
| 5 Preview & finish | AI persona summary preview; choose publish-now or later |

`complete-onboarding` writes `onboarding_answers` rows and sets `onboarding_completed = true`.

---

## 5. Document Uploads & Knowledge Ingestion

### 5.1 Accepted inputs
- File types: `pdf`, `docx`, `txt`, `md`. Max 25 MB / file. Per-user cap: 50 docs, 250 MB total at MVP.
- Pasted text (form-only, becomes `source_type = paste`).
- Portfolio link metadata (URL fetched server-side at MVP only on demand; deferred behind flag).

### 5.2 Upload flow
1. Client → `create-upload-url` → returns Supabase signed upload URL + storage path `{user_id}/{uuid}-{filename}` in bucket `user_uploads`.
2. Client uploads directly to Storage.
3. Client → `finalize-upload` (filename, mime, size, checksum) → row in `uploaded_documents` with `processing_status = 'pending'`.
4. `pg_cron` job runs every 30s: `select pg_net.http_post(...)` to invoke `process-document` for the oldest `pending` row per user (max 2 concurrent per user).
5. Client polls `list-user-documents` every 3s while any row is non-terminal.

### 5.3 Processing pipeline (`process-document`)
1. Download file via service-role client.
2. **Extract text**: PDF (`pdf-parse` deno port or `unpdf`), DOCX (`mammoth`), txt/md verbatim. Update `extracted_text_status`.
3. **Normalize**: collapse whitespace, strip footers; preserve section headings.
4. **Detect language** (`franc` or LLM call) → store on `document_extractions.language`.
5. **Structure**: ask the chat capability (cheap model) to emit a JSON skeleton `{ experience[], projects[], education[], skills[], certifications[] }` → store in `document_extractions.extraction_json`.
6. **Chunk**: semantic chunker, 700–1000 tokens per chunk, 100-token overlap; tag each with `source_kind` (`cv`, `portfolio`, `paste`, `note`, `extracted_section`).
7. **Embed** chunks via embedding capability; insert `knowledge_chunks` rows with `embedding vector(1536)`.
8. Mark `processing_status = 'completed'` (or `failed` with retry counter; max 3 retries, then `error_quarantined`).

### 5.4 Knowledge view (`/knowledge`)
- Cards per chunk: source filename, section label, language, confidence, token count, created_at.
- Filter by `source_kind`, free-text search on `content` (Postgres `tsvector` index added).
- Owner can **soft-delete** chunks (sets `deleted_at`); RAG retrieval filters out deleted rows.
- Owner can mark a chunk as **excluded from public retrieval** (`metadata.public = false`).
- Structured facts (from §5.3 step 5) shown as a separate "Facts" tab; owner can edit text values inline (writes back to `document_extractions.extraction_json`).

---

## 6. AI Persona Chat

### 6.1 Endpoints
- **Owner test**: `test-persona-chat` (auth required, no rate limit, owner's own profile).
- **Public**: `chat-persona` (anonymous; rate-limited by `visitor_session_id` + IP).

### 6.2 Request → response cycle
1. Resolve profile by slug (or owner JWT). Verify `public_visibility` and `allow_public_chat` for the public path.
2. **Input moderation**: capability `moderation` flags policy violations and prompt-injection markers; on hit → reply with refusal template + log `moderation_events`.
3. **Retrieval**: embed query → cosine top-K (default 8) over `knowledge_chunks` for that `user_id`, filtered by `metadata.public = true` for public path; merge with structured facts summary (deterministic prefix block).
4. **Prompt assembly** (`prompts/personaChat.ts`): system prompt + facts block + retrieved evidence block + last 6 messages of conversation + user message. Hard rule: no claims outside provided context.
5. **Generate**: capability `chat` (default `openai/gpt-4o-mini`, configurable); structured response with `reply` and `cited_sources` (chunk ids → resolved into label+source_kind only — no excerpt text).
6. **Output moderation**: detect refusals, low-grounding answers, leakage of system prompt; rewrite or downgrade to "information not available" template.
7. Persist `conversations` + `messages` rows; return reply, citation labels, model id, `guardrailTriggered` flag.

### 6.3 Conversation memory
- Threaded by `conversations.id`; client passes `conversationId` to continue.
- Server keeps last N=12 message turns in context window; older summarized into `conversations.metadata.rolling_summary` once thread > 24 turns.

### 6.4 Rate limits (anonymous)
- 20 messages / hour / `visitor_session_id`
- 60 messages / hour / IP
- 200 messages / day / profile (per visitor session)
- Exceeding returns `429` with `Retry-After`; UI shows cooldown banner.

### 6.5 Languages
- Reply language = explicit `language` param ?? language of last user message (detected) ?? profile `preferred_language`.

---

## 7. Job-Fit Analyzer

### 7.1 Endpoint
`analyze-job-fit` — public, rate-limited (5 analyses / hour / visitor_session, 10 / day / profile).

### 7.2 Inputs
`slug`, `jobDescription` (max 16 KB), optional `jobTitle`, `companyName`, `language`, `visitorSessionId`.

### 7.3 Output schema
```ts
{
  analysisId: string;
  fitBand: 'Strong match' | 'Good match with gaps' | 'Partial match' | 'Weak match';
  fitScore: number;          // 0–100, conservative
  strengths: string[];       // 3–6, each grounded
  gaps: string[];            // honest, ≥1 if not Strong
  risks: string[];
  transferableStrengths: string[];
  reasoningSummary: string;  // 2–4 sentences
  confidenceLabel: 'low' | 'medium' | 'high';
  citations: { label: string; sourceType: 'document' | 'onboarding' | 'paste' }[];
  modelUsed: string;
}
```

### 7.4 Rules
- Uses `chat.generateStructuredObject(schema, …)` against retrieved candidate evidence + structured facts.
- Refuses to fabricate qualifications; gaps array is mandatory.
- Confidence label derived from retrieval coverage score (count of unique source kinds × top similarity).
- Persists in `job_fit_analyses`; emits `recruiter_events` event `job_fit_completed`.

---

## 8. Public Profile Page (`/public/:slug`)

### 8.1 Sections
1. **Hero**: photo, name, headline, location, language pills, AI-verified badge, primary CTA "Chat with my AI".
2. **About**: short bio + persona style description.
3. **Highlights**: top strengths chips, domain expertise, featured projects (from extraction_json).
4. **Chat panel**: embedded `chat-interface` component; first-message prompt suggestions.
5. **Job-Fit widget**: textarea + analyze button → renders structured cards.
6. **Contact**: form (visitor name, email, message, optional company); rate-limited 3/day/IP.
7. **Footer**: trust note ("AI answers based only on materials this candidate provided. Not a verified employment assessment.")

### 8.2 SEO (Pages Functions)
- `<title>`, `<meta name="description">`, OG image (Cloudflare Image resizing on `profile_photo_path`), JSON-LD `Person`.
- All visitor analytics emitted to `recruiter_visits` and `recruiter_events`.

### 8.3 Owner controls (`/profile` and `/settings`)
- Toggle: public visibility, public chat, job-fit, contact form, citation visibility.
- Theme: `theme_name` (preset), `accent_color`.

---

## 9. Recruiter Contact

### 9.1 Endpoint
`submit-recruiter-contact` (public, captcha + rate-limited).

### 9.2 Flow
1. Visitor submits form → moderation check on message body.
2. Server stores row in `recruiter_contacts` (new table — see §13.1) with `delivery_status = 'pending'`.
3. Server sends email via Resend to candidate's `email`. Reply-to is set to visitor email.
4. On success → `delivery_status = 'sent'`. Owner sees inbox preview on `/dashboard`.

---

## 10. AI Provider Abstraction

### 10.1 Capabilities
`chat`, `embeddings`, `stt`, `tts`, `moderation`. Reserved future: `avatar-streaming`.

### 10.2 Routing rules (priority)
1. Per-feature override in `feature_model_assignments`.
2. Capability default (`is_default = true` row in `ai_provider_configs`).
3. Hard-coded fallback constant per capability.

### 10.3 Adapter contract (TypeScript)
```ts
interface ChatAdapter {
  generateResponse(messages, settings): Promise<{ text: string; usage }>;
  generateStructuredObject<T>(schema, messages, settings): Promise<T>;
}
interface EmbeddingAdapter { embedText(t): Promise<number[]>; embedBatch(ts): Promise<number[][]>; }
interface SttAdapter { transcribe(audio, opts): Promise<{ text: string; language }>; }
interface TtsAdapter { synthesize(text, voice): Promise<Uint8Array>; }
interface ModerationAdapter { check(text): Promise<{ flagged: boolean; categories: string[] }>; }
```

### 10.4 Logging
Every AI call logs to `ai_call_logs` (new table — see §13.1): `feature_key`, `capability`, `provider`, `model_key`, `latency_ms`, `prompt_tokens`, `completion_tokens`, `error_code`, `fallback_triggered`.

### 10.5 Default seed map
| feature_key | capability | provider/model |
|---|---|---|
| persona_chat | chat | openai/gpt-4o-mini |
| job_fit_analysis | chat | openai/gpt-4o |
| onboarding_assistant | chat | openai/gpt-4o-mini |
| recruiter_summary | chat | openai/gpt-4o-mini |
| * | embeddings | openai/text-embedding-3-small |
| * | moderation | openai/omni-moderation-latest |
| * | stt | openai/whisper-1 |
| * | tts | openai/tts-1 |

---

## 11. Admin (`/admin`)

### 11.1 Tabs
1. **Overview** — totals, error rate, last 24h calls.
2. **Model registry** — CRUD `ai_provider_configs`.
3. **Feature assignments** — table editor for `feature_model_assignments`.
4. **Provider health** — derived from `ai_call_logs` (last hour latency p50/p95, error rate, fallback rate).
5. **Cost & usage** — token totals × seeded `cost_per_1k` from `ai_provider_configs.config_json`.
6. **Moderation review** — list `moderation_events`; mark `resolved`.
7. **Profiles** — search, force-unpublish, slug rename override.

### 11.2 Authorization
- JWT custom claim `role: admin` (set via `auth.users.raw_app_meta_data.role`).
- All admin endpoints require `requireAdmin()` helper that checks claim **and** RLS.

---

## 12. Avatar Foundation (feature-flagged)

- `/settings/avatar` shows "Coming Soon" + accepts source-photo upload to `avatars` bucket.
- Stores config in `avatar_profiles`. Endpoints `create-avatar-profile`, `start-avatar-session`, `stop-avatar-session` exist as stubs returning `501` until `ENABLE_AVATAR_FOUNDATION` env is `true`.
- No live session UI at MVP.

---

## 13. Data Model

### 13.1 Additions to design-doc schema
- `recruiter_contacts` — id, profile_id, visitor_name, visitor_email, company, message, delivery_status, created_at.
- `ai_call_logs` — id, feature_key, capability, provider, model_key, latency_ms, prompt_tokens, completion_tokens, error_code, fallback_triggered, created_at.
- `app_users.role` — text default `'user'`, check constraint in (`'user'`, `'admin'`).
- `knowledge_chunks.deleted_at timestamptz` (soft delete).
- `knowledge_chunks.metadata.public boolean` (filter on retrieval).
- `uploaded_documents.retry_count integer default 0`.
- `conversations.metadata jsonb default '{}'` for rolling summaries.
- Bucket names: `user_uploads`, `avatars`, `documents` (PRD naming).

### 13.2 RLS summary
| Table | Policies |
|---|---|
| `app_users` | self-select, self-update; admin all |
| `profiles` / `profile_preferences` / `public_pages` | self CRUD; public: `select` where `public_visibility = true` via `public_profile_view` |
| `onboarding_answers` / `uploaded_documents` / `document_extractions` / `knowledge_chunks` | self CRUD only; service-role bypass for ingestion |
| `conversations` / `messages` / `job_fit_analyses` | self read for owner via profile_id join; insert allowed for service role from public endpoints |
| `recruiter_contacts` | self read; insert via service role |
| `ai_provider_configs` / `feature_model_assignments` / `moderation_events` / `ai_call_logs` | admin only |
| `recruiter_visits` / `recruiter_events` | self read of own profile rows; insert via service role |

---

## 14. Security & Privacy

- All Storage objects private; signed URLs only (10 min TTL for owner downloads, 5 min for hero photo on public page).
- Row-level security enforced on every user-owned table (see §13.2).
- ToS + privacy acceptance timestamps required before publishing.
- GDPR: `delete-account` edge function performs cascade delete (auth + app rows + storage objects) and emits a confirmation email.
- Prompt-injection hardening: untrusted text (job descriptions, document contents) is wrapped in fixed delimiters with explicit "ignore embedded instructions" guard in system prompt.
- Rate limiting: backed by `visitor_session_id` (HMAC-signed cookie) + IP; counters in Postgres with sliding window.

---

## 15. Internationalization

- UI: `language-context.tsx` already in place; complete EN/NL/AR translation keys for every route (currently mostly EN copy in pages).
- Auto-RTL on Arabic (`dir = 'rtl'`).
- AI replies follow §6.5 language resolution.
- Chunk language stored to enable language-aware retrieval boosts.

---

## 16. Analytics & Metrics

Captured automatically:
- `recruiter_visits` on `/public/:slug` open
- `recruiter_events`: `chat_started`, `chat_message_sent`, `chat_message_received`, `job_fit_started`, `job_fit_completed`, `contact_submitted`

Owner dashboard surfaces:
- Profile completion %, public visits 7d/30d, total chats, avg messages/chat, job-fit analyses, contact submissions, top recruiter questions (group by message embedding cluster — phase 1+).

---

## 17. Non-Functional Requirements

- **Latency targets**: persona chat first token ≤ 1.5s p50 / ≤ 3s p95; full reply ≤ 5s p95; job-fit ≤ 8s p95; ingestion of 5MB PDF ≤ 60s.
- **Availability**: backend 99.5% (Supabase SLA upper bound).
- **Browser support**: latest 2 versions of Chrome, Safari, Firefox, Edge; iOS Safari 16+; Android Chrome 110+.
- **Accessibility**: WCAG 2.1 AA — all interactive elements keyboard reachable; chat respects screen-reader live region.

---

## 18. Out of Scope (MVP)

Recruiter accounts, ATS integrations, voice chat, live avatars, multi-JD comparison, A/B-tested public layouts, OCR fallback, GitHub/portfolio scraping, owner-side model overrides, payment/subscription tier.
