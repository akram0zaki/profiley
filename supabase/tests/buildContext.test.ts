import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { buildContext } from "../functions/_shared/rag/buildContext.ts";
import type { RetrievedChunk } from "../functions/_shared/rag/retrieveKnowledge.ts";

function chunk(id: string, text: string, similarity = 0.9): RetrievedChunk {
  return {
    chunkId: id,
    documentId: "doc-" + id,
    chunkText: text,
    similarity,
    metadata: {},
  };
}

Deno.test("buildContext: numbers chunks and returns matching citations", () => {
  const out = buildContext([chunk("a", "first"), chunk("b", "second", 0.7)]);
  assert(out.text.includes("[#1] first"));
  assert(out.text.includes("[#2] second"));
  assertEquals(out.citations.length, 2);
  assertEquals(out.citations[0].chunkId, "a");
  assertEquals(out.citations[1].similarity, 0.7);
});

Deno.test("buildContext: stops at maxChars and truncates citations accordingly", () => {
  const big = "x".repeat(200);
  const chunks = Array.from({ length: 10 }, (_, i) => chunk(String(i), big));
  const out = buildContext(chunks, { maxChars: 700 });
  // Each rendered block is ~209 chars (`[#N] ` + 200 + spacer). Cap of 700 ⇒ 3 chunks.
  assert(out.citations.length >= 2 && out.citations.length <= 4);
  assert(out.text.length <= 700);
});

Deno.test("buildContext: empty input → empty text + empty citations", () => {
  const out = buildContext([]);
  assertEquals(out.text, "");
  assertEquals(out.citations, []);
});

Deno.test("buildContext: default budget fits a full top-K of large chunks", () => {
  // Mirror the worst case from chunkText.ts: ~3200 char chunks, top-K = 8.
  const big = "x".repeat(3200);
  const chunks = Array.from({ length: 8 }, (_, i) => chunk(String(i), big));
  const out = buildContext(chunks);
  assertEquals(out.citations.length, 8);
  assert(out.text.includes("[#8] "));
});
