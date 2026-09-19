import { handlePreflight } from "../_shared/utils/cors.ts";
import { respond, respondError, AppError } from "../_shared/utils/errors.ts";
import { requireUser } from "../_shared/auth/requireUser.ts";
import { getServiceClient } from "../_shared/db/serviceClient.ts";
import { parseJsonBody } from "../_shared/validation/parse.ts";
import { CompleteActivationSchema } from "../_shared/validation/schemas.ts";

Deno.serve(async (req) => {
  const pf = handlePreflight(req);
  if (pf) return pf;
  try {
    if (req.method !== "POST") throw new AppError("METHOD_NOT_ALLOWED", "POST required", 405);
    const user = await requireUser(req);
    const body = await parseJsonBody(req, CompleteActivationSchema);
    const supabase = getServiceClient();
    const now = new Date().toISOString();

    const { data: existing, error: existingError } = await supabase
      .from("app_users")
      .select("activation_completed_at")
      .eq("id", user.id)
      .single();
    if (existingError) throw existingError;

    const activationCompletedAt = existing.activation_completed_at ?? now;
    const { error: updateError } = await supabase
      .from("app_users")
      .update({
        activation_completed_at: activationCompletedAt,
        onboarding_completed: true,
        last_seen_at: now,
      })
      .eq("id", user.id);
    if (updateError) throw updateError;

    return respond(req, {
      activationCompletedAt,
      completionSource: body.completionSource,
    });
  } catch (err) {
    return respondError(req, err);
  }
});