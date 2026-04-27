// Soft-deletes a user's document: removes storage object, soft-deletes chunks,
// and deletes the uploaded_documents row. Cascade on document_extractions.

import { handlePreflight } from "../_shared/utils/cors.ts";
import { respond, respondError, AppError } from "../_shared/utils/errors.ts";
import { requireUser } from "../_shared/auth/requireUser.ts";
import { getServiceClient } from "../_shared/db/serviceClient.ts";
import { z } from "../_shared/validation/schemas.ts";
import { parseJsonBody } from "../_shared/validation/parse.ts";

const Body = z.object({ documentId: z.string().uuid() });

Deno.serve(async (req) => {
  const pf = handlePreflight(req);
  if (pf) return pf;
  try {
    if (req.method !== "POST") throw new AppError("METHOD_NOT_ALLOWED", "POST required", 405);
    const user = await requireUser(req);
    const body = await parseJsonBody(req, Body);
    const supabase = getServiceClient();

    const { data: doc, error: gErr } = await supabase
      .from("uploaded_documents")
      .select("id, user_id, storage_bucket, storage_path")
      .eq("id", body.documentId)
      .single();
    if (gErr || !doc) throw new AppError("NOT_FOUND", "Document not found", 404);
    if (doc.user_id !== user.id) throw new AppError("FORBIDDEN", "Not your document", 403);

    // Soft-delete chunks (preserves audit trail).
    await supabase.from("knowledge_chunks")
      .update({ deleted_at: new Date().toISOString() })
      .eq("document_id", doc.id);

    // Remove storage object.
    await supabase.storage.from(doc.storage_bucket).remove([doc.storage_path]);

    // Delete row (cascades to document_extractions and hard-deletes chunks via FK).
    // To preserve soft-delete semantics on chunks, detach FK first by nulling document_id.
    await supabase.from("knowledge_chunks").update({ document_id: null }).eq("document_id", doc.id);
    await supabase.from("uploaded_documents").delete().eq("id", doc.id);

    return respond(req, { ok: true });
  } catch (err) {
    return respondError(req, err);
  }
});
