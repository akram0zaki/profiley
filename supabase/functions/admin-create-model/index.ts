import { handlePreflight } from "../_shared/utils/cors.ts";
import { respond, respondError, AppError } from "../_shared/utils/errors.ts";
import { requireAdmin } from "../_shared/auth/requireUser.ts";
import { getServiceClient } from "../_shared/db/serviceClient.ts";
import { parseJsonBody } from "../_shared/validation/parse.ts";
import { AdminCreateModelSchema } from "../_shared/validation/schemas.ts";

Deno.serve(async (req) => {
  const pf = handlePreflight(req);
  if (pf) return pf;
  try {
    if (req.method !== "POST") throw new AppError("METHOD_NOT_ALLOWED", "POST required", 405);
    await requireAdmin(req);
    const body = await parseJsonBody(req, AdminCreateModelSchema);
    const supabase = getServiceClient();
    const { data, error } = await supabase.from("ai_provider_configs").insert({
      capability: body.capability,
      provider: body.provider,
      model_key: body.modelKey,
      display_name: body.displayName,
      is_active: body.isActive,
      is_default: body.isDefault,
      config_json: body.configJson ?? {},
    }).select("*").single();
    if (error) throw error;
    return respond(req, data);
  } catch (err) {
    return respondError(req, err);
  }
});
