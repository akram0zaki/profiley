import { handlePreflight } from "../_shared/utils/cors.ts";
import { respond, respondError, AppError } from "../_shared/utils/errors.ts";
import { requireUser } from "../_shared/auth/requireUser.ts";
import { getServiceClient } from "../_shared/db/serviceClient.ts";
import { parseJsonBody } from "../_shared/validation/parse.ts";
import { UpsertProfileAnswerSchema } from "../_shared/validation/schemas.ts";
import { loggerForRequest } from "../_shared/utils/logger.ts";
import { saveProfileAnswer } from "../_shared/profileAnswers/saveProfileAnswer.ts";

Deno.serve(async (req) => {
  const pf = handlePreflight(req);
  if (pf) return pf;
  const log = loggerForRequest(req, "upsert-profile-answer");
  try {
    if (req.method !== "POST") throw new AppError("METHOD_NOT_ALLOWED", "POST required", 405);
    const user = await requireUser(req);
    const body = await parseJsonBody(req, UpsertProfileAnswerSchema);
    const supabase = getServiceClient();
    const data = await saveProfileAnswer({
      supabase,
      userId: user.id,
      input: body,
      embedFeatureKey: "profile-answer",
      log,
    });

    return respond(req, { answer: data });
  } catch (err) {
    log.error("failed", err);
    return respondError(req, err);
  }
});