---
description: "Use when editing Supabase migrations, Edge Functions, shared Deno utilities, validation schemas, or files under supabase. Covers CLI auth, workspace-first schema changes, Deno imports, and test expectations."
name: "Profiley Supabase"
applyTo: "supabase/**"
---

# Supabase Instructions

- Source `supabase/.env` before any `supabase` CLI command. The repo targets
  Supabase CLI v3 (CI pins 3.4.0). Always pass the explicit
  `--remote="$SUPABASE_PROJECT_REF_<ENV>"` and matching DB password; never rely
  on the global CLI session or the linked project. In v3, `db` commands
  without `--remote` target the local stack.
- Never run `supabase login` or `supabase logout` from agent workflows.
- Database changes must land in `supabase/migrations/*.sql` first. Continue the
  existing four-digit migration prefix pattern. **All remote DB writes — schema
  or data — go through a workspace migration applied via `supabase db push`.
  Never run ad-hoc `UPDATE` / `INSERT` / `ALTER` against the remote DB via
  `psql` or any other client.**
- Track migrations in `supabase/trackers/supabase-changes_yyyyMMdd.md`
- Read-only diagnostics against the remote DB ARE allowed (and encouraged) via
  `psql` using the session pooler:
  - Source `supabase/.env`, then connect with
    `PGPASSWORD="$SUPABASE_DB_PASSWORD_DEV" psql "host=aws-1-eu-west-1.pooler.supabase.com port=6543 user=postgres.$SUPABASE_PROJECT_REF_DEV dbname=postgres sslmode=require"`
    (port `5432` for session-mode; port `6543` for transaction-mode reads).
  - The direct `db.<ref>.supabase.co:5432` host is IPv6-only in this network
    and will fail with "No route to host"; use the pooler host instead.
- Apply migrations to the dev project with
  `supabase db push --remote="$SUPABASE_PROJECT_REF_DEV" --password "$SUPABASE_DB_PASSWORD_DEV"`.
  Run it with `--dry-run` first. `--yes` skips the confirmation prompt (needed
  in CI); `--db-url` / `--project-ref` are deprecated in v3.
- Deploy edge functions via
  `supabase functions deploy <name…> --remote="$SUPABASE_PROJECT_REF_DEV"`.
  For functions invoked by `pg_cron`/`pg_net` (e.g. `process-document`) pass
  `--no-verify-jwt` so the gateway lets the X-Cron-Secret-authenticated call
  through; don't rely on `[functions.<name>]` in `supabase/config.toml` for this.
- Keep Edge Function entrypoints thin and move reusable logic into
  `supabase/functions/_shared/` so it can be tested in `supabase/tests/`.
- Edge Functions run on Deno. Pin `https://esm.sh/...` imports and stay
  compatible with the shared helpers for CORS, validation, logging, locale,
  RAG, and provider access.
- Run `pnpm test:edge` after relevant changes. For narrower checks, use
  `cd supabase && deno test --allow-env --allow-net --allow-read tests/`.
- When adding function secrets, update `supabase/functions/.env.example` and
  [`docs/concept/profiley-init-guide.md`](../../docs/concept/profiley-init-guide.md).
- Use [`docs/testing.md`](../../docs/testing.md) for edge test patterns and
  [`README.md`](../../README.md) or
  [`docs/concept/profiley-init-guide.md`](../../docs/concept/profiley-init-guide.md)
  for deploy flow details instead of restating them here.