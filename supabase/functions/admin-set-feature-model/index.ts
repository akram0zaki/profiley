import { handlePreflight } from "../_shared/utils/cors.ts";
import { respond, respondError, AppError } from "../_shared/utils/errors.ts";
import { requireAdmin } from "../_shared/auth/requireUser.ts";
import { getServiceClient } from "../_shared/db/serviceClient.ts";
import { parseJsonBody } from "../_shared/validation/parse.ts";
import { AdminSetFeatureModelSchema } from "../_shared/validation/schemas.ts";

Deno.serve(async (req) => {
  const pf = handlePreflight(req);
  if (pf) return pf;
  try {
    if (req.method !== "POST") throw new AppError("METHOD_NOT_ALLOWED", "POST required", 405);
    await requireAdmin(req);
    const body = await parseJsonBody(req, AdminSetFeatureModelSchema);
    const supabase = getServiceClient();
    const { data, error } = await supabase.from("feature_model_assignments").upsert({
      feature_key: body.featureKey,
      capability: body.capability,
      provider_config_id: body.providerConfigId,
      updated_at: new Date().toISOString(),
    }, { onConflict: "feature_key,capability" }).select("*").single();
    if (error) throw error;
    return respond(req, data);
  } catch (err) {
    return respondError(req, err);
  }
});
