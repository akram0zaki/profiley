import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { normalizeText } from "../functions/_shared/documents/normalizeText.ts";

Deno.test("normalizeText: strips NULs, normalises whitespace and newlines", () => {
  const dirty = "Hello\u0000  world\r\nfoo\t\u00A0bar\n\n\n\nbaz";
  assertEquals(normalizeText(dirty), "Hello world\nfoo bar\n\nbaz");
});

Deno.test("normalizeText: trims surrounding whitespace", () => {
  assertEquals(normalizeText("   hi   "), "hi");
});

Deno.test("normalizeText: leaves single newlines intact", () => {
  assertEquals(normalizeText("a\nb\nc"), "a\nb\nc");
});
