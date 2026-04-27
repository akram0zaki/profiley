import { handlePreflight } from "../_shared/utils/cors.ts";
import { respond, respondError, AppError } from "../_shared/utils/errors.ts";
import { requireAdmin } from "../_shared/auth/requireUser.ts";
import { getServiceClient } from "../_shared/db/serviceClient.ts";

Deno.serve(async (req) => {
  const pf = handlePreflight(req);
  if (pf) return pf;
  try {
    if (req.method !== "GET" && req.method !== "POST") {
      throw new AppError("METHOD_NOT_ALLOWED", "GET or POST required", 405);
    }
    await requireAdmin(req);
    const supabase = getServiceClient();
    const { data: configs } = await supabase
      .from("ai_provider_configs")
      .select("*")
      .order("capability", { ascending: true })
      .order("provider", { ascending: true });
    const { data: assignments } = await supabase
      .from("feature_model_assignments")
      .select("*, ai_provider_configs(provider, model_key, display_name)")
      .order("feature_key");
    return respond(req, { configs: configs ?? [], assignments: assignments ?? [] });
  } catch (err) {
    return respondError(req, err);
  }
});
