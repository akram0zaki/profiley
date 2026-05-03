# Profiley — Initialization & Bring-Up Guide

This document is the operational runbook to take the workspace from "code only"
to a running production-grade MVP. Everything Supabase-related has been written
to the workspace under `supabase/migrations/` and `supabase/functions/`; **do
not make schema or function changes through the Supabase dashboard** — edit the
files and re-deploy.

> Audience: a single operator (you) bringing the project online for the first
> time. Estimated bring-up: a focused afternoon, mostly waiting for builds and
> DNS.

---

## 1. Prerequisites — install once

| Tool | Why | Install |
|------|-----|---------|
| Node ≥ 20 + pnpm ≥ 9 | Frontend build, monorepo workspace | `corepack enable && corepack prepare pnpm@9 --activate` |
| Supabase CLI ≥ 1.200 | Push migrations, deploy edge functions | `brew install supabase/tap/supabase` |
| Deno ≥ 1.45 | Type-check edge functions locally | `brew install deno` |
| Wrangler ≥ 3 | Cloudflare Pages deploy + Functions preview | `pnpm dlx wrangler --version` |
| GitHub CLI (optional) | Set repo secrets quickly | `brew install gh` |

Clone the repo and install workspace deps:

```bash
git clone <repo> profiley && cd profiley
pnpm install
```

---

## 2. Third-party accounts to create

Create these before deploying. Save credentials in a password manager.

1. **Supabase** — new project (region close to users). Copy:
   - `Project Ref` (e.g. `xxxxxxxxxxxx`)
   - `URL` (e.g. `https://xxxxxxxxxxxx.supabase.co`)
   - `anon (publishable) key`
   - `service_role key`
   - Database password
2. **OpenAI** — API key with access to `gpt-4o-mini`,
   `text-embedding-3-small`, `omni-moderation-latest`, `whisper-1`, `tts-1`.
3. **Google AI Studio** — Gemini API key (chat fallback).
4. **Mistral** — API key (second chat fallback). Optional but recommended.
5. **hCaptcha** — site key + secret for the recruiter contact form. Use the
   "invisible" sitekey type.
6. **Resend** — API key + verified sender domain. Configure SPF/DKIM/DMARC for
   the domain you'll send from.
7. **Cloudflare** — account; create a Pages project (initially empty / Direct
   Upload) and an API token with `Account:Cloudflare Pages:Edit`.
8. **GitHub OAuth App** — for "Continue with GitHub" sign-in. Callback URL:
   `https://<your-supabase-ref>.supabase.co/auth/v1/callback`.
9. **Google OAuth Client** (Web) — same callback URL as above. Authorize the
   custom domain you'll serve Profiley on.

---

## 3. One-time secret material to generate

Run locally and paste each value into the right env file (table in §3a):

```bash
# 32-byte cron shared secret used by pg_cron → process-document
openssl rand -hex 32                # save as CRON_SECRET

# 32-byte HMAC key used to derive deterministic visitor session ids server-side
openssl rand -hex 32                # save as VISITOR_SESSION_HMAC_SECRET
```

### 3a. Where every credential lives in the workspace

All of these files are **gitignored**. Copy each `*.example` to the path on
the right and fill in the values you collected in §2–§3.

| Credential | File (gitignored) | Variable name |
|---|---|---|
| Supabase access token (project-scoped) | `supabase/.env` | `SUPABASE_ACCESS_TOKEN` |
| Supabase dev/prod project refs | `supabase/.env` | `SUPABASE_PROJECT_REF_DEV`, `SUPABASE_PROJECT_REF_PROD` |
| Supabase dev/prod DB passwords | `supabase/.env` | `SUPABASE_DB_PASSWORD_DEV`, `SUPABASE_DB_PASSWORD_PROD` |
| OpenAI API key | `supabase/functions/.env.development` (dev) and `.env.production` (prod) | `OPENAI_API_KEY` |
| Google Gemini API key | `supabase/functions/.env.{development,production}` | `GOOGLE_GEMINI_API_KEY` |
| Mistral API key | `supabase/functions/.env.{development,production}` | `MISTRAL_API_KEY` |
| hCaptcha **server** secret | `supabase/functions/.env.{development,production}` | `HCAPTCHA_SECRET` |
| Resend API key | `supabase/functions/.env.{development,production}` | `RESEND_API_KEY` |
| Resend verified sender | `supabase/functions/.env.{development,production}` | `RECRUITER_EMAIL_FROM`, `RECRUITER_EMAIL_FROM_NAME` |
| `CRON_SECRET` | `supabase/functions/.env.{development,production}` | `CRON_SECRET` (also insert into `public.runtime_settings`, see §4) |
| `VISITOR_SESSION_HMAC_SECRET` | `supabase/functions/.env.{development,production}` | `VISITOR_SESSION_HMAC_SECRET` |
| Service role key (auto-injected in prod; for local serve only) | `supabase/functions/.env.{development,production}` | `SUPABASE_SERVICE_ROLE_KEY` |
| hCaptcha **public** site key | `apps/frontend/.env.development` / `.env.production` | `VITE_CAPTCHA_SITE_KEY` |
| Vite Supabase URL + anon key | `apps/frontend/.env.development` / `.env.production` | `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` |
| Pages Function SSR Supabase URL + anon key | `apps/frontend/.dev.vars` (local), `apps/frontend/.prod.vars` (reference for the Cloudflare dashboard) | `SUPABASE_URL`, `SUPABASE_ANON_KEY` |
| Cloudflare API token (used by `wrangler` and/or GitHub Actions) | `.github/.env.ci` | `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_PAGES_PROJECT_DEV`, `CLOUDFLARE_PAGES_PROJECT_PROD` |

> The Cloudflare API token must be sourced from `.github/.env.ci` before any
> `wrangler` command (`set -a && source .github/.env.ci && set +a`). Wrangler
> auto-reads `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` from the
> environment, so no flags are needed. Do **not** run `wrangler login` — it
> stores credentials outside the workspace.

Quick scaffold:

```bash
cp apps/frontend/.env.example                  apps/frontend/.env.development
cp apps/frontend/.env.example                  apps/frontend/.env.production
cp supabase/.env.example                       supabase/.env
cp supabase/functions/.env.example             supabase/functions/.env.development
cp supabase/functions/.env.example             supabase/functions/.env.production
cp .github/.env.ci.example                     .github/.env.ci
# .dev.vars / .prod.vars already include their own header template
```

---

## 4. Provision Supabase from the workspace

Link the local repo to your project once:

```bash
supabase login
supabase link --project-ref <YOUR_PROJECT_REF>
```

Apply all workspace migrations:

```bash
supabase db push --password '<DB_PASSWORD>'
```

Set the runtime settings that `pg_cron` reads when calling
`process-document` and `process-account-deletions`. Run this SQL in the Supabase SQL editor after migrations
have been applied:

```sql
insert into public.runtime_settings (key, value)
values
  ('process_document_url', 'https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/process-document'),
  ('account_deletions_url', 'https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/process-account-deletions'),
  ('retention_purge_url', 'https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/process-retention-purge'),
  ('public_job_fit_enabled', 'true'),
  ('cron_secret', '<CRON_SECRET>')
on conflict (key) do update
set value = excluded.value,
    updated_at = timezone('utc', now());
```

Use `public_job_fit_enabled = 'false'` to disable public recruiter job-fit analysis globally without changing each profile.

If `process_document_url` is already set, migration `0033_backfill_runtime_function_urls.sql` can derive `account_deletions_url` and `retention_purge_url` automatically. Keep the manual SQL above for first-time environment bootstrap where no function URL rows exist yet.

> Migration `0024_runtime_settings.sql` stores these in
> `public.runtime_settings` because Supabase-managed Postgres can reject
> `ALTER DATABASE ... SET` for custom GUC names.

Promote your own user to admin once you've signed in once (see §7):

```sql
-- After your first login, find your user id in auth.users and run:
update auth.users
set raw_app_meta_data = jsonb_set(coalesce(raw_app_meta_data, '{}'::jsonb), '{role}', '"admin"')
where email = 'you@example.com';
```

---

## 5. Configure auth providers in Supabase

In Supabase → **Authentication → Providers**:

- **Email** → enable, "Confirm email" off for magic links during dev.
- **Google** → paste client ID/secret from §2.9. Redirect URL is filled in.
- **GitHub** → paste client ID/secret from §2.8.

Add allowed redirect URLs (Authentication → URL Configuration):
- `http://localhost:5173/auth/callback`
- `https://<your-cloudflare-pages-domain>/auth/callback`
- `https://<your-custom-domain>/auth/callback` (later)

Set Site URL to your custom domain (or the Pages domain pre-launch).

---

## 6. Deploy the edge functions

The agent workflow uses the project-scoped access token in `supabase/.env`
rather than the globally-logged-in CLI session (see
[`AGENTS.md`](../../AGENTS.md)). Source it once per shell:

```bash
set -a && source supabase/.env && set +a
```

Push every secret from the matching env file to the right project (idempotent):

```bash
# Dev
supabase secrets set \
  --project-ref "$SUPABASE_PROJECT_REF_DEV" \
  --env-file supabase/functions/.env.development

# Prod
supabase secrets set \
  --project-ref "$SUPABASE_PROJECT_REF_PROD" \
  --env-file supabase/functions/.env.production
```

Never paste raw secrets on the command line — always go through the env file
so they stay out of shell history.

Deploy every function (the deploy workflow does this in CI; locally):

```bash
for fn in supabase/functions/*/; do
  name=$(basename "$fn")
  [[ "$name" == "_shared" ]] && continue
  supabase functions deploy "$name" --project-ref "$SUPABASE_PROJECT_REF_DEV" --no-verify-jwt
done
```

`--no-verify-jwt` is required because public endpoints (`get-public-profile`,
`track-recruiter-event`, `submit-recruiter-contact`, `chat-persona`) handle
unauthenticated callers, and cron-driven endpoints such as
`process-document` and `process-account-deletions` authenticate with
`X-Cron-Secret` instead of a JWT. Authenticated endpoints validate the JWT
manually via `requireUser()`.

---

## 7. Deploy the frontend

### Local sanity check

```bash
cp apps/frontend/.env.example apps/frontend/.env.local   # if present, else create
# Fill in:
# VITE_SUPABASE_URL=https://<REF>.supabase.co
# VITE_SUPABASE_PUBLISHABLE_KEY=<anon key>
pnpm --filter @profiley/frontend dev
```

Visit `http://localhost:5173`, click "Continue with Google" or send a magic
link; you should land on `/dashboard` and a row should appear in `profiles`.

### Cloudflare Pages

1. Cloudflare → Pages → **Create project → Connect to Git** → pick the repo.
2. Build command: `pnpm --filter @profiley/frontend build`. Output:
   `apps/frontend/dist`. Root directory: leave blank.
3. Environment variables (Production + Preview):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_URL` (used by `functions/public/[slug].ts`)
   - `SUPABASE_ANON_KEY` (same — used by the Pages Function)
   - `PUBLIC_SITE_URL=https://<your-domain>`
4. Commit `apps/frontend/functions/public/[slug].ts` is automatically picked up
   by Pages Functions and runs on every `/public/<slug>` request, injecting
   `<title>`, OG tags, and JSON-LD before serving the SPA shell.
5. Add the custom domain in Pages → **Custom domains**.

### Cloudflare Pages — manual deploy with Wrangler (no GitHub link)

This is the path you're using — Cloudflare Pages is **not** connected to
the Git repo. Wrangler authenticates via env vars, sourced from
`.github/.env.ci`. There are **two** Pages projects, one per Supabase
environment:

| Env | Pages project | Cloudflare URL pattern |
|-----|---------------|------------------------|
| dev | `$CLOUDFLARE_PAGES_PROJECT_DEV` (e.g. `profiley-dev`) | `https://profiley-dev.pages.dev` |
| prod | `$CLOUDFLARE_PAGES_PROJECT_PROD` (e.g. `profiley`) | `https://profiley.pages.dev` |

First, create each project once (only on first deploy):

```bash
set -a && source .github/.env.ci && set +a

# Dev
pnpm --filter @profiley/frontend exec wrangler \
  pages project create "$CLOUDFLARE_PAGES_PROJECT_DEV" \
  --production-branch=main

# Prod
pnpm --filter @profiley/frontend exec wrangler \
  pages project create "$CLOUDFLARE_PAGES_PROJECT_PROD" \
  --production-branch=main
```

Then, on every deploy, build with the **matching** env file and target the
right Pages project:

```bash
set -a && source .github/.env.ci && set +a

# ---- Dev ----
# Vite reads apps/frontend/.env.development when --mode=development
pnpm --filter @profiley/frontend exec vite build --mode=development
pnpm --filter @profiley/frontend exec wrangler \
  pages deploy apps/frontend/dist \
  --project-name="$CLOUDFLARE_PAGES_PROJECT_DEV" \
  --branch=main

# ---- Prod ----
# Default `vite build` reads apps/frontend/.env.production
pnpm --filter @profiley/frontend build
pnpm --filter @profiley/frontend exec wrangler \
  pages deploy apps/frontend/dist \
  --project-name="$CLOUDFLARE_PAGES_PROJECT_PROD" \
  --branch=main
```

For the Pages Functions runtime env (`SUPABASE_URL`, `SUPABASE_ANON_KEY`,
`PUBLIC_APP_ORIGIN`, etc.), set each project's vars in the Cloudflare
dashboard once:

- Cloudflare → Pages → **profiley-dev** → Settings → Environment variables
  → paste keys from `apps/frontend/.dev.vars` into the **Production**
  environment of that project.
- Cloudflare → Pages → **profiley** → Settings → Environment variables →
  paste keys from `apps/frontend/.prod.vars` into the **Production**
  environment of that project.

The `.prod.vars` / `.dev.vars` files are read **only** by `wrangler pages
dev` for local preview — they are not uploaded by `wrangler pages deploy`.

### Or use the GitHub Actions deploy workflow

Set repo secrets (Settings → Secrets and variables → Actions):

| Secret | Source |
|--------|--------|
| `SUPABASE_ACCESS_TOKEN` | Supabase → Account → Access Tokens |
| `SUPABASE_DB_PASSWORD` | from §2.1 |
| `SUPABASE_PROJECT_REF` | from §2.1 |
| `SUPABASE_URL` | from §2.1 |
| `SUPABASE_PUBLISHABLE_KEY` | anon key |
| `CLOUDFLARE_API_TOKEN` | from §2.7 |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare dashboard sidebar |
| `CLOUDFLARE_PAGES_PROJECT_DEV` | Pages project name for the dev environment (e.g. `profiley-dev`) |
| `CLOUDFLARE_PAGES_PROJECT_PROD` | Pages project name for the prod environment (e.g. `profiley`) |

Run the `Deploy` workflow manually when you want to apply migrations,
deploy functions, and publish the frontend. Commits to `main` no longer
trigger GitHub Actions automatically.

---

## 8. Smoke test (the happy path)

1. **Sign in** → magic link or OAuth → `/auth/callback` calls
   `initialize-user-profile` and lands on `/dashboard`.
2. **Onboard** → `/onboarding` (UI is scaffold; will call
   `complete-onboarding` once that page is wired).
3. **Upload a CV PDF** → `/uploads`. The flow is:
   `create-upload-url` → `PUT signedUrl` → `finalize-upload`. `pg_cron` triggers
   `process-document` within ~60s; document moves from `processing` → `ready`
   in `documents` table.
4. **Chat preview** → `/chat-preview` → uses `test-persona-chat` (no rate
   limits, citations rendered as `ref #N`).
5. **Publish** → `/profile` (or via `api.publishProfile({ slug })`) → row in
   `profiles` flips `public_visibility=true`.
6. **Public view** → open `/public/<slug>` in an incognito tab. Cloudflare
   Pages Function rewrites `<title>` + OG tags. Chat tab calls `chat-persona`
   (rate-limited).
7. **Job-fit** → paste any JD → `analyze-job-fit` returns structured JSON.
8. **Recruiter contact** → fill the form on a public profile → email arrives
   at the inbox above (`RECRUITER_EMAIL_FROM`).
9. **Admin** → `/admin` (visible because §4 promoted you) → models, moderation
   queue, profiles tabs hit the `admin-*` endpoints.

---

## 9. Day-2 operations

- **Adjust models per feature** — `admin-set-feature-model` (UI) or directly
  insert into `feature_model_assignments`. Resolution order:
  `feature_model_assignments` → `ai_provider_configs.is_default` → hardcoded
  `FALLBACKS` map in `_shared/ai/router.ts`.
- **Provider health** — `admin-provider-health` aggregates `ai_call_logs`
  (p50/p95 latency, error rate, fallback rate) over the last 24 h.
- **Moderation queue** — flagged inputs/outputs land in `moderation_flags`;
  `admin-list-moderation` + `admin-resolve-moderation` close them.
- **Reprocess a stuck document** — set `processing_status='pending'` on the
  row; `pg_cron` will retry up to 3 times (counter on `process_attempts`).
- **Purge a user** — admin-only SQL: `delete from auth.users where id=...`
  cascades through profile/documents/conversations because of FKs.
- **Rotate secrets** — re-run `supabase secrets set …`; redeploys not needed.
- **Disable voice/avatar** — secrets default `ENABLE_AVATAR_FOUNDATION=false`;
  `voice-transcribe` and `create-avatar-profile` return HTTP 501 until set to
  `true`.

---

## 10. Pending implementation work

The bring-up above gives you a working backend + an end-to-end critical path
(login → preview chat → publish → public chat → recruiter contact). The
following frontend pages are still scaffold UI from the original Figma import
and need to be wired against `apps/frontend/src/lib/api.ts`:

- `dashboard.tsx` — call `api.listUserDocuments`, surface counts + publish
  toggle (`api.publishProfile`).
- `onboarding.tsx` — collect answers → `api.completeOnboarding`.
- `uploads.tsx` — `createUploadUrl` → `PUT` → `finalizeUpload`; poll
  `listUserDocuments` for `processing_status`.
- `knowledge.tsx` — `supabase.from('knowledge_chunks').select(...)` (RLS
  scoped to current user).
- `job-fit-preview.tsx` — call `api.analyzeJobFit`.
- `public-profile.tsx` — replace mock profile with `api.getPublicProfile`,
  call `api.trackRecruiterEvent` on view, wire contact form to
  `api.submitRecruiterContact`.
- `settings.tsx` / `settings-ai.tsx` / `settings-avatar.tsx` — read/write
  `profile_preferences` via the Supabase client.
- `admin.tsx` — tabs that hit each `admin-*` endpoint.

Tracking these as P0/P1 in `docs/concept/profiley-plan.md`. Each one is a
mechanical refactor: import `api` from `lib/api.ts`, replace mock state with a
loader + `useState`, surface `ApiError` in the existing toast/alert UI.

---

## 11. Troubleshooting cheat sheet

| Symptom | First thing to check |
|---------|----------------------|
| `process-document` never runs | `select * from cron.job;` should list one row; `select * from cron.job_run_details order by start_time desc limit 5;` for errors. Confirm the two `public.runtime_settings` rows from §4 exist. |
| Cron returns 401 | `public.runtime_settings.key = 'cron_secret'` mismatches the `CRON_SECRET` function secret. |
| Public chat returns `RATE_LIMITED` immediately | `rate_limit_buckets` row leaked from a prior visitor; either wait an hour or `delete from rate_limit_buckets where bucket_key like 'chat:%';`. |
| Recruiter email never arrives | Resend dashboard → Logs. Most failures are SPF/DKIM not yet verified. |
| OAuth loop | Redirect URL not on the allow-list (§5). |
| Empty citations | Document still `processing` (cron lag) or chunking failed; check `documents.processing_status` + `processing_error`. |
| 500 from any function with `VALIDATION_ERROR` | Body shape mismatch — see Zod schema in `supabase/functions/_shared/validation/schemas.ts`. |

---

## 12. Where to look in the code

- Schema: `supabase/migrations/0001_*.sql` … `0024_runtime_settings.sql`
- Edge function shared lib: `supabase/functions/_shared/`
- Edge functions: `supabase/functions/<endpoint>/index.ts`
- Frontend API client: `apps/frontend/src/lib/{supabase,api,auth}.ts`
- Auth guards: `apps/frontend/src/app/components/auth-guards.tsx`
- SSR Pages Function: `apps/frontend/functions/public/[slug].ts`
- CI/CD: `.github/workflows/{ci,deploy}.yml`
- High-level plan + status: [`profiley-plan.md`](profiley-plan.md)
- Spec of record: [`profiley-specs.md`](profiley-specs.md) (if present),
  otherwise [`profiley-prd.md`](profiley-prd.md) and
  [`profiley-design.md`](profiley-design.md).

When in doubt, search for the function name in
`supabase/functions/<name>/index.ts` — every endpoint is ≤ 200 LOC and
self-contained on top of `_shared`.
