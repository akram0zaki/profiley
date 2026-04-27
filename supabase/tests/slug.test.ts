import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { baseSlug } from "../functions/_shared/utils/slug.ts";

Deno.test("baseSlug: lowercases, hyphenates, strips diacritics", () => {
  assertEquals(baseSlug("Élodie Naïve"), "elodie-naive");
  assertEquals(baseSlug("Jane DOE"), "jane-doe");
});

Deno.test("baseSlug: collapses runs of non-alphanumerics + trims edge hyphens", () => {
  assertEquals(baseSlug("  --John!! @ Doe? --"), "john-doe");
});

Deno.test("baseSlug: returns 'user' for empty / non-latin-only input", () => {
  assertEquals(baseSlug(""), "user");
  assertEquals(baseSlug("    "), "user");
  // Arabic-only string has no a-z0-9 chars after the regex.
  assertEquals(baseSlug("مرحبا"), "user");
});

Deno.test("baseSlug: caps at 40 characters", () => {
  const long = "a".repeat(60);
  const out = baseSlug(long);
  assertEquals(out.length, 40);
});
