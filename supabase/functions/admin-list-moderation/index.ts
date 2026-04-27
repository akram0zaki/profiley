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
    const onlyOpen = url.searchParams.get("status") === "open";
    const supabase = getServiceClient();
    let q = supabase.from("moderation_events").select("*").order("created_at", { ascending: false }).limit(limit);
    if (onlyOpen) q = q.is("reviewed_at", null);
    const { data, error } = await q;
    if (error) throw error;
    return respond(req, { events: data ?? [] });
  } catch (err) {
    return respondError(req, err);
  }
});
