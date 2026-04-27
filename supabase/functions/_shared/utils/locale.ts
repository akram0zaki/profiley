// Browser-locale → BCP-47 helpers.

export function pickLanguage(
  preferred: string | null | undefined,
  browser: string | null | undefined,
  fallback = "en",
): string {
  const candidate = (preferred || browser || fallback).split("-")[0];
  return candidate.toLowerCase();
}

export function detectLangSimple(text: string): string {
  // Cheap heuristic: Arabic script range.
  if (/[\u0600-\u06FF]/.test(text)) return "ar";
  // Dutch common particles vs English.
  const lower = text.toLowerCase();
  if (/\b(de|het|een|en|ik|niet)\b/.test(lower) && !/\b(the|and|a|i|not)\b/.test(lower)) return "nl";
  return "en";
}
