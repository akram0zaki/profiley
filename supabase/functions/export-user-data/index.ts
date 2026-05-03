import { requireUser } from "../_shared/auth/requireUser.ts";
import { getServiceClient } from "../_shared/db/serviceClient.ts";
import { assembleUserDataExport } from "../_shared/exportUserData.ts";
import { AppError, respond, respondError } from "../_shared/utils/errors.ts";
import { handlePreflight } from "../_shared/utils/cors.ts";
import { loggerForRequest } from "../_shared/utils/logger.ts";

Deno.serve(async (req) => {
  const pf = handlePreflight(req);
  if (pf) return pf;
  const log = loggerForRequest(req, "export-user-data");

  try {
    if (req.method !== "POST") {
      throw new AppError("METHOD_NOT_ALLOWED", "POST required", 405);
    }

    const user = await requireUser(req);
    const supabase = getServiceClient();
    const bundle = await assembleUserDataExport(supabase, user.id);

    log.info("exported", {
      userId: user.id,
      tableCounts: bundle.manifest.tableCounts,
    });

    return respond(req, bundle);
  } catch (err) {
    log.error("failed", err);
    return respondError(req, err);
  }
});