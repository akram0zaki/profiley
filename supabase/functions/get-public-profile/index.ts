import { handlePreflight } from "../_shared/utils/cors.ts";
import { respond, respondError, AppError } from "../_shared/utils/errors.ts";
import { getServiceClient } from "../_shared/db/serviceClient.ts";
import { GetPublicProfileSchema } from "../_shared/validation/schemas.ts";
import { trackEvent } from "../_shared/analytics/trackEvent.ts";
import { visitorSessionFromHeader, clientIp, hashIp } from "../_shared/utils/rateLimit.ts";

Deno.serve(async (req) => {
  const pf = handlePreflight(req);
  if (pf) return pf;
  try {
    let slug: string | null = null;
    if (req.method === "GET") {
      const url = new URL(req.url);
      slug = url.searchParams.get("slug");
    } else if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const r = GetPublicProfileSchema.safeParse(body);
      if (r.success) slug = r.data.slug;
    } else {
      throw new AppError("METHOD_NOT_ALLOWED", "Use GET or POST", 405);
    }
    if (!slug) throw new AppError("MISSING_SLUG", "Slug required", 400);

    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from("public_profile_view")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new AppError("PROFILE_NOT_FOUND", "Not found", 404);

    // Resolve a public URL for the photo if present.
    let photoUrl: string | null = null;
    if (data.profile_photo_path) {
      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(data.profile_photo_path);
      photoUrl = pub.publicUrl;
    }

    // Best-effort visit log.
    try {
      const session = visitorSessionFromHeader(req);
      await supabase.from("recruiter_visits").insert({
        profile_id: data.id,
        visitor_session_id: session,
        referrer: req.headers.get("referer"),
        locale: req.headers.get("accept-language"),
        user_agent: req.headers.get("user-agent"),
        ip_hash: hashIp(clientIp(req) ?? "unknown"),
      });
      await trackEvent({
        profileId: data.id,
        eventName: "profile_view",
        visitorSessionId: session,
      });
    } catch {
      // ignore
    }

    return respond(req, { ...data, photoUrl });
  } catch (err) {
    return respondError(req, err);
  }
});
