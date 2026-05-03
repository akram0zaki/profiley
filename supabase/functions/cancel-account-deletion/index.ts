import { requireUser } from "../_shared/auth/requireUser.ts";
import { getServiceClient } from "../_shared/db/serviceClient.ts";
import {
  buildDeletionCancellationUpdate,
  hasPendingDeletion,
  isDeletionDue,
} from "../_shared/accountDeletion.ts";
import { AppError, respond, respondError } from "../_shared/utils/errors.ts";
import { loggerForRequest } from "../_shared/utils/logger.ts";
import { handlePreflight } from "../_shared/utils/cors.ts";

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
  const log = loggerForRequest(req, "cancel-account-deletion");

  try {
    if (req.method !== "POST") {
      throw new AppError("METHOD_NOT_ALLOWED", "POST required", 405);
    }

    const user = await requireUser(req);
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

    if (!hasPendingDeletion(appUser)) {
      return respond(req, { cancelled: false, pending: false });
    }

    if (isDeletionDue(appUser, nowIso)) {
      throw new AppError("DELETION_ALREADY_DUE", "This deletion request can no longer be cancelled", 409);
    }

    const update = buildDeletionCancellationUpdate(nowIso);
    const restorePublicVisibility = Boolean(appUser.deletion_restore_public_visibility);

    const { error: updateError } = await supabase
      .from("app_users")
      .update({ ...update, last_seen_at: nowIso })
      .eq("id", user.id);

    if (updateError) throw updateError;

    if (restorePublicVisibility) {
      const { error: visibilityError } = await supabase
        .from("profiles")
        .update({ public_visibility: true, updated_at: nowIso })
        .eq("user_id", user.id);
      if (visibilityError) throw visibilityError;
    }

    log.info("cancelled", { userId: user.id, restorePublicVisibility });

    return respond(req, { cancelled: true, pending: false });
  } catch (err) {
    log.error("failed", err);
    return respondError(req, err);
  }
});