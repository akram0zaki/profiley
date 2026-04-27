import { handlePreflight } from "../_shared/utils/cors.ts";
import { respond, respondError, AppError } from "../_shared/utils/errors.ts";
import { requireUser } from "../_shared/auth/requireUser.ts";
import { getServiceClient } from "../_shared/db/serviceClient.ts";
import { parseJsonBody } from "../_shared/validation/parse.ts";
import { PublishProfileSchema } from "../_shared/validation/schemas.ts";

Deno.serve(async (req) => {
  const pf = handlePreflight(req);
  if (pf) return pf;
  try {
    if (req.method !== "POST") throw new AppError("METHOD_NOT_ALLOWED", "POST required", 405);
    const user = await requireUser(req);
    const body = await parseJsonBody(req, PublishProfileSchema);
    const supabase = getServiceClient();
    const { data, error } = await supabase.from("profiles")
      .update({ public_visibility: body.publicVisibility, updated_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .select("id, slug, public_visibility")
      .single();
    if (error) throw error;
    return respond(req, data);
  } catch (err) {
    return respondError(req, err);
  }
});
