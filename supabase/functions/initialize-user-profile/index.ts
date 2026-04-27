// Initialize a user's app_users + profiles + preferences + public_pages rows
// after first sign-in (called by frontend right after session is established).

import { handlePreflight } from "../_shared/utils/cors.ts";
import { respond, respondError } from "../_shared/utils/errors.ts";
import { requireUser } from "../_shared/auth/requireUser.ts";
import { getServiceClient } from "../_shared/db/serviceClient.ts";
import { InitializeUserProfileSchema } from "../_shared/validation/schemas.ts";
import { generateUniqueSlug } from "../_shared/utils/slug.ts";
import { loggerForRequest } from "../_shared/utils/logger.ts";

Deno.serve(async (req) => {
  const pf = handlePreflight(req);
  if (pf) return pf;
  const log = loggerForRequest(req, "initialize-user-profile");
  try {
    if (req.method !== "POST") return respondError(req, new Error("METHOD_NOT_ALLOWED"), 405);
    const user = await requireUser(req);
    const body = InitializeUserProfileSchema.parse(await req.json().catch(() => ({})));
    const supabase = getServiceClient();

    // app_users upsert.
    const { error: auErr } = await supabase.from("app_users").upsert(
      {
        id: user.id,
        email: body.email ?? user.email ?? `${user.id}@user.local`,
        browser_locale: body.browserLocale,
        timezone: body.timezone,
        preferred_language: body.preferredLanguage,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );
    if (auErr) throw auErr;

    // profile + preferences + public_pages if missing.
    const { data: existing } = await supabase.from("profiles").select("id, slug").eq("user_id", user.id).maybeSingle();
    let profileId = existing?.id as string | undefined;
    let slug = existing?.slug as string | undefined;
    if (!existing) {
      slug = await generateUniqueSlug(body.fullName ?? user.email?.split("@")[0] ?? "user");
      const { data: ins, error: pErr } = await supabase.from("profiles").insert({
        user_id: user.id,
        slug,
        full_name: body.fullName ?? user.email?.split("@")[0] ?? "New User",
      }).select("id").single();
      if (pErr) throw pErr;
      profileId = ins.id;
      await supabase.from("profile_preferences").insert({ user_id: user.id }).then(() => {});
      await supabase.from("public_pages").insert({ user_id: user.id, slug }).then(() => {});
    }

    log.info("initialized", { userId: user.id, profileId });
    return respond(req, { userId: user.id, profileId, slug });
  } catch (err) {
    log.error("failed", err);
    return respondError(req, err);
  }
});
