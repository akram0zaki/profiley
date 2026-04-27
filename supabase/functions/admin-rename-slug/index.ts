import { handlePreflight } from "../_shared/utils/cors.ts";
import { respond, respondError, AppError } from "../_shared/utils/errors.ts";
import { requireAdmin } from "../_shared/auth/requireUser.ts";
import { getServiceClient } from "../_shared/db/serviceClient.ts";
import { z } from "../_shared/validation/schemas.ts";
import { parseJsonBody } from "../_shared/validation/parse.ts";

const Body = z.object({
  profileId: z.string().uuid(),
  newSlug: z.string().min(2).max(60).regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i),
});

Deno.serve(async (req) => {
  const pf = handlePreflight(req);
  if (pf) return pf;
  try {
    if (req.method !== "POST") throw new AppError("METHOD_NOT_ALLOWED", "POST required", 405);
    await requireAdmin(req);
    const body = await parseJsonBody(req, Body);
    const supabase = getServiceClient();
    const slug = body.newSlug.toLowerCase();

    const { data: clash } = await supabase.from("profiles").select("id").eq("slug", slug).maybeSingle();
    if (clash && clash.id !== body.profileId) throw new AppError("SLUG_TAKEN", "Slug already in use", 409);

    const { data: prof, error } = await supabase.from("profiles")
      .update({ slug, updated_at: new Date().toISOString() })
      .eq("id", body.profileId).select("id, user_id, slug").single();
    if (error) throw error;
    await supabase.from("public_pages")
      .update({ slug, updated_at: new Date().toISOString() })
      .eq("user_id", prof.user_id);
    return respond(req, prof);
  } catch (err) {
    return respondError(req, err);
  }
});
