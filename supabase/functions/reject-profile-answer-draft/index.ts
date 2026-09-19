import { handlePreflight } from "../_shared/utils/cors.ts";
import { respond, respondError, AppError } from "../_shared/utils/errors.ts";
import { requireUser } from "../_shared/auth/requireUser.ts";
import { getServiceClient } from "../_shared/db/serviceClient.ts";
import { parseJsonBody } from "../_shared/validation/parse.ts";
import { RejectProfileAnswerDraftSchema } from "../_shared/validation/schemas.ts";
import { saveProfileAnswer } from "../_shared/profileAnswers/saveProfileAnswer.ts";
import { loggerForRequest } from "../_shared/utils/logger.ts";

type PreviousConfirmedAnswer = {
  answer_text?: string | null;
  answer_summary?: string | null;
  visibility?: "private" | "avatar_queryable" | "public_profile";
  capture_method?: "form" | "chat" | "imported";
  stale_after_at?: string | null;
};

Deno.serve(async (req) => {
  const pf = handlePreflight(req);
  if (pf) return pf;
  const log = loggerForRequest(req, "reject-profile-answer-draft");
  try {
    if (req.method !== "POST") throw new AppError("METHOD_NOT_ALLOWED", "POST required", 405);
    const user = await requireUser(req);
    const body = await parseJsonBody(req, RejectProfileAnswerDraftSchema);
    const supabase = getServiceClient();

    const rowQuery = supabase.from("onboarding_answers") as unknown as {
      select: (columns: string) => {
        eq: (column: string, value: unknown) => {
          eq: (column: string, value: unknown) => {
            eq: (column: string, value: unknown) => { maybeSingle: () => Promise<{ data: Record<string, unknown> | null; error: unknown | null }> };
          };
        };
      };
    };
    const { data: row, error } = await rowQuery
      .select("id, version, review_state, capture_method, answer_json")
      .eq("user_id", user.id)
      .eq("question_set_key", body.questionSetKey)
      .eq("question_key", body.questionKey)
      .maybeSingle();
    if (error) throw error;
    if (!row) throw new AppError("ANSWER_NOT_FOUND", "Draft answer not found", 404);
    if (row.review_state !== "draft" || row.capture_method !== "chat") {
      throw new AppError("ANSWER_NOT_DRAFT", "Only AI drafts can be rejected", 400);
    }

    const previousConfirmed = (row.answer_json as { previous_confirmed?: PreviousConfirmedAnswer } | null)
      ?.previous_confirmed ?? null;

    if (previousConfirmed?.answer_text?.trim()) {
      const answer = await saveProfileAnswer({
        supabase,
        userId: user.id,
        input: {
          questionSetKey: body.questionSetKey,
          questionKey: body.questionKey,
          answerText: previousConfirmed.answer_text,
          answerSummary: previousConfirmed.answer_summary ?? null,
          captureMethod: previousConfirmed.capture_method ?? "form",
          visibility: previousConfirmed.visibility ?? "avatar_queryable",
          reviewState: "confirmed",
          version: typeof row.version === "number" ? row.version : undefined,
          staleAfterAt: previousConfirmed.stale_after_at ?? null,
        },
        embedFeatureKey: "profile-answer",
        log,
      });
      return respond(req, { answer, restored: true });
    }

    const deleteAnswerQuery = supabase.from("onboarding_answers") as unknown as {
      delete: () => {
        eq: (column: string, value: unknown) => {
          eq: (column: string, value: unknown) => {
            eq: (column: string, value: unknown) => Promise<{ error: unknown | null }>;
          };
        };
      };
    };
    const { error: deleteError } = await deleteAnswerQuery
      .delete()
      .eq("user_id", user.id)
      .eq("question_set_key", body.questionSetKey)
      .eq("question_key", body.questionKey);
    if (deleteError) throw deleteError;

    const deleteChunksQuery = supabase.from("knowledge_chunks") as unknown as {
      delete: () => {
        eq: (column: string, value: unknown) => {
          eq: (column: string, value: unknown) => {
            contains: (column: string, value: unknown) => Promise<{ error: unknown | null }>;
          };
        };
      };
    };
    await deleteChunksQuery
      .delete()
      .eq("user_id", user.id)
      .eq("source_kind", "profile_answer")
      .contains("metadata", {
        question_set_key: body.questionSetKey,
        question_key: body.questionKey,
      } as never);

    return respond(req, { answer: null, restored: false });
  } catch (err) {
    log.error("failed", err);
    return respondError(req, err);
  }
});