# Internationalization & RTL Support Guide

## Overview

Profiley ships fully localized UI for English, Dutch, and Arabic, with right-to-left
(RTL) layout for Arabic. The user's language is auto-detected from
`navigator.language` on first load and remembered in `localStorage`. All
translations live in per-namespace JSON files under
`apps/frontend/src/app/i18n/locales/<lang>/<namespace>.json` and are bundled at
build time via Vite's `import.meta.glob` — there is no runtime fetch.

## Supported Languages

- **English (`en`)** — canonical / default / fallback locale
- **Dutch (`nl`)** — Nederlands
- **Arabic (`ar`)** — العربية (RTL)

Adding another language requires:

1. Add the code to `SUPPORTED_LANGUAGES` in
   [`apps/frontend/src/app/i18n/loader.ts`](../apps/frontend/src/app/i18n/loader.ts).
2. Create a new directory `apps/frontend/src/app/i18n/locales/<lang>/` with a
   JSON file for **every** namespace that exists under `locales/en/`.
3. If the script is RTL, add the code to `RTL_LANGUAGES` in `loader.ts`.

## How It Works

### Loader

[`apps/frontend/src/app/i18n/loader.ts`](../apps/frontend/src/app/i18n/loader.ts)
exposes:

- `SUPPORTED_LANGUAGES` — readonly tuple `['en', 'nl', 'ar']`
- `DEFAULT_LANGUAGE` — `'en'`
- `RTL_LANGUAGES` — `Set(['ar'])`
- `isSupportedLanguage(code)` — type guard
- `directionFor(lang): 'ltr' | 'rtl'`
- `detectLanguage(storageKey?)` — resolves `localStorage` → `navigator.languages`
  → `navigator.language` → `DEFAULT_LANGUAGE`. Safe in non-DOM contexts.
- `translate(lang, key, params?)` — performs a nested lookup, falls back to the
  English value when the target locale is missing the key, and finally returns
  the raw key when neither locale defines it. Placeholders use `{name}` syntax.

### Language Context

[`apps/frontend/src/app/contexts/language-context.tsx`](../apps/frontend/src/app/contexts/language-context.tsx)
synchronously detects the language on first render, applies
`document.documentElement.dir` and `lang`, and persists the user's choice to
`localStorage['profiley-language']`. Consumers use:

```tsx
import { useLanguage } from '../contexts/language-context';

function MyComponent() {
  const { language, setLanguage, t, dir } = useLanguage();
  return <h1>{t('dashboard.title')}</h1>;
}
```

`setLanguage` validates with `isSupportedLanguage` and silently ignores
unsupported codes.

### Translation Function

`t(key, params?)` accepts dotted keys of the form
`<namespace>.<path.to.value>`:

```tsx
t('common.save');
t('dashboard.subtitle', { name: 'Akram' });
t('uploads.list.chunksCount', { count: 12 });
```

If a placeholder is missing from `params`, the literal `{name}` is preserved so
missing data is visible in development.

## File Layout

```
apps/frontend/src/app/i18n/
├── loader.ts
└── locales/
    ├── en/
    │   ├── admin.json
    │   ├── authCallback.json
    │   ├── chat.json
    │   ├── chatPreview.json
    │   ├── common.json
    │   ├── dashboard.json
    │   ├── jobFit.json
    │   ├── knowledge.json
    │   ├── landing.json
    │   ├── layout.json
    │   ├── login.json
    │   ├── nav.json
    │   ├── onboarding.json
    │   ├── profile.json
    │   ├── publicProfile.json
    │   ├── settings.json
    │   ├── settingsAi.json
    │   ├── settingsAvatar.json
    │   └── uploads.json
    ├── nl/   (mirrors en/)
    └── ar/   (mirrors en/)
```

Each JSON file owns the namespace prefix derived from its filename, e.g.
`locales/en/dashboard.json` provides keys read as `t('dashboard.<...>')`.

## Adding New Translations

1. **Add the key to the English file first** — English is the source of truth and
   the fallback locale.

   ```jsonc
   // apps/frontend/src/app/i18n/locales/en/dashboard.json
   {
     "subtitle": "Welcome back, {name}. Here's what's happening with your AI profile.",
     "newKey": "Hello, {name}!"
   }
   ```

2. **Mirror the key in every other locale.** Missing keys silently fall back to
   English at runtime — there is no compile-time validation that locales are
   in sync.

3. **Use `t()` in the component.**

   ```tsx
   const { t } = useLanguage();
   <p>{t('dashboard.newKey', { name })}</p>
   ```

## RTL Layout

When the active language is in `RTL_LANGUAGES`, the provider sets:

- `document.documentElement.dir = 'rtl'`
- `document.documentElement.lang = '<code>'`

CSS in `apps/frontend/src/styles/rtl.css` flips margin/padding direction, text
alignment, gradient direction, dropdown positioning, and icon spacing. When
authoring new components, prefer logical properties:

```css
/* Avoid */
margin-left: 1rem;

/* Prefer */
margin-inline-start: 1rem;
```

Tailwind logical equivalents (`ms-*`, `me-*`, `ps-*`, `pe-*`, `text-start`,
`text-end`, `start-0`, `end-0`) flip automatically. For absolute positioning,
use `insetInlineStart` / `insetInlineEnd`.

## Excluded from Translation

- Person names (e.g. user's full name)
- Company / brand names (e.g. `Profiley`, `OpenAI`)
- Email addresses, URLs, file names
- Technical identifiers, slugs, model keys

## Testing

The provider, detection logic, fallback chain, interpolation, and RTL behavior
are covered by
[`apps/frontend/src/app/contexts/__tests__/language-context.test.tsx`](../apps/frontend/src/app/contexts/__tests__/language-context.test.tsx).
Run with:

```bash
pnpm --filter @profiley/frontend test
```

## Troubleshooting

### Text Not Translating

1. Confirm the dotted key exists in `locales/en/<namespace>.json`.
2. Confirm the component imports and calls `useLanguage()`.
3. `translate()` returns the raw key when no English fallback exists — that is
   the most common indicator of a typo.

### Layout Not Flipping in Arabic

1. Inspect `<html dir>` — should be `rtl`.
2. Confirm `apps/frontend/src/styles/rtl.css` is imported from `index.css`.
3. Avoid hardcoded `left:` / `right:` — use logical properties.

### Dropdown Misaligned in RTL

Use `insetInlineStart` / `insetInlineEnd` (or Tailwind `start-0` / `end-0`)
instead of `left` / `right`.

## Resources

- Loader: [`apps/frontend/src/app/i18n/loader.ts`](../apps/frontend/src/app/i18n/loader.ts)
- Context: [`apps/frontend/src/app/contexts/language-context.tsx`](../apps/frontend/src/app/contexts/language-context.tsx)
- Locales: `apps/frontend/src/app/i18n/locales/{en,nl,ar}/*.json`
- RTL CSS: `apps/frontend/src/styles/rtl.css`
- Tests: [`apps/frontend/src/app/contexts/__tests__/language-context.test.tsx`](../apps/frontend/src/app/contexts/__tests__/language-context.test.tsx)
