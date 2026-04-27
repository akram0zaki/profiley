---
description: "Use when editing Supabase migrations, Edge Functions, shared Deno utilities, validation schemas, or files under supabase. Covers CLI auth, workspace-first schema changes, Deno imports, and test expectations."
name: "Profiley Supabase"
applyTo: "supabase/**"
---

# Supabase Instructions

- Source `supabase/.env` before any `supabase` CLI command. Always pass the
  explicit `--project-ref` and matching DB password; never rely on the global
  CLI session.
- Never run `supabase login` or `supabase logout` from agent workflows.
- Database changes must land in `supabase/migrations/*.sql` first. Continue the
  existing four-digit migration prefix pattern.
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