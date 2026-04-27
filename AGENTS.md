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

- [`README.md`](README.md): product overview, repo layout, root scripts.
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
