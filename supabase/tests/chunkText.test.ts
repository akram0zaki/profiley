import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { chunkText } from "../functions/_shared/rag/chunkText.ts";

Deno.test("chunkText: empty input → no chunks", () => {
  assertEquals(chunkText(""), []);
  assertEquals(chunkText("    "), []);
});

Deno.test("chunkText: short text yields a single chunk with full text", () => {
  const input = "Hello world. This is a short paragraph.";
  const out = chunkText(input);
  assertEquals(out.length, 1);
  assert(out[0].text.includes("Hello world"));
  assertEquals(out[0].index, 0);
  assertEquals(out[0].charStart, 0);
  assert(out[0].charEnd > 0);
});

Deno.test("chunkText: long input splits into multiple chunks with overlap", () => {
  const sentence = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. ";
  const input = sentence.repeat(200); // ≈ 11k chars → 4+ chunks
  const chunks = chunkText(input);
  assert(chunks.length >= 3, `expected at least 3 chunks, got ${chunks.length}`);
  // Each chunk under ~3600 chars (target + one extra sentence overshoot).
  for (const c of chunks) {
    assert(c.text.length <= 3600, `chunk too long: ${c.text.length}`);
  }
  // Indices are monotonic.
  for (let i = 1; i < chunks.length; i++) {
    assertEquals(chunks[i].index, i);
  }
  // Overlap: end of chunk N appears at start of chunk N+1 for at least some chars.
  for (let i = 0; i < chunks.length - 1; i++) {
    const tail = chunks[i].text.slice(-50);
    const head = chunks[i + 1].text.slice(0, 200);
    assert(head.includes(tail.slice(-20)), `expected overlap between chunk ${i} and ${i + 1}`);
  }
});

Deno.test("chunkText: respects sentence boundaries (no mid-sentence cuts)", () => {
  const sentences = Array.from({ length: 80 }, (_, i) => `Sentence number ${i} ends here.`)
    .join(" ");
  const chunks = chunkText(sentences);
  for (const c of chunks) {
    // Every chunk should end with a sentence terminator (or be the last).
    assert(
      /[.!?]\s*$/.test(c.text.trim()),
      `chunk did not end on sentence boundary: ...${c.text.slice(-40)}`,
    );
  }
});
