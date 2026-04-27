// Document text extraction (PDF / DOCX / TXT / MD).

import * as mammoth from "https://esm.sh/mammoth@1.8.0?bundle";
import { extractText as unpdfExtractText, getDocumentProxy } from "https://esm.sh/unpdf@0.12.1";

export async function extractText(
  data: Uint8Array,
  mimeType: string,
  filename?: string,
): Promise<string> {
  const lower = (filename ?? "").toLowerCase();
  const isPdf = mimeType === "application/pdf" || lower.endsWith(".pdf");
  const isDocx = mimeType.includes("officedocument.wordprocessingml") || lower.endsWith(".docx");
  const isText = mimeType.startsWith("text/") || lower.endsWith(".txt") || lower.endsWith(".md");

  if (isPdf) {
    const pdf = await getDocumentProxy(data);
    const out = await unpdfExtractText(pdf, { mergePages: true });
    return Array.isArray(out.text) ? out.text.join("\n") : out.text ?? "";
  }
  if (isDocx) {
    // mammoth in Deno requires a Buffer-like input; ArrayBuffer works in browser build.
    const buf = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
    const result = await (mammoth as any).extractRawText({ arrayBuffer: buf });
    return result.value ?? "";
  }
  if (isText) {
    return new TextDecoder("utf-8", { fatal: false }).decode(data);
  }
  throw new Error(`Unsupported document type: ${mimeType}`);
}
