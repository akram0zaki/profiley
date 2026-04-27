import { handlePreflight } from "../_shared/utils/cors.ts";
import { respond, respondError, AppError } from "../_shared/utils/errors.ts";
import { requireAdmin } from "../_shared/auth/requireUser.ts";
import { getServiceClient } from "../_shared/db/serviceClient.ts";
import { parseJsonBody } from "../_shared/validation/parse.ts";
import { AdminToggleModelSchema } from "../_shared/validation/schemas.ts";

Deno.serve(async (req) => {
  const pf = handlePreflight(req);
  if (pf) return pf;
  try {
    if (req.method !== "POST") throw new AppError("METHOD_NOT_ALLOWED", "POST required", 405);
    await requireAdmin(req);
    const body = await parseJsonBody(req, AdminToggleModelSchema);
    const supabase = getServiceClient();
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.isActive !== undefined) update.is_active = body.isActive;
    if (body.isDefault !== undefined) update.is_default = body.isDefault;
    const { data, error } = await supabase.from("ai_provider_configs")
      .update(update).eq("id", body.id).select("*").single();
    if (error) throw error;
    return respond(req, data);
  } catch (err) {
    return respondError(req, err);
  }
});
