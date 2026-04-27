// Records an uploaded_documents row after the client successfully uploaded to storage.

import { handlePreflight } from "../_shared/utils/cors.ts";
import { respond, respondError, AppError } from "../_shared/utils/errors.ts";
import { requireUser } from "../_shared/auth/requireUser.ts";
import { getServiceClient } from "../_shared/db/serviceClient.ts";
import { parseJsonBody } from "../_shared/validation/parse.ts";
import { FinalizeUploadSchema } from "../_shared/validation/schemas.ts";

Deno.serve(async (req) => {
  const pf = handlePreflight(req);
  if (pf) return pf;
  try {
    if (req.method !== "POST") throw new AppError("METHOD_NOT_ALLOWED", "POST required", 405);
    const user = await requireUser(req);
    const body = await parseJsonBody(req, FinalizeUploadSchema);

    // Path must be inside the user's namespace.
    if (!body.path.startsWith(`${user.id}/`)) {
      throw new AppError("FORBIDDEN_PATH", "Upload path outside user namespace", 403);
    }

    const supabase = getServiceClient();
    const { data, error } = await supabase.from("uploaded_documents").insert({
      user_id: user.id,
      storage_bucket: body.bucket,
      storage_path: body.path,
      original_filename: body.originalFilename,
      mime_type: body.mimeType,
      file_size: body.fileSize,
      checksum_sha256: body.checksumSha256,
      processing_status: "pending",
      extracted_text_status: "pending",
    }).select("id").single();
    if (error) throw error;
    return respond(req, { documentId: data.id });
  } catch (err) {
    return respondError(req, err);
  }
});
