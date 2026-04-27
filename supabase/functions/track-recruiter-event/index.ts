import { handlePreflight } from "../_shared/utils/cors.ts";
import { respond, respondError, AppError } from "../_shared/utils/errors.ts";
import { getServiceClient } from "../_shared/db/serviceClient.ts";
import { parseJsonBody } from "../_shared/validation/parse.ts";
import { TrackRecruiterEventSchema } from "../_shared/validation/schemas.ts";
import { visitorSessionFromHeader } from "../_shared/utils/rateLimit.ts";

Deno.serve(async (req) => {
  const pf = handlePreflight(req);
  if (pf) return pf;
  try {
    if (req.method !== "POST") throw new AppError("METHOD_NOT_ALLOWED", "POST required", 405);
    const body = await parseJsonBody(req, TrackRecruiterEventSchema);
    const supabase = getServiceClient();
    const { data: profile } = await supabase
      .from("public_profile_view")
      .select("id")
      .eq("slug", body.slug)
      .maybeSingle();
    if (!profile) throw new AppError("PROFILE_NOT_FOUND", "Profile not found", 404);

    const session = body.visitorSessionId ?? visitorSessionFromHeader(req);
    await supabase.from("recruiter_events").insert({
      profile_id: profile.id,
      event_name: body.eventName,
      event_payload: body.payload ?? {},
      visitor_session_id: session,
    });
    return respond(req, { ok: true });
  } catch (err) {
    return respondError(req, err);
  }
});
