import { handlePreflight } from "../_shared/utils/cors.ts";
import { respond, respondError, AppError } from "../_shared/utils/errors.ts";
import { requireUser } from "../_shared/auth/requireUser.ts";
import { getServiceClient } from "../_shared/db/serviceClient.ts";
import { parseJsonBody } from "../_shared/validation/parse.ts";
import { GenerateProfileAnswerDraftSchema } from "../_shared/validation/schemas.ts";
import { chatStructured } from "../_shared/ai/capabilities/chat.ts";
import {
  PROFILE_ANSWER_DRAFT_JSON_SCHEMA,
  profileAnswerDraftSystem,
  profileAnswerDraftUserMessage,
} from "../_shared/prompts/profileAnswerDraft.ts";
import { PROFILE_ANSWER_DRAFT_PROMPT_VERSION } from "../_shared/prompts/versions.ts";
import { saveProfileAnswer } from "../_shared/profileAnswers/saveProfileAnswer.ts";
import { loggerForRequest } from "../_shared/utils/logger.ts";

type DraftOutput = {
  answerText: string;
  answerSummary: string;
  followUpQuestion?: string | null;
};

Deno.serve(async (req) => {
  const pf = handlePreflight(req);
  if (pf) return pf;
  const log = loggerForRequest(req, "generate-profile-answer-draft");
  try {
    if (req.method !== "POST") throw new AppError("METHOD_NOT_ALLOWED", "POST required", 405);
    const user = await requireUser(req);
    const body = await parseJsonBody(req, GenerateProfileAnswerDraftSchema);
    const supabase = getServiceClient();

    const draft = await chatStructured<DraftOutput>(
      "profile-answer-draft",
      PROFILE_ANSWER_DRAFT_JSON_SCHEMA,
      [
        { role: "system", content: profileAnswerDraftSystem(body.language ?? "en") },
        {
          role: "user",
          content: profileAnswerDraftUserMessage({
            questionPrompt: body.questionPrompt,
            questionHelper: body.questionHelper ?? null,
            sourceNotes: body.sourceNotes,
            currentAnswerText: body.currentAnswerText ?? null,
          }),
        },
      ],
      {
        temperature: 0.3,
        maxTokens: 700,
        userId: user.id,
        promptVersion: PROFILE_ANSWER_DRAFT_PROMPT_VERSION,
      },
    );

    const answer = await saveProfileAnswer({
      supabase,
      userId: user.id,
      input: {
        questionSetKey: body.questionSetKey,
        questionKey: body.questionKey,
        answerText: draft.object.answerText.trim(),
        answerSummary: draft.object.answerSummary?.trim() || null,
        answerJson: {
          provenance: {
            draft_source: "ai",
            prompt_version: PROFILE_ANSWER_DRAFT_PROMPT_VERSION,
            model_used: draft.modelUsed,
          },
          source_notes: body.sourceNotes,
          follow_up_question: draft.object.followUpQuestion ?? null,
        },
        captureMethod: "chat",
        visibility: "private",
        reviewState: "draft",
      },
      log,
    });

    return respond(req, {
      answer,
      modelUsed: draft.modelUsed,
      followUpQuestion: draft.object.followUpQuestion ?? null,
    });
  } catch (err) {
    log.error("failed", err);
    return respondError(req, err);
  }
});