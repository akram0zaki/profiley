// Sentence-aware text chunker (~700-1000 tokens with ~100-token overlap).
// Token estimate: 4 chars/token average for mixed-language text.

const TARGET_CHARS = 3200; // ~800 tokens
const OVERLAP_CHARS = 400; // ~100 tokens

export type Chunk = {
  index: number;
  text: string;
  charStart: number;
  charEnd: number;
};

function splitSentences(text: string): string[] {
  // Conservative: split on punctuation followed by whitespace, keep punctuation.
  return text
    .replace(/\r\n/g, "\n")
    .split(/(?<=[\.\!\?\؟\。])\s+/u)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function chunkText(input: string): Chunk[] {
  const sentences = splitSentences(input);
  if (sentences.length === 0) return [];

  const chunks: Chunk[] = [];
  let buf = "";
  let bufStart = 0;
  let cursor = 0;
  let index = 0;

  for (const s of sentences) {
    const sentenceWithSpace = (buf ? " " : "") + s;
    if (buf.length + sentenceWithSpace.length > TARGET_CHARS && buf.length > 0) {
      chunks.push({
        index: index++,
        text: buf,
        charStart: bufStart,
        charEnd: bufStart + buf.length,
      });
      // Start next buffer with overlap from end of previous buffer.
      const overlapStart = Math.max(0, buf.length - OVERLAP_CHARS);
      buf = buf.slice(overlapStart);
      bufStart = bufStart + overlapStart;
    }
    buf += sentenceWithSpace;
    cursor += sentenceWithSpace.length;
  }
  if (buf.trim().length > 0) {
    chunks.push({
      index: index++,
      text: buf,
      charStart: bufStart,
      charEnd: bufStart + buf.length,
    });
  }
  return chunks;
}
