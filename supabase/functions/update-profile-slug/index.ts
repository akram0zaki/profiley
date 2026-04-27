import { handlePreflight } from "../_shared/utils/cors.ts";
import { respond, respondError, AppError } from "../_shared/utils/errors.ts";
import { requireUser } from "../_shared/auth/requireUser.ts";
import { getServiceClient } from "../_shared/db/serviceClient.ts";
import { parseJsonBody } from "../_shared/validation/parse.ts";
import { UpdateProfileSlugSchema } from "../_shared/validation/schemas.ts";

Deno.serve(async (req) => {
  const pf = handlePreflight(req);
  if (pf) return pf;
  try {
    if (req.method !== "POST") throw new AppError("METHOD_NOT_ALLOWED", "POST required", 405);
    const user = await requireUser(req);
    const { newSlug } = await parseJsonBody(req, UpdateProfileSlugSchema);

    const supabase = getServiceClient();

    // Look up the current profile + check whether the requested slug is already
    // owned by the same user (no-op) or someone else (conflict).
    const [{ data: ownProfile, error: ownErr }, { data: clash, error: clashErr }] = await Promise.all([
      supabase.from("profiles").select("id, slug, user_id").eq("user_id", user.id).maybeSingle(),
      supabase.from("profiles").select("id, user_id").eq("slug", newSlug).maybeSingle(),
    ]);
    if (ownErr) throw ownErr;
    if (clashErr) throw clashErr;
    if (!ownProfile) throw new AppError("PROFILE_NOT_FOUND", "Profile not found", 404);
    if (clash && clash.user_id !== user.id) {
      throw new AppError("SLUG_TAKEN", "Slug already in use", 409);
    }

    if (ownProfile.slug === newSlug) {
      return respond(req, { id: ownProfile.id, slug: newSlug, changed: false });
    }

    const now = new Date().toISOString();
    const { data: updated, error: updErr } = await supabase
      .from("profiles")
      .update({ slug: newSlug, updated_at: now })
      .eq("id", ownProfile.id)
      .select("id, slug")
      .single();
    if (updErr) throw updErr;

    // Keep the optional public_pages mirror in sync. Failure here should not
    // roll back the slug change — surface a soft warning in `meta` instead.
    let pagesError: string | null = null;
    const { error: ppErr } = await supabase
      .from("public_pages")
      .update({ slug: newSlug, updated_at: now })
      .eq("user_id", user.id);
    if (ppErr) pagesError = ppErr.message;

    return respond(
      req,
      { id: updated.id, slug: updated.slug, changed: true },
      pagesError ? { meta: { publicPagesWarning: pagesError } } : {},
    );
  } catch (err) {
    return respondError(req, err);
  }
});
