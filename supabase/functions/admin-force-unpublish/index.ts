import { handlePreflight } from "../_shared/utils/cors.ts";
import { respond, respondError, AppError } from "../_shared/utils/errors.ts";
import { requireAdmin } from "../_shared/auth/requireUser.ts";
import { getServiceClient } from "../_shared/db/serviceClient.ts";
import { z } from "../_shared/validation/schemas.ts";
import { parseJsonBody } from "../_shared/validation/parse.ts";

const Body = z.object({
  profileId: z.string().uuid(),
  reason: z.string().max(400).optional(),
});

Deno.serve(async (req) => {
  const pf = handlePreflight(req);
  if (pf) return pf;
  try {
    if (req.method !== "POST") throw new AppError("METHOD_NOT_ALLOWED", "POST required", 405);
    await requireAdmin(req);
    const body = await parseJsonBody(req, Body);
    const supabase = getServiceClient();
    const { data, error } = await supabase.from("profiles")
      .update({ public_visibility: false, updated_at: new Date().toISOString() })
      .eq("id", body.profileId).select("id, slug, public_visibility").single();
    if (error) throw error;
    await supabase.from("moderation_events").insert({
      profile_id: body.profileId,
      event_type: "force_unpublished",
      input_excerpt: body.reason ?? null,
      resolution: "admin_action",
      reviewed_at: new Date().toISOString(),
    });
    return respond(req, data);
  } catch (err) {
    return respondError(req, err);
  }
});
