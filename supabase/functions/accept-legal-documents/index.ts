import { requireUser } from "../_shared/auth/requireUser.ts";
import { getServiceClient } from "../_shared/db/serviceClient.ts";
import {
  AppError,
  respond,
  respondError,
} from "../_shared/utils/errors.ts";
import { buildLegalAcceptancePatch, CURRENT_PRIVACY_VERSION, CURRENT_TERMS_VERSION } from "../_shared/legal.ts";
import { loggerForRequest } from "../_shared/utils/logger.ts";
import { handlePreflight } from "../_shared/utils/cors.ts";
import { parseJsonBody } from "../_shared/validation/parse.ts";
import { AcceptLegalDocumentsSchema } from "../_shared/validation/schemas.ts";

const LEGAL_SELECT = [
  "terms_accepted_at",
  "privacy_accepted_at",
  "terms_version",
  "privacy_version",
  "terms_acceptance_source",
  "privacy_acceptance_source",
].join(", ");

Deno.serve(async (req) => {
  const pf = handlePreflight(req);
  if (pf) return pf;

  const log = loggerForRequest(req, "accept-legal-documents");

  try {
    if (req.method !== "POST") {
      throw new AppError("METHOD_NOT_ALLOWED", "POST required", 405);
    }

    const user = await requireUser(req);
    const body = await parseJsonBody(req, AcceptLegalDocumentsSchema);
    const supabase = getServiceClient();

    const { data: existing, error: existingError } = await supabase
      .from("app_users")
      .select(LEGAL_SELECT)
      .eq("id", user.id)
      .maybeSingle();

    if (existingError) throw existingError;
    if (!existing) {
      throw new AppError(
        "APP_USER_NOT_INITIALIZED",
        "Initialize the application profile before accepting legal documents.",
        409,
      );
    }

    const nowIso = new Date().toISOString();
    const patch = buildLegalAcceptancePatch(existing, nowIso, body.acceptanceSource);
    let current = existing;

    if (Object.keys(patch).length > 0) {
      const { data: updated, error: updateError } = await supabase
        .from("app_users")
        .update({ ...patch, last_seen_at: nowIso })
        .eq("id", user.id)
        .select(LEGAL_SELECT)
        .single();

      if (updateError) throw updateError;
      current = updated;
    }

    log.info("accepted", {
      userId: user.id,
      acceptedNow: Object.keys(patch).length > 0,
      termsVersion: CURRENT_TERMS_VERSION,
      privacyVersion: CURRENT_PRIVACY_VERSION,
    });

    return respond(req, {
      acceptedNow: Object.keys(patch).length > 0,
      termsVersion: CURRENT_TERMS_VERSION,
      privacyVersion: CURRENT_PRIVACY_VERSION,
      appUser: current,
    });
  } catch (err) {
    log.error("failed", err);
    return respondError(req, err);
  }
});