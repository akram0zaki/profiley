import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  computeNextProfileAnswerVersion,
  defaultProfileAnswerStaleAfter,
} from "../functions/_shared/profileAnswers/saveProfileAnswer.ts";

Deno.test("computeNextProfileAnswerVersion increments existing versions unless overridden", () => {
  assertEquals(computeNextProfileAnswerVersion(null), 1);
  assertEquals(computeNextProfileAnswerVersion(1), 2);
  assertEquals(computeNextProfileAnswerVersion(4, 7), 7);
});

Deno.test("defaultProfileAnswerStaleAfter sets a future freshness boundary", () => {
  assertEquals(defaultProfileAnswerStaleAfter("2026-05-13T00:00:00.000Z"), "2027-05-13T00:00:00.000Z");
});