# Profiley

Profiley is an AI interactive CV platform: a recruiter-facing public profile backed by Supabase, document ingestion, retrieval-augmented AI chat, structured job-fit analysis, and an admin-managed model registry.

## Status

This repository is no longer a frontend-only prototype.

- Implemented: Supabase auth, Postgres schema, storage buckets, RLS, edge functions, document processing pipeline, pgvector-backed retrieval, public profiles, recruiter chat, job-fit analysis, admin model registry, and Cloudflare Pages deployment.
- Deferred: live avatar generation, voice conversations, Apple OAuth, and per-user AI model overrides.

## Feature Status

### Implemented now

- ✅ Authentication: Google, GitHub, and email magic link.
- ✅ Profile management: editable profile, preferences, visibility, and shareable public slug.
- ✅ Document upload: signed upload URLs, storage, processing status, deletion, and knowledge chunk generation.
- ✅ Knowledge base: direct chunk browsing plus retrieval over vectorized knowledge.
- ✅ AI chat: recruiter-facing persona chat backed by edge functions and citations.
- ✅ Job-fit analysis: structured analysis persisted to the database.
- ✅ Public profile: live recruiter view, activity tracking, and gated contact/chat/job-fit features.
- ✅ Dashboard: live analytics from recruiter visits, events, conversations, uploads, and job-fit runs.
- ✅ Settings and admin: privacy controls, persona tone, model registry, feature-to-model assignment, and provider health.
- ✅ Cloudflare Pages deployment: dev and prod workflows supported.

### Still not implemented

- 🔜 Live AI avatar generation.
- 🔜 Real-time voice conversations with AI.
- 🔜 Apple OAuth.
- 🔜 Per-user model overrides.
- 🔜 Full observability and test hardening (pgTAP, k6, Sentry/PostHog).

## Clarifying the previously stale README items

The following items are already implemented and should no longer be listed as future work:

- Supabase integration.
- Vector search / pgvector-backed retrieval.
- AI model switching at the platform level.

What remains true:

- Voice conversations are still not implemented.
- AI model switching is implemented for admin-managed per-feature assignments, not yet for per-user overrides.

## Technology Stack

### Frontend

- React 18
- React Router 7
- TypeScript / TSX codebase
- Vite 6
- Tailwind CSS v4
- Radix UI + shadcn/ui patterns
- Sonner

### Backend and infra

- Supabase: Auth, Postgres, Storage, Edge Functions
- pgvector: knowledge retrieval and RAG
- Cloudflare Pages + Wrangler
- Deno edge functions
- OpenAI, Gemini, and Mistral provider routing via admin-managed configs

## Project Structure

```text
apps/
   frontend/
      src/
         app/
            components/
            contexts/
            pages/
         lib/
         styles/
      functions/
      package.json
      vite.config.ts
docs/
   DESIGN_SYSTEM.md
   concept/
supabase/
   functions/
   migrations/
README.md
```

## Pages and Routes

| Route | Purpose |
|---|---|
| `/` | Marketing landing page |
| `/login` | Sign-in with Google, GitHub, or magic link |
| `/auth/callback` | OAuth / magic-link callback |
| `/onboarding` | Multi-step profile setup persisted to Supabase |
| `/dashboard` | Live owner dashboard |
| `/profile` | Profile editor |
| `/uploads` | Document upload and processing management |
| `/knowledge` | Knowledge chunk browser |
| `/chat-preview` | Owner-side chat preview |
| `/job-fit-preview` | Owner-side job-fit preview |
| `/public/:username` | Public recruiter-facing profile |
| `/settings` | Account and privacy settings |
| `/settings/ai` | Persona and model summary |
| `/settings/avatar` | Placeholder for future avatar workflow |
| `/admin` | Admin-only provider registry and health dashboard |

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- A populated frontend env file:
   - `apps/frontend/.env.development` for local/dev builds
   - `apps/frontend/.env.production` for production builds
- For Cloudflare deploys: `.github/.env.ci`
- For Supabase CLI work: `supabase/.env`

Install dependencies from the repo root:

```bash
pnpm install
```

### Run locally

Start the frontend against the development environment:

```bash
pnpm dev
```

This runs the Vite app from `apps/frontend` and reads `apps/frontend/.env.development`.

### Build

Development build:

```bash
pnpm build
```

Production build:

```bash
pnpm build:prod
```

These scripts write the SPA build output to `apps/frontend/dist` using the matching Vite mode.

### Deploy to Cloudflare Pages

Development / dev Pages project:

```bash
pnpm deploy
```

Production / prod Pages project:

```bash
pnpm deploy:prod
```

These scripts:

1. Source `.github/.env.ci`.
2. Build the frontend with the matching mode.
3. Deploy `apps/frontend/dist` with Wrangler to the configured Pages project.

The deploy scripts expect these variables in `.github/.env.ci`:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_PAGES_PROJECT_DEV`
- `CLOUDFLARE_PAGES_PROJECT_PROD`

### Supabase deployment notes

Supabase is managed separately from the frontend deploy. Use the workspace files first, then push with the CLI.

Development environment:

```bash
set -a && source supabase/.env && set +a
supabase link --project-ref "$SUPABASE_PROJECT_REF_DEV"
supabase db push --password "$SUPABASE_DB_PASSWORD_DEV"
supabase secrets set --project-ref "$SUPABASE_PROJECT_REF_DEV" --env-file supabase/functions/.env.development
```

Production is the same flow with the `_PROD` variables and `supabase/functions/.env.production`.

## Useful Scripts

Run these from the repository root:

- `pnpm dev`: run the frontend locally in development mode.
- `pnpm build`: create a development build.
- `pnpm build:prod`: create a production build.
- `pnpm preview`: preview the built frontend package.
- `pnpm deploy`: build and deploy to the dev Cloudflare Pages project.
- `pnpm deploy:prod`: build and deploy to the prod Cloudflare Pages project.

## Current State

Implemented end-to-end:

- Supabase-backed authentication and RLS-scoped data access.
- Storage-backed document uploads and processing records.
- Vector-backed retrieval for chat and job-fit flows.
- Public profile publishing and recruiter event tracking.
- Admin model configuration and feature assignment.
- Dev deployment to Cloudflare Pages.

Still intentionally deferred:

- Avatar foundation and voice UX.
- Per-user AI provider overrides.
- Broader operational hardening and test coverage.

## Design System

The UI system is documented in `docs/DESIGN_SYSTEM.md`.

## Security Notes

For production use with real user data:

- Keep secrets in the gitignored env files documented in `AGENTS.md`.
- Do not put secrets in `VITE_*` variables.
- Keep Supabase changes in workspace files before applying them.
- Preserve and test RLS policies when changing schema or queries.

## Credits

- Product requirements: `apps/frontend/src/imports/profiley-prd.md`
- UI component foundations: Radix UI and shadcn/ui patterns
- Styling: Tailwind CSS v4

---

Last updated: April 27, 2026
Status: active development, dev environment deployed
