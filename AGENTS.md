# Profiley Agent Instructions

Use this file for cross-cutting rules only. Runtime-specific guidance lives in
[`frontend.instructions.md`](.github/instructions/frontend.instructions.md)
and [`supabase.instructions.md`](.github/instructions/supabase.instructions.md).

## Non-negotiables

- Add or update tests for every functional change.
- Keep changes in workspace files first. For Supabase work, edit
  `supabase/migrations/*.sql` or `supabase/functions/<name>/index.ts` instead
  of using the dashboard.
- Update [`CHANGELOG.md`](CHANGELOG.md) for meaningful product or operational
  changes.
- Update nearby documentation when behavior, setup, or operator workflow
  changes.
- Never commit gitignored env files or secrets.

## Repo map

- [`README.md`](README.md): product overview, repo layout, root scripts, deploy commands.
- [`docs/testing.md`](docs/testing.md): frontend and edge test strategy.
- [`docs/concept/profiley-init-guide.md`](docs/concept/profiley-init-guide.md):
  secret locations, Supabase setup, deploy checklist.
- [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md): UI system and tokens.
- [`docs/I18N_RTL_GUIDE.md`](docs/I18N_RTL_GUIDE.md): locale and RTL rules.
- [`CONTRIBUTING.md`](CONTRIBUTING.md): licensing and contribution constraints.

## Default commands

- `pnpm dev`: run the frontend locally.
- `pnpm test`: run frontend and edge tests.
- `pnpm test:frontend`: run Vitest once.
- `pnpm test:edge`: run Deno tests in `supabase/tests/`.
- `pnpm build` / `pnpm build:prod`: build the SPA with explicit Vite mode.
- `pnpm run ci`: run every CI check (build, `deno check`, tests). The
  `.githooks/pre-push` hook runs this on push; `pnpm install` enables it.

## Deploying

Full commands live in the [`README.md` Deployment section](README.md#deployment);
first-time setup and the smoke test are in
[`docs/concept/profiley-init-guide.md`](docs/concept/profiley-init-guide.md).

- Two environments: dev (staging) and prod. Each pairs a Supabase project
  (`SUPABASE_PROJECT_REF_DEV` / `_PROD`) with a Cloudflare Pages project
  (`CLOUDFLARE_PAGES_PROJECT_DEV` / `_PROD`).
- Order: run `pnpm test`, deploy the backend (`supabase db push`,
  `supabase secrets set`, `supabase functions deploy <name> --no-verify-jwt`
  for every function except `_shared`), then the frontend with `pnpm run deploy`
  (dev) or `pnpm deploy:prod` (prod).
- The manual `deploy` GitHub Actions workflow is prod-only and deploys what is
  on `main`. Local deploys ship the working tree, including uncommitted files
  and untracked migrations, so check `git status` first.
- Never deploy to prod, or push migrations to either database, without the
  user's explicit go-ahead.

## Critical gotchas

- Source `supabase/.env` before any `supabase` CLI command, and always use the
  explicit project ref and DB password. Do not rely on the globally logged-in
  CLI user.
- Never run `supabase login`, `supabase logout`, or `wrangler login` from
  agent workflows.
- `VITE_*` variables are public client-side values. Server-side secrets belong
  in gitignored env files such as `supabase/functions/.env.*`,
  `apps/frontend/.dev.vars`, `apps/frontend/.prod.vars`, or `.github/.env.ci`.
- Frontend builds must use an explicit Vite mode. Prefer the root scripts or
  `pnpm --filter @profiley/frontend exec vite build --mode <development|production>`.
- Edge functions run on Deno and should keep pinned `https://esm.sh/...`
  imports.

## When changing infra or secrets

- New Supabase secrets must also be added to
  `supabase/functions/.env.example` and documented in
  [`docs/concept/profiley-init-guide.md`](docs/concept/profiley-init-guide.md).
- Keep deployment instructions link-first. If a workflow is already documented
  in the init guide or README, reference it instead of duplicating it here.
