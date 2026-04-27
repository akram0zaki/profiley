import { handlePreflight } from "../_shared/utils/cors.ts";
import { respond, respondError, AppError } from "../_shared/utils/errors.ts";
import { requireAdmin } from "../_shared/auth/requireUser.ts";
import { getServiceClient } from "../_shared/db/serviceClient.ts";

Deno.serve(async (req) => {
  const pf = handlePreflight(req);
  if (pf) return pf;
  try {
    if (req.method !== "GET") throw new AppError("METHOD_NOT_ALLOWED", "GET required", 405);
    await requireAdmin(req);
    const url = new URL(req.url);
    const limit = Math.min(500, Math.max(1, Number(url.searchParams.get("limit") ?? "100")));
    const search = url.searchParams.get("q");
    const supabase = getServiceClient();
    let q = supabase
      .from("profiles")
      .select("id, slug, full_name, public_visibility, created_at, user_id, app_users:user_id(email, role, onboarding_completed)")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (search) q = q.ilike("slug", `%${search}%`);
    const { data, error } = await q;
    if (error) throw error;
    return respond(req, { profiles: data ?? [] });
  } catch (err) {
    return respondError(req, err);
  }
});
