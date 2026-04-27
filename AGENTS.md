# AGENTS.md — Profiley operational instructions for AI coding agents

This file is read by AI coding assistants (Copilot, Claude, etc.) when working
in this repository. Keep it short, factual, and current.

## Supabase CLI authentication (IMPORTANT)

The operator's globally logged-in `supabase` CLI account is **different** from
the Supabase organisation that hosts the Profiley projects. Do **not** rely on
`supabase login` state. Always authenticate via the project-scoped access
token kept in `supabase/.env`.

### How to run any `supabase` command

1. Source the project env file before invoking the CLI:
   ```bash
   set -a && source supabase/.env && set +a
   ```
   This exports `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF_DEV`,
   `SUPABASE_PROJECT_REF_PROD`, `SUPABASE_DB_PASSWORD_DEV`,
   `SUPABASE_DB_PASSWORD_PROD`.
2. The CLI prefers `SUPABASE_ACCESS_TOKEN` from the environment over the
   global `~/.supabase/access-token` cache, so the operator's logged-in
   account is unaffected.
3. For project linking / db push, always pass the explicit ref:
   ```bash
   supabase link --project-ref "$SUPABASE_PROJECT_REF_DEV"
   supabase db push --password "$SUPABASE_DB_PASSWORD_DEV"
   ```
4. Never run `supabase login` or `supabase logout` from agent workflows — it
   would clobber the operator's local CLI session.
5. Never commit the contents of `supabase/.env`, `supabase/functions/.env`,
   `apps/frontend/.env.*`, `apps/frontend/.dev.vars`,
   `apps/frontend/.prod.vars`, or `.github/.env.ci`. They are gitignored.

## Where each secret/value lives

| File (gitignored) | Purpose | Example template |
|---|---|---|
| `supabase/.env` | CLI auth + project refs + DB passwords | `supabase/.env.example` |
| `supabase/functions/.env.development` | Edge function runtime secrets for the **dev** project (OpenAI, Gemini, Mistral, hCaptcha, Resend, `VISITOR_SESSION_HMAC_SECRET`, `CRON_SECRET`, …) | `supabase/functions/.env.example` |
| `supabase/functions/.env.production` | Same shape as above, populated with the **prod** project's keys | `supabase/functions/.env.example` |
| `apps/frontend/.env.development` / `.env.production` | Vite SPA build vars (`VITE_*` only — these are public) | `apps/frontend/.env.example` |
| `apps/frontend/.dev.vars` / `.prod.vars` | Cloudflare Pages Functions server-side env (used by `functions/public/[slug].ts`) | template lives at top of file |
| `.github/.env.ci` | Cloudflare API token + Cloudflare account/project ids; used by `wrangler` for manual deploys **and** mirrored to GitHub Actions repo secrets | `.github/.env.ci.example` |

## Supabase deploy workflow (manual, dev environment)

```bash
set -a && source supabase/.env && set +a

# 1. Migrations
supabase link --project-ref "$SUPABASE_PROJECT_REF_DEV"
supabase db push --password "$SUPABASE_DB_PASSWORD_DEV"

# 2. Edge function secrets (use the matching env file per project)
supabase secrets set \
  --project-ref "$SUPABASE_PROJECT_REF_DEV" \
  --env-file supabase/functions/.env.development

# 3. Edge functions (skip _shared)
for fn in supabase/functions/*/; do
  name=$(basename "$fn")
  [[ "$name" == "_shared" ]] && continue
  supabase functions deploy "$name" \
    --project-ref "$SUPABASE_PROJECT_REF_DEV" \
    --no-verify-jwt
done

# 4. Database GUCs read by pg_cron (run once via SQL editor)
#    See profiley-init-guide.md §4.
```

For production, swap every `_DEV` for `_PROD` and use
`supabase/functions/.env.production`.

## Cloudflare Pages deploy via Wrangler (no GitHub link)

`wrangler` reads `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` from the
environment. Source `.github/.env.ci` (despite the name, it's just a holder
for Cloudflare credentials) before running any wrangler command:

```bash
set -a && source .github/.env.ci && set +a

pnpm --filter @profiley/frontend build         # writes apps/frontend/dist/
pnpm --filter @profiley/frontend exec wrangler \
  pages deploy apps/frontend/dist \
  --project-name="$CLOUDFLARE_PAGES_PROJECT_DEV" \
  --branch=main
```

Never run `wrangler login` from agent workflows — it would store credentials
outside the workspace.

## Frontend / Cloudflare Pages

Local dev: `pnpm --filter @profiley/frontend dev` reads
`apps/frontend/.env.development`.

Pages Functions local preview: `pnpm --filter @profiley/frontend exec wrangler
pages dev apps/frontend/dist` reads `apps/frontend/.dev.vars`.

Production deploys are run with `wrangler` after sourcing
`.github/.env.ci` (see the section above). The same secrets, when mirrored
into GitHub repo secrets, drive `.github/workflows/deploy.yml`.

## House rules

- All Supabase changes must be in workspace files first
  (`supabase/migrations/*.sql` or `supabase/functions/<name>/index.ts`); do
  not edit via the dashboard.
- Edge functions run on Deno: import deps from `https://esm.sh/...` with a
  pinned version.
- Never put a real secret in a `VITE_*` variable — they are bundled into the
  client.
- When introducing a new function secret, also add it to
  `supabase/functions/.env.example` and document it in
  `docs/concept/profiley-init-guide.md` §6.
