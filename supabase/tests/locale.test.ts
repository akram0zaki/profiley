import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { detectLangSimple, pickLanguage } from "../functions/_shared/utils/locale.ts";

Deno.test("pickLanguage: prefers explicit preferred over browser", () => {
  assertEquals(pickLanguage("nl", "en-US"), "nl");
  assertEquals(pickLanguage(null, "ar-EG"), "ar");
  assertEquals(pickLanguage(undefined, undefined), "en");
  assertEquals(pickLanguage("FR-CA", null), "fr");
});

Deno.test("pickLanguage: respects custom fallback", () => {
  assertEquals(pickLanguage(null, null, "ar"), "ar");
});

Deno.test("detectLangSimple: Arabic script wins", () => {
  assertEquals(detectLangSimple("مرحبا بالعالم"), "ar");
});

Deno.test("detectLangSimple: Dutch heuristic vs English", () => {
  assertEquals(detectLangSimple("Ik ben niet hier"), "nl");
  assertEquals(detectLangSimple("Hello, the world is round"), "en");
  // Mixed input with both English and Dutch markers stays English (English wins).
  assertEquals(detectLangSimple("the niet"), "en");
});
