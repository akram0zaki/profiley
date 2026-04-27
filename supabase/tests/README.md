# Profiley edge function tests

These are pure-Deno unit tests for the shared utilities under
`supabase/functions/_shared/`. They do not require a running Supabase project,
and they never touch the network.

Run from the `supabase/` directory:

```bash
deno task test
# or
deno test --allow-env --allow-net --allow-read tests/
```

Notes:

- `--allow-net` is needed only because `validation/schemas.ts` imports `zod`
  from `https://esm.sh/...` (Deno fetches the module on first run and caches
  it). No tests make real network calls.
- The directory is intentionally a **sibling** of `functions/`, not a
  child, because Supabase deploys every top-level dir under `functions/`
  except `_shared`.
