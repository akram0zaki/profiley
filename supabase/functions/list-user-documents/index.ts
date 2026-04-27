import { handlePreflight } from "../_shared/utils/cors.ts";
import { respond, respondError, AppError } from "../_shared/utils/errors.ts";
import { requireUser } from "../_shared/auth/requireUser.ts";
import { getUserClient } from "../_shared/db/userClient.ts";

Deno.serve(async (req) => {
  const pf = handlePreflight(req);
  if (pf) return pf;
  try {
    if (req.method !== "GET" && req.method !== "POST") {
      throw new AppError("METHOD_NOT_ALLOWED", "GET or POST required", 405);
    }
    const user = await requireUser(req);
    const supabase = getUserClient(req);
    const { data, error } = await supabase
      .from("uploaded_documents")
      .select(
        "id, original_filename, mime_type, file_size, processing_status, extracted_text_status, retry_count, last_error, created_at, updated_at",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return respond(req, { documents: data ?? [] });
  } catch (err) {
    return respondError(req, err);
  }
});
