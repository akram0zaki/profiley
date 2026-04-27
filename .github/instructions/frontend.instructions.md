---
description: "Use when editing the React SPA, Vite config, Vitest tests, frontend routes, Cloudflare Pages functions, or other files under apps/frontend. Covers build modes, test patterns, env rules, and frontend-specific gotchas."
name: "Profiley Frontend"
applyTo: "apps/frontend/**"
---

# Frontend Instructions

- Primary package: `@profiley/frontend` in `apps/frontend/`.
- Prefer repo-root commands so the workspace scripts keep the correct Vite
  mode: `pnpm dev`, `pnpm test:frontend`, `pnpm build`, `pnpm build:prod`.
- For focused frontend checks, use
  `pnpm --filter @profiley/frontend exec vitest run <path>`.
- Keep `apps/frontend/vite.config.ts` and `apps/frontend/vitest.config.ts`
  aligned on the React plugin and the `@` alias. Vitest intentionally mirrors
  only the pieces required for imports and jsdom-based tests.
- Do not remove the Tailwind or React plugins from the Vite config. The
  project depends on both even when a change does not obviously touch styling.
- Treat every `VITE_*` variable as public. Server-only values for Pages
  Functions belong in `apps/frontend/.dev.vars` or `apps/frontend/.prod.vars`.
- Follow [`docs/testing.md`](../../docs/testing.md) for test placement and
  mocking conventions, [`docs/DESIGN_SYSTEM.md`](../../docs/DESIGN_SYSTEM.md)
  for UI rules, and [`docs/I18N_RTL_GUIDE.md`](../../docs/I18N_RTL_GUIDE.md)
  for locale or RTL work.