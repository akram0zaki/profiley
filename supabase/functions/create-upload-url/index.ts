// Returns a signed upload URL for the user's bucket. Path layout: <user_id>/<uuid>-<safe_filename>.

import { handlePreflight } from "../_shared/utils/cors.ts";
import { respond, respondError, AppError } from "../_shared/utils/errors.ts";
import { requireUser } from "../_shared/auth/requireUser.ts";
import { getServiceClient } from "../_shared/db/serviceClient.ts";
import { parseJsonBody } from "../_shared/validation/parse.ts";
import { CreateUploadUrlSchema } from "../_shared/validation/schemas.ts";

const ALLOWED_MIMES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function safeName(name: string): string {
  return name.replace(/[^A-Za-z0-9._-]+/g, "_").slice(0, 120);
}

Deno.serve(async (req) => {
  const pf = handlePreflight(req);
  if (pf) return pf;
  try {
    if (req.method !== "POST") throw new AppError("METHOD_NOT_ALLOWED", "POST required", 405);
    const user = await requireUser(req);
    const body = await parseJsonBody(req, CreateUploadUrlSchema);
    if (!ALLOWED_MIMES.has(body.mimeType)) {
      throw new AppError("UNSUPPORTED_MIME", `MIME type ${body.mimeType} not allowed`, 400);
    }
    const supabase = getServiceClient();
    const path = `${user.id}/${crypto.randomUUID()}-${safeName(body.filename)}`;
    const { data, error } = await supabase.storage.from(body.bucket).createSignedUploadUrl(path);
    if (error) throw error;
    return respond(req, {
      bucket: body.bucket,
      path,
      signedUrl: data.signedUrl,
      token: (data as any).token,
    });
  } catch (err) {
    return respondError(req, err);
  }
});
