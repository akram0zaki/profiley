# Testing strategy

This guide describes how Profiley is tested today, what each suite covers, and
how to run, extend, and (eventually) wire the suites into CI.

The codebase has two independent runtimes — a Vite + React SPA and a set of
Deno edge functions — so we keep two matching test stacks instead of trying to
shoehorn both into a single runner.

## TL;DR — running tests

From the repository root:

```bash
pnpm install                # one-time

pnpm test                   # frontend + edge, sequentially
pnpm test:frontend          # Vitest (React SPA) – runs once
pnpm test:frontend:watch    # Vitest in watch mode
pnpm test:frontend:coverage # Vitest + V8 coverage report
pnpm test:edge              # Deno tests for shared edge utilities
pnpm test:edge:watch        # Deno test watcher
```

`pnpm test` is non-zero-exiting: a failing frontend or edge suite fails the
whole command.

## What is — and isn't — covered

### Covered today

| Layer | Tool | Location | What it asserts |
|---|---|---|---|
| Frontend `lib/` | Vitest + jsdom | [apps/frontend/src/lib/__tests__](apps/frontend/src/lib/__tests__) | `callFn` request shaping, auth-header logic, error envelopes, `ApiError` semantics, `visitorSessionId` persistence, `avatarPublicUrl`, sign-in helper delegation |
| Frontend UI primitives | Vitest + jsdom | [apps/frontend/src/app/components/ui/__tests__](apps/frontend/src/app/components/ui/__tests__) | `cn()` tailwind-merge precedence and conditional class handling |
| Frontend i18n context | Vitest + React Testing Library | [apps/frontend/src/app/contexts/__tests__](apps/frontend/src/app/contexts/__tests__) | Default language, RTL/LTR direction, key fallback, locale switching, persistence, provider-required hook error |
| Edge `_shared/utils` | Deno test | [supabase/tests/cors.test.ts](supabase/tests/cors.test.ts), [supabase/tests/errors.test.ts](supabase/tests/errors.test.ts), [supabase/tests/locale.test.ts](supabase/tests/locale.test.ts), [supabase/tests/rateLimit.test.ts](supabase/tests/rateLimit.test.ts), [supabase/tests/slug.test.ts](supabase/tests/slug.test.ts) | Allowed-origin matching (incl. wildcards), preflight handling, success/error envelope shape, language pick + heuristic detection, visitor session header validation, deterministic IP HMAC, slug normalisation |
| Edge `_shared/validation` | Deno test | [supabase/tests/validation.test.ts](supabase/tests/validation.test.ts) | Zod schemas for `initialize-user-profile`, `update-user-locale`, `complete-onboarding`, `publish-profile`, `create-upload-url`, `finalize-upload`, `chat-persona`, `analyze-job-fit`, `get-public-profile`, `track-recruiter-event`, `submit-recruiter-contact`, `admin-set-feature-model`, `admin-create-model` |
| Edge `_shared/rag` | Deno test | [supabase/tests/chunkText.test.ts](supabase/tests/chunkText.test.ts), [supabase/tests/buildContext.test.ts](supabase/tests/buildContext.test.ts) | Sentence-aware chunking with overlap + boundary preservation, citation-aware context assembly with byte budgets |
| Edge `_shared/documents` | Deno test | [supabase/tests/normalizeText.test.ts](supabase/tests/normalizeText.test.ts) | NUL stripping, whitespace collapse, newline normalisation |
| Edge `_shared/prompts` | Deno test | [supabase/tests/prompts.test.ts](supabase/tests/prompts.test.ts) | Persona system prompt language map and owner-mode toggle, delimited user-message wrappers, job-fit JSON schema contract |

### Not covered yet (deliberate)

These layers are deferred until the rest of the platform stabilises; see the
README's "Still not implemented" section.

- **Edge function HTTP entrypoints** (`supabase/functions/<name>/index.ts`).
  Each one wires `Deno.serve` to the service-role Supabase client and external
  AI providers. Testing them in isolation requires a Supabase service mock or
  a live local stack (`supabase start`). The pure logic they orchestrate is
  already covered through `_shared/`.
- **AI provider adapters** (`_shared/ai/providers/*`). These are thin
  fetch-based shims. Unit-testing them adds noise; we instead validate them
  through `admin-provider-health` runs against staging.
- **React pages** (`src/app/pages/*`). Mostly compose Supabase queries,
  TanStack-style data hooks, and shadcn primitives; covering them without an
  e2e harness produces brittle tests. We plan to add Playwright for the high-
  value flows (login → onboarding → upload → publish → public chat).
- **Postgres migrations + RLS**. Targeted for pgTAP once a fixture seeder
  exists.
- **Load / soak**. Targeted for k6 once SLOs are formalised.

The `package.json` exposes `test:frontend:coverage` so you can spot regressions
in coverage as the suites grow.

## Frontend suite (Vitest + jsdom)

### Stack

- `vitest@2`
- `jsdom@25` for the DOM
- `@testing-library/react@16` + `@testing-library/jest-dom`
- V8 coverage via `@vitest/coverage-v8`

Configuration lives in [apps/frontend/vitest.config.ts](apps/frontend/vitest.config.ts).
The setup file at [apps/frontend/test/setup.ts](apps/frontend/test/setup.ts):

- installs an in-memory polyfill for `localStorage`. Node 22+ ships an
  experimental `localStorage` global that **overrides** the one jsdom would
  expose, leaving the prototype methods (`clear`, `getItem`) undefined; the
  polyfill restores a spec-compliant Storage implementation between tests.
- seeds default `import.meta.env.VITE_*` values so source modules can read
  them safely during import — these are also redundantly provided via
  Vitest's `test.env` block in the config.
- patches `crypto.randomUUID` in case the active jsdom build doesn't ship it.

### Conventions

- Place tests next to the code they cover, under a `__tests__` directory.
  Filename suffix: `*.test.ts` or `*.test.tsx`.
- Mock `lib/supabase` per test file with `vi.mock`. Use `vi.hoisted` when the
  factory needs to reference helper variables (Vitest hoists `vi.mock` above
  imports, so plain top-level `const` references will throw
  `ReferenceError: Cannot access X before initialization`).
- Don't import `lib/api` and `lib/auth` at module top in tests that mock
  their dependencies — make sure the mock is registered first.
- Reset module state with `vi.resetModules()` + dynamic `import()` for tests
  that depend on first-load behaviour (e.g. cached visitor session id).

### Adding a new test

```ts
// src/lib/__tests__/example.test.ts
import { describe, expect, it, vi } from 'vitest';

vi.mock('../supabase', () => ({ supabase: { /* ... */ } }));

import { somethingPure } from '../example';

describe('somethingPure', () => {
  it('does the thing', () => {
    expect(somethingPure(1)).toBe(2);
  });
});
```

## Edge function suite (Deno test)

### Stack

- Stdlib `https://deno.land/std@0.224.0/assert/mod.ts`
- The same `https://esm.sh/zod@3.23.8` import the production schemas use

The runner's home is [supabase/tests/](supabase/tests/) (intentionally a
**sibling** of `supabase/functions/`, not a child of it — the deploy script in
[AGENTS.md](AGENTS.md) iterates `supabase/functions/*/` and would otherwise
attempt to deploy a `tests/` directory as an edge function). A
[supabase/deno.jsonc](supabase/deno.jsonc) defines the `deno task test` alias
used by the root `pnpm test:edge` script.

### Permissions

Run with `--allow-env --allow-net --allow-read`:

- `--allow-env`: tests probe `ALLOWED_ORIGINS` and
  `VISITOR_SESSION_HMAC_SECRET` to verify env-driven behaviour.
- `--allow-net`: required only because `validation/schemas.ts` imports `zod`
  from `https://esm.sh/...`. Deno fetches the module once and caches it; no
  test makes a real network call.
- `--allow-read`: needed for Deno's TS resolver and the local module graph.

### Conventions

- Test files mirror the module they cover: `slug.ts` → `slug.test.ts`.
- Tests must stay **pure**. Anything that depends on `getServiceClient()` or
  the live Supabase project belongs in an integration suite (not yet built).
- When a function transitively imports a service-client module but you only
  want to test pure logic, refactor the pure piece into an exported helper
  (we did this for `baseSlug` in `_shared/utils/slug.ts`).
- Fix bugs the suite reveals — e.g. the invalid Unicode-mode regex escape
  in `_shared/rag/chunkText.ts` was caught and corrected as part of writing
  these tests.

### Adding a new test

```ts
// supabase/tests/example.test.ts
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { example } from "../functions/_shared/utils/example.ts";

Deno.test("example: does the thing", () => {
  assertEquals(example(1), 2);
});
```

## Roadmap

In rough priority order:

1. **Edge integration tests** — boot `supabase start` in CI, run a dedicated
   schema, and exercise each edge function against the local Postgres.
   Likely tool: Deno's built-in fetch + a per-suite seed script.
2. **Frontend e2e** — Playwright covering the recruiter golden path:
   public profile → recruiter chat → job-fit analysis → recruiter contact.
3. **Postgres pgTAP** — assert RLS for app_users / profiles / preferences /
   knowledge_chunks plus the `match_knowledge_chunks` and
   `rate_limit_increment` RPCs.
4. **Provider contract tests** — record-and-replay (e.g. Polly-style) for
   the OpenAI / Gemini / Mistral adapters.
5. **k6 smoke** — `chat-persona` and `analyze-job-fit` rate-limit and
   latency budgets.

## CI hint

Until a workflow is wired up, this is the minimal sequence a CI job should
run from the repo root:

```bash
pnpm install --frozen-lockfile
pnpm test:frontend
pnpm test:edge
```

Both commands are deterministic, deps-free at runtime (apart from the cached
`zod` import), and each completes in well under a minute on a fresh runner.
