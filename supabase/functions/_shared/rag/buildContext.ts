import { RetrievedChunk } from "./retrieveKnowledge.ts";

export type ContextBlock = {
  text: string;
  citations: Array<{ chunkId: string; documentId: string | null; similarity: number }>;
};

export function buildContext(
  chunks: RetrievedChunk[],
  opts: { maxChars?: number } = {},
): ContextBlock {
  const max = opts.maxChars ?? 6000;
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
