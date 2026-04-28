# Profiley

> An open-source, AI-powered interactive CV platform — turn your career history into a recruiter-facing public profile with retrieval-augmented chat and structured job-fit analysis.

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](LICENSE)
[![Docs: CC BY 4.0](https://img.shields.io/badge/Docs-CC_BY_4.0-lightgrey.svg)](LICENSE)
[![Made with React](https://img.shields.io/badge/React-18-61dafb.svg)](https://react.dev)
[![Powered by Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20Edge-3ecf8e.svg)](https://supabase.com)
[![Deployed on Cloudflare Pages](https://img.shields.io/badge/Cloudflare-Pages-f38020.svg)](https://pages.cloudflare.com)

Profiley lets candidates upload their CV and supporting documents, automatically extracts and indexes them into a searchable knowledge base, and exposes a polished public profile that recruiters can browse, chat with, and run job-fit analysis against — all backed by transparent, admin-managed AI model routing.

- **Repository:** <https://github.com/akram0zaki/profiley>
- **Status:** active development; dev environment deployed
- **License:** AGPL-3.0-or-later (code) · CC BY 4.0 (documentation)

---

## Table of Contents

- [Highlights](#highlights)
- [Feature Status](#feature-status)
- [Technology Stack](#technology-stack)
- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Pages and Routes](#pages-and-routes)
- [Getting Started](#getting-started)
- [Useful Scripts](#useful-scripts)
- [Deployment](#deployment)
- [Documentation](#documentation)
- [Security](#security)
- [Contributing](#contributing)
- [License and Attribution](#license-and-attribution)

---

## Highlights

- 🧠 **Retrieval-augmented chat** over your own documents using `pgvector` and an admin-managed model registry (OpenAI, Gemini, Mistral).
- 📄 **Document ingestion pipeline** with signed uploads, background processing, chunking, and embeddings — all in Supabase Edge Functions.
- 🌐 **Public recruiter profile** with shareable slug, gated contact form, live persona chat, and structured job-fit analysis.
- 📊 **Owner dashboard** with live analytics: recruiter visits, events, conversations, uploads, and job-fit runs.
- 🛡️ **Row-Level Security everywhere** — multi-tenant data is RLS-scoped from day one.
- ☁️ **One-command deploys** to Cloudflare Pages (frontend) and Supabase (schema + edge functions).

## Feature Status

### Implemented

- ✅ Authentication: Google, GitHub, and email magic link
- ✅ Profile management: editable profile, preferences, visibility, and shareable public slug
- ✅ Document upload: signed upload URLs, storage, processing status, deletion, and knowledge chunk generation
- ✅ Knowledge base: direct chunk browsing plus retrieval over vectorized knowledge
- ✅ AI chat: recruiter-facing persona chat backed by edge functions, with citations
- ✅ Job-fit analysis: structured analysis persisted to the database
- ✅ Public profile: live recruiter view, activity tracking, and gated contact/chat/job-fit features
- ✅ Dashboard: live analytics from recruiter visits, events, conversations, uploads, and job-fit runs
- ✅ Settings and admin: privacy controls, persona tone, model registry, feature-to-model assignment, and provider health
- ✅ Cloudflare Pages deployment: dev and prod workflows

### Roadmap

- 🔜 Live AI avatar generation
- 🔜 Real-time voice conversations with AI
- 🔜 Apple OAuth
- 🔜 Per-user model overrides
- 🔜 Full observability and test hardening (pgTAP, k6, Sentry/PostHog)

## Technology Stack

**Frontend**

- React 18 · React Router 7 · TypeScript
- Vite 6 · Tailwind CSS v4
- Radix UI + shadcn/ui patterns · Sonner

**Backend & infrastructure**

- Supabase: Auth, Postgres, Storage, Edge Functions (Deno)
- `pgvector` for embeddings and RAG
- Cloudflare Pages + Wrangler
- AI provider routing across OpenAI, Gemini, and Mistral via admin-managed configs

## Architecture Overview

```text
                 ┌────────────────────────┐
                 │  Cloudflare Pages      │
                 │  React SPA (Vite)      │
                 └──────────┬─────────────┘
                            │  HTTPS
                            ▼
   ┌────────────────────────────────────────────────┐
   │               Supabase Project                 │
   │                                                │
   │  Auth                                          │
   │   │                                            │
   │   ▼                                            │
   │  Postgres (RLS)  ◄──►  Edge Functions (Deno)   │
   │   │                         │                  │
   │   ▼                         ▼                  │
   │  pgvector            AI providers              │
   │                      (OpenAI / Gemini /        │
   │                      Mistral, admin-routed)    │
   │                                                │
   │  Storage — signed uploads & documents          │
   └────────────────────────────────────────────────┘
```

See [`docs/concept/`](docs/concept/) and [`docs/flows/`](docs/flows/) for deeper design notes and flow diagrams.

## Project Structure

```text
apps/
  frontend/                  # React SPA (Vite, Tailwind, shadcn/ui)
    src/app/                 # Pages, components, contexts
    src/lib/                 # Shared client utilities
    functions/               # Cloudflare Pages functions
    test/                    # Vitest specs
supabase/
  migrations/                # Versioned SQL migrations (RLS, schema, seeds)
  functions/                 # Deno edge functions (one folder per function)
  tests/                     # Deno tests for edge functions
docs/
  DESIGN_SYSTEM.md
  I18N_RTL_GUIDE.md
  testing.md
  concept/                   # Product design, PRD, init guide
  flows/                     # Mermaid diagrams for ingestion, chat, etc.
```

## Pages and Routes

| Route | Purpose |
|---|---|
| `/` | Marketing landing page |
| `/login` | Sign-in with Google, GitHub, or magic link |
| `/auth/callback` | OAuth / magic-link callback |
| `/onboarding` | Multi-step profile setup persisted to Supabase |
| `/dashboard` | Owner dashboard with live analytics |
| `/profile` | Profile editor |
| `/uploads` | Document upload and processing management |
| `/knowledge` | Knowledge chunk browser |
| `/chat-preview` | Owner-side chat preview |
| `/job-fit-preview` | Owner-side job-fit preview |
| `/public/:username` | Public recruiter-facing profile |
| `/settings` | Account and privacy settings |
| `/settings/ai` | Persona and model summary |
| `/settings/avatar` | Placeholder for the future avatar workflow |
| `/admin` | Admin-only provider registry and health dashboard |

## Getting Started

### Prerequisites

- Node.js **20+**
- pnpm **9+**
- A Supabase project (free tier is fine for local development)
- Populated env files:
  - `apps/frontend/.env.development` — local/dev frontend builds
  - `apps/frontend/.env.production` — production frontend builds
  - `supabase/.env` — Supabase CLI work (project refs, DB password)
  - `supabase/functions/.env.development` / `.env.production` — edge function secrets
  - `.github/.env.ci` — Cloudflare deploys

> See [`supabase/functions/.env.example`](supabase/functions/.env.example) and [`docs/concept/profiley-init-guide.md`](docs/concept/profiley-init-guide.md) for the full list of required keys.

### Install

```bash
git clone https://github.com/akram0zaki/profiley.git
cd profiley
pnpm install
```

### Run locally

```bash
pnpm dev
```

This runs the Vite app from `apps/frontend` against `apps/frontend/.env.development`.

### Test

```bash
pnpm test            # frontend (Vitest) + edge (Deno) tests
pnpm test:frontend   # Vitest only
pnpm test:edge       # Deno tests in supabase/tests/
```

Testing strategy and conventions are documented in [`docs/testing.md`](docs/testing.md).

### Build

```bash
pnpm build       # development build (apps/frontend/dist)
pnpm build:prod  # production build
pnpm preview     # preview the built bundle
```

## Useful Scripts

Run from the repository root:

| Script | Description |
|---|---|
| `pnpm dev` | Run the frontend locally in development mode |
| `pnpm build` / `pnpm build:prod` | Build the SPA in development / production mode |
| `pnpm preview` | Preview the built frontend bundle |
| `pnpm test` | Run frontend and edge tests |
| `pnpm deploy` | Build and deploy to the dev Cloudflare Pages project |
| `pnpm deploy:prod` | Build and deploy to the prod Cloudflare Pages project |

## Deployment

### Frontend → Cloudflare Pages

```bash
pnpm deploy        # dev project
pnpm deploy:prod   # prod project
```

Each deploy script sources `.github/.env.ci`, builds with the matching Vite mode, and publishes `apps/frontend/dist` via Wrangler. Required variables in `.github/.env.ci`:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_PAGES_PROJECT_DEV`
- `CLOUDFLARE_PAGES_PROJECT_PROD`

### Backend → Supabase

Schema and edge functions are managed entirely through workspace files (`supabase/migrations/*.sql` and `supabase/functions/<name>/index.ts`) — never via the dashboard.

```bash
set -a && source supabase/.env && set +a

# Schema
supabase link --project-ref "$SUPABASE_PROJECT_REF_DEV"
supabase db push --password "$SUPABASE_DB_PASSWORD_DEV"

# Edge function secrets
supabase secrets set \
  --project-ref "$SUPABASE_PROJECT_REF_DEV" \
  --env-file supabase/functions/.env.development

# Edge functions
supabase functions deploy <name> --project-ref "$SUPABASE_PROJECT_REF_DEV"
```

Use the corresponding `_PROD` variables and `supabase/functions/.env.production` for production. Full deploy checklist: [`docs/concept/profiley-init-guide.md`](docs/concept/profiley-init-guide.md).

## Documentation

- [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) — UI tokens, components, and patterns
- [`docs/I18N_RTL_GUIDE.md`](docs/I18N_RTL_GUIDE.md) — locale and RTL rules
- [`docs/testing.md`](docs/testing.md) — frontend and edge testing strategy
- [`docs/concept/profiley-prd.md`](docs/concept/profiley-prd.md) — product requirements
- [`docs/concept/profiley-design.md`](docs/concept/profiley-design.md) — design notes
- [`docs/concept/profiley-init-guide.md`](docs/concept/profiley-init-guide.md) — secrets, Supabase setup, deploy checklist
- [`docs/flows/`](docs/flows/) — Mermaid diagrams for ingestion, chat, and other flows
- [`AGENTS.md`](AGENTS.md) — cross-cutting rules for automated and human contributors

## Security

For production use with real user data:

- Keep secrets in the gitignored env files documented in [`AGENTS.md`](AGENTS.md). **Never** put secrets in `VITE_*` variables — those are inlined into the public client bundle.
- Apply schema changes through `supabase/migrations/` and verify Row-Level Security policies on every change.
- Rotate the Supabase DB password and provider API keys before opening the project to external traffic.
- Found a vulnerability? Please open a private security advisory via GitHub rather than a public issue.

## Contributing

Contributions are welcome — see [`CONTRIBUTING.md`](CONTRIBUTING.md) for the full policy. In short:

- Code is contributed under **AGPL-3.0-or-later**.
- Documentation is contributed under **CC BY 4.0**.
- The Profiley name, logo, and branding are **not** licensed for reuse — see [`TRADEMARKS.md`](TRADEMARKS.md).
- Follow the workspace conventions in [`AGENTS.md`](AGENTS.md) and the runtime-specific instructions under `.github/instructions/`.
- Add or update tests for every functional change and update [`CHANGELOG.md`](CHANGELOG.md) for meaningful product or operational changes.

## License and Attribution

- **Source code:** [GNU Affero General Public License v3.0 or later](LICENSE). If you modify and run Profiley as a network service, you must make the corresponding source code available to its users.
- **Documentation and written content:** Creative Commons Attribution 4.0 International, unless otherwise noted.
- **Branding and trademarks:** the Profiley name, logo, and visual identity are reserved — see [`TRADEMARKS.md`](TRADEMARKS.md).
- Third-party notices and credits live in [`NOTICE`](NOTICE) and [`ATTRIBUTIONS.md`](ATTRIBUTIONS.md).

Copyright © 2026 Akram Zaki.

---

<sub>Built with React, Supabase, and Cloudflare. Last updated: April 28, 2026.</sub>
