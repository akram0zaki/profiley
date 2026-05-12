// Processes a single uploaded_documents row: download → extract → chunk → embed → insert.
// Invoked by pg_cron via process_pending_documents() with X-Cron-Secret.

import { handlePreflight } from "../_shared/utils/cors.ts";
import { respond, respondError, AppError } from "../_shared/utils/errors.ts";
import { getServiceClient } from "../_shared/db/serviceClient.ts";
import { parseJsonBody } from "../_shared/validation/parse.ts";
import { ProcessDocumentSchema } from "../_shared/validation/schemas.ts";
import { extractText } from "../_shared/documents/extractText.ts";
import { normalizeText } from "../_shared/documents/normalizeText.ts";
import { detectLangSimple } from "../_shared/utils/locale.ts";
import { chunkText } from "../_shared/rag/chunkText.ts";
import { embedBatch } from "../_shared/ai/capabilities/embeddings.ts";
import { loggerForRequest } from "../_shared/utils/logger.ts";
import {
  mergeSocialLinks,
  extractSocialLinks,
  SOCIAL_PLATFORMS,
  type SocialLinks,
} from "../_shared/profile/socialLinks.ts";

Deno.serve(async (req) => {
  const pf = handlePreflight(req);
  if (pf) return pf;
  const log = loggerForRequest(req, "process-document");
  try {
    if (req.method !== "POST") throw new AppError("METHOD_NOT_ALLOWED", "POST required", 405);

    const expected = Deno.env.get("CRON_SECRET");
    const provided = req.headers.get("x-cron-secret");
    if (!expected || provided !== expected) {
      throw new AppError("UNAUTHORIZED_CRON", "Invalid cron secret", 401);
    }

    const body = await parseJsonBody(req, ProcessDocumentSchema);
    const supabase = getServiceClient();

    // Load document.
    const { data: doc, error } = await supabase
      .from("uploaded_documents")
      .select("id, user_id, storage_bucket, storage_path, original_filename, mime_type, retry_count")
      .eq("id", body.documentId)
      .single();
    if (error || !doc) throw new AppError("DOCUMENT_NOT_FOUND", "Document not found", 404);

    try {
      // Download bytes.
      const { data: file, error: dlErr } = await supabase.storage
        .from(doc.storage_bucket)
        .download(doc.storage_path);
      if (dlErr || !file) throw new AppError("DOWNLOAD_FAILED", dlErr?.message ?? "Download failed", 500);
      const bytes = new Uint8Array(await file.arrayBuffer());

      // Extract.
      const raw = await extractText(bytes, doc.mime_type ?? "", doc.original_filename);
      const text = normalizeText(raw);
      if (!text || text.length < 20) {
        throw new AppError("EMPTY_EXTRACTION", "No extractable text", 422);
      }
      const language = detectLangSimple(text);

      // Persist extraction.
      await supabase.from("document_extractions").insert({
        document_id: doc.id,
        user_id: doc.user_id,
        extraction_text: text.slice(0, 200_000),
        language,
      });

      const extractedSocialLinks = extractSocialLinks(text);
      if (SOCIAL_PLATFORMS.some((platform) => extractedSocialLinks[platform])) {
        const { data: profileRow } = await supabase
          .from("profiles")
          .select("id, social_links")
          .eq("user_id", doc.user_id)
          .maybeSingle();

        if (profileRow?.id) {
          const currentSocialLinks = (profileRow.social_links ?? {}) as SocialLinks;
          const mergedSocialLinks = mergeSocialLinks(currentSocialLinks, extractedSocialLinks);
          const changed = SOCIAL_PLATFORMS.some(
            (platform) => mergedSocialLinks[platform] !== currentSocialLinks[platform],
          );

          if (changed) {
            await supabase
              .from("profiles")
              .update({ social_links: mergedSocialLinks, updated_at: new Date().toISOString() })
              .eq("id", profileRow.id);
          }
        }
      }

      // Chunk + embed in batches.
      const chunks = chunkText(text);
      if (chunks.length === 0) {
        throw new AppError("EMPTY_CHUNKS", "Chunking produced no output", 422);
      }
      const BATCH = 32;
      const inserted: number[] = [];
      for (let i = 0; i < chunks.length; i += BATCH) {
        const slice = chunks.slice(i, i + BATCH);
        const { vectors } = await embedBatch(
          "document-ingest",
          slice.map((c) => c.text),
          { userId: doc.user_id },
        );
        const rows = slice.map((c, idx) => ({
          user_id: doc.user_id,
          document_id: doc.id,
          source_kind: "cv",
          chunk_index: c.index,
          content: c.text,
          embedding: vectors[idx] as unknown,
          metadata: { public: true, source_file: doc.original_filename, language },
        }));
        const { error: insErr } = await supabase.from("knowledge_chunks").insert(rows);
        if (insErr) throw insErr;
        inserted.push(...rows.map(() => 1));
      }

      // Mark complete.
      await supabase.from("uploaded_documents").update({
        processing_status: "completed",
        extracted_text_status: "completed",
        last_error: null,
        updated_at: new Date().toISOString(),
      }).eq("id", doc.id);

      log.info("processed", {
        documentId: doc.id,
        chunks: inserted.length,
        extractedSocialPlatforms: SOCIAL_PLATFORMS.filter((platform) => extractedSocialLinks[platform]),
      });
      return respond(req, {
        documentId: doc.id,
        chunks: inserted.length,
        socialLinks: extractedSocialLinks,
      });
    } catch (procErr) {
      const retry = (doc.retry_count ?? 0) + 1;
      const status = retry >= 3 ? "failed" : "pending";
      await supabase.from("uploaded_documents").update({
        processing_status: status,
        retry_count: retry,
        last_error: (procErr as Error).message?.slice(0, 500),
        updated_at: new Date().toISOString(),
      }).eq("id", doc.id);
      throw procErr;
    }
  } catch (err) {
    log.error("failed", { error: err instanceof Error ? err.message : String(err) });
    return respondError(req, err);
  }
});
