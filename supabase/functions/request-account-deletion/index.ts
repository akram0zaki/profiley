import { requireUser } from "../_shared/auth/requireUser.ts";
import { getServiceClient } from "../_shared/db/serviceClient.ts";
import { buildDeletionRequestUpdate, hasPendingDeletion } from "../_shared/accountDeletion.ts";
import { AppError, respond, respondError } from "../_shared/utils/errors.ts";
import { loggerForRequest } from "../_shared/utils/logger.ts";
import { handlePreflight } from "../_shared/utils/cors.ts";
import { parseJsonBody } from "../_shared/validation/parse.ts";
import { RequestAccountDeletionSchema } from "../_shared/validation/schemas.ts";

const SELECT_COLUMNS = [
  "deletion_requested_at",
  "deletion_scheduled_for",
  "deletion_cancelled_at",
  "deletion_request_source",
  "deletion_restore_public_visibility",
].join(", ");

Deno.serve(async (req) => {
  const pf = handlePreflight(req);
  if (pf) return pf;
  const log = loggerForRequest(req, "request-account-deletion");

  try {
    if (req.method !== "POST") {
      throw new AppError("METHOD_NOT_ALLOWED", "POST required", 405);
    }

    const user = await requireUser(req);
    const body = await parseJsonBody(req, RequestAccountDeletionSchema);
    const supabase = getServiceClient();
    const nowIso = new Date().toISOString();

    const { data: appUser, error: appUserError } = await supabase
      .from("app_users")
      .select(SELECT_COLUMNS)
      .eq("id", user.id)
      .maybeSingle();

    if (appUserError) throw appUserError;
    if (!appUser) {
      throw new AppError("APP_USER_NOT_INITIALIZED", "Account is not initialized", 409);
    }

    if (hasPendingDeletion(appUser)) {
      return respond(req, {
        alreadyScheduled: true,
        scheduledFor: appUser.deletion_scheduled_for,
      });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("public_visibility")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileError) throw profileError;

    const update = buildDeletionRequestUpdate(
      nowIso,
      body.requestSource,
      Boolean(profile?.public_visibility),
    );

    const { data: updated, error: updateError } = await supabase
      .from("app_users")
      .update({ ...update, last_seen_at: nowIso })
      .eq("id", user.id)
      .select(SELECT_COLUMNS)
      .single();

    if (updateError) throw updateError;

    const { error: visibilityError } = await supabase
      .from("profiles")
      .update({ public_visibility: false, updated_at: nowIso })
      .eq("user_id", user.id);

    if (visibilityError) throw visibilityError;

    log.info("scheduled", { userId: user.id, scheduledFor: updated.deletion_scheduled_for });

    return respond(req, {
      alreadyScheduled: false,
      scheduledFor: updated.deletion_scheduled_for,
    });
  } catch (err) {
    log.error("failed", err);
    return respondError(req, err);
  }
});