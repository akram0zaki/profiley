import { handlePreflight } from "../_shared/utils/cors.ts";
import { respond, respondError, AppError } from "../_shared/utils/errors.ts";
import { requireUser } from "../_shared/auth/requireUser.ts";
import { getServiceClient } from "../_shared/db/serviceClient.ts";
import { parseJsonBody } from "../_shared/validation/parse.ts";
import { ApproveProfileAnswerDraftSchema } from "../_shared/validation/schemas.ts";
import { saveProfileAnswer } from "../_shared/profileAnswers/saveProfileAnswer.ts";
import { loggerForRequest } from "../_shared/utils/logger.ts";

function buildSummary(answerText: string) {
  const trimmed = answerText.trim();
  if (!trimmed) return null;
  return trimmed.length > 160 ? `${trimmed.slice(0, 157)}...` : trimmed;
}

Deno.serve(async (req) => {
  const pf = handlePreflight(req);
  if (pf) return pf;
  const log = loggerForRequest(req, "approve-profile-answer-draft");
  try {
    if (req.method !== "POST") throw new AppError("METHOD_NOT_ALLOWED", "POST required", 405);
    const user = await requireUser(req);
    const body = await parseJsonBody(req, ApproveProfileAnswerDraftSchema);
    const supabase = getServiceClient();

    const answer = await saveProfileAnswer({
      supabase,
      userId: user.id,
      input: {
        questionSetKey: body.questionSetKey,
        questionKey: body.questionKey,
        answerText: body.answerText.trim(),
        answerSummary: body.answerSummary ?? buildSummary(body.answerText),
        captureMethod: "chat",
        visibility: body.visibility,
        reviewState: "confirmed",
        version: body.version,
        staleAfterAt: body.staleAfterAt ?? null,
      },
      embedFeatureKey: "profile-answer",
      log,
    });

    return respond(req, { answer });
  } catch (err) {
    log.error("failed", err);
    return respondError(req, err);
  }
});