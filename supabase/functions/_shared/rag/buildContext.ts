import { RetrievedChunk } from "./retrieveKnowledge.ts";

export type ContextBlock = {
  text: string;
  citations: Array<{ chunkId: string; documentId: string | null; similarity: number }>;
};

export function buildContext(
  chunks: RetrievedChunk[],
  opts: { maxChars?: number } = {},
): ContextBlock {
  // Chunks are produced at ~3200 chars each (see chunkText.ts), and retrieval
  // returns up to ~8 of them. The default budget must be large enough to fit
  // most of the top-K, otherwise the model only sees 1–2 chunks and answers
  // "I don't have that information" even when later chunks contain the fact.
  const max = opts.maxChars ?? 28000;
  const out: string[] = [];
  const citations: ContextBlock["citations"] = [];
  let used = 0;
  for (const c of chunks) {
    const block = `[#${citations.length + 1}] ${c.chunkText.trim()}`;
    if (used + block.length > max) break;
    out.push(block);
    citations.push({
      chunkId: c.chunkId,
      documentId: c.documentId,
      similarity: c.similarity,
    });
    used += block.length + 2;
  }
  return { text: out.join("\n\n"), citations };
}
