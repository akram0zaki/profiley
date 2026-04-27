import { handlePreflight } from "../_shared/utils/cors.ts";
import { respond, respondError } from "../_shared/utils/errors.ts";
import { requireUser } from "../_shared/auth/requireUser.ts";
import { getUserClient } from "../_shared/db/userClient.ts";
import { parseJsonBody } from "../_shared/validation/parse.ts";
import { UpdateUserLocaleSchema } from "../_shared/validation/schemas.ts";

Deno.serve(async (req) => {
  const pf = handlePreflight(req);
  if (pf) return pf;
  try {
    if (req.method !== "POST") return respondError(req, new Error("METHOD_NOT_ALLOWED"), 405);
    const user = await requireUser(req);
    const body = await parseJsonBody(req, UpdateUserLocaleSchema);
    const supabase = getUserClient(req);
    const { error } = await supabase.from("app_users").update({
      browser_locale: body.browserLocale,
      timezone: body.timezone,
      preferred_language: body.preferredLanguage,
      last_seen_at: new Date().toISOString(),
    }).eq("id", user.id);
    if (error) throw error;
    return respond(req, { ok: true });
  } catch (err) {
    return respondError(req, err);
  }
});
