/**
 * i18n runtime loader.
 *
 * Loads every JSON namespace file under `./locales/<lang>/<namespace>.json`
 * eagerly at build time (via Vite's `import.meta.glob`) and merges them into a
 * nested dictionary keyed by language. Each namespace file owns the prefix
 * matching its filename, so `locales/en/dashboard.json` provides keys read as
 * `t('dashboard.<...>')`.
 *
 * Public API:
 *   - SUPPORTED_LANGUAGES        — readonly tuple of supported language codes
 *   - DEFAULT_LANGUAGE           — fallback language ("en")
 *   - isSupportedLanguage(code)  — type guard
 *   - detectLanguage()           — picks navigator.language → match → fallback
 *   - translate(lang, key, params?)
 *
 * Translations fall back to the English value when missing in a target locale,
 * and ultimately to the raw key when missing in English too. Placeholders use
 * the `{name}` syntax and are replaced with String(params[name]).
 */

export const SUPPORTED_LANGUAGES = ['en', 'nl', 'ar'] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];
export const DEFAULT_LANGUAGE: Language = 'en';
export const RTL_LANGUAGES: ReadonlySet<Language> = new Set<Language>(['ar']);

export function isSupportedLanguage(code: unknown): code is Language {
  return typeof code === 'string' && (SUPPORTED_LANGUAGES as readonly string[]).includes(code);
}

export function directionFor(lang: Language): 'ltr' | 'rtl' {
  return RTL_LANGUAGES.has(lang) ? 'rtl' : 'ltr';
}

type NestedDict = { [key: string]: string | NestedDict };
type LangDict = Record<string, NestedDict>;

// Vite eagerly inlines every locale JSON file at build time.
const modules = import.meta.glob<NestedDict>('./locales/*/*.json', {
  eager: true,
  import: 'default',
});

const dictionaries: Record<Language, LangDict> = {
  en: {},
  nl: {},
  ar: {},
};

for (const [path, content] of Object.entries(modules)) {
  // Path shape: "./locales/<lang>/<namespace>.json"
  const match = /\.\/locales\/([^/]+)\/([^/]+)\.json$/.exec(path);
  if (!match) continue;
  const [, lang, namespace] = match;
  if (!isSupportedLanguage(lang)) continue;
  dictionaries[lang][namespace] = content as NestedDict;
}

function lookup(dict: LangDict, key: string): string | undefined {
  const segments = key.split('.');
  if (segments.length < 2) return undefined;
  const [namespace, ...rest] = segments;
  let node: string | NestedDict | undefined = dict[namespace];
  for (const segment of rest) {
    if (node === undefined || typeof node === 'string') return undefined;
    node = (node as NestedDict)[segment];
  }
  return typeof node === 'string' ? node : undefined;
}

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, name) =>
    Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : `{${name}}`,
  );
}

export function translate(
  lang: Language,
  key: string,
  params?: Record<string, string | number>,
): string {
  const primary = lookup(dictionaries[lang], key);
  if (primary !== undefined) return interpolate(primary, params);
  if (lang !== DEFAULT_LANGUAGE) {
    const fallback = lookup(dictionaries[DEFAULT_LANGUAGE], key);
    if (fallback !== undefined) return interpolate(fallback, params);
  }
  return key;
}

function lookupArray(dict: LangDict, key: string): string[] | undefined {
  const segments = key.split('.');
  if (segments.length < 2) return undefined;
  const [namespace, ...rest] = segments;
  let node: unknown = dict[namespace];
  for (const segment of rest) {
    if (node === null || typeof node !== 'object' || Array.isArray(node)) return undefined;
    node = (node as Record<string, unknown>)[segment];
  }
  if (Array.isArray(node) && node.every((v) => typeof v === 'string')) return node as string[];
  return undefined;
}

/**
 * Resolves a translation key to an array of strings, falling back to English
 * when missing. Returns an empty array if the key is missing in both locales.
 * Use for bulleted lists where the order is meaningful.
 */
export function translateList(
  lang: Language,
  key: string,
  params?: Record<string, string | number>,
): string[] {
  const primary = lookupArray(dictionaries[lang], key);
  if (primary !== undefined) return primary.map((v) => interpolate(v, params));
  if (lang !== DEFAULT_LANGUAGE) {
    const fallback = lookupArray(dictionaries[DEFAULT_LANGUAGE], key);
    if (fallback !== undefined) return fallback.map((v) => interpolate(v, params));
  }
  return [];
}

/**
 * Best-effort language detection. Resolution order:
 *   1. `localStorage['profiley-language']` if it names a supported locale.
 *   2. `navigator.languages` / `navigator.language`, matching by base subtag.
 *   3. DEFAULT_LANGUAGE.
 *
 * Safe to call from SSR / non-DOM contexts (returns DEFAULT_LANGUAGE).
 */
export function detectLanguage(storageKey = 'profiley-language'): Language {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;
  try {
    const stored = window.localStorage?.getItem(storageKey);
    if (isSupportedLanguage(stored)) return stored;
  } catch {
    // localStorage may throw in privacy modes; fall through to navigator.
  }
  const nav = typeof navigator !== 'undefined' ? navigator : undefined;
  const candidates: string[] = [];
  if (nav?.languages?.length) candidates.push(...nav.languages);
  if (nav?.language) candidates.push(nav.language);
  for (const raw of candidates) {
    const base = raw.toLowerCase().split(/[-_]/)[0];
    if (isSupportedLanguage(base)) return base;
  }
  return DEFAULT_LANGUAGE;
}

/** Exposed for tests. Returns the loaded namespace count for a language. */
export function _debugNamespaceCount(lang: Language): number {
  return Object.keys(dictionaries[lang] ?? {}).length;
}
