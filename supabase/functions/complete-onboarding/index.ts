// Persist onboarding answers, update profile fields, mark user onboarded,
// and seed knowledge_chunks from onboarding answers (without embeddings;
// embedding will be generated lazily when chat retrieval first runs OR by a
// follow-up embed-onboarding job — for MVP we embed inline).

import { handlePreflight } from "../_shared/utils/cors.ts";
import { respond, respondError, AppError } from "../_shared/utils/errors.ts";
import { requireUser } from "../_shared/auth/requireUser.ts";
import { getServiceClient } from "../_shared/db/serviceClient.ts";
import { parseJsonBody } from "../_shared/validation/parse.ts";
import { CompleteOnboardingSchema } from "../_shared/validation/schemas.ts";
import { embedBatch } from "../_shared/ai/capabilities/embeddings.ts";
import { loggerForRequest } from "../_shared/utils/logger.ts";

Deno.serve(async (req) => {
  const pf = handlePreflight(req);
  if (pf) return pf;
  const log = loggerForRequest(req, "complete-onboarding");
  try {
    if (req.method !== "POST") throw new AppError("METHOD_NOT_ALLOWED", "POST required", 405);
    const user = await requireUser(req);
    const body = await parseJsonBody(req, CompleteOnboardingSchema);
    const supabase = getServiceClient();

    // Upsert onboarding answers.
    if (body.answers.length > 0) {
      const rows = body.answers.map((a) => ({
        user_id: user.id,
        question_key: a.questionKey,
        answer_text: a.answerText ?? null,
        answer_json: a.answerJson ?? null,
        updated_at: new Date().toISOString(),
      }));
      const { error: aErr } = await supabase.from("onboarding_answers")
        .upsert(rows, { onConflict: "user_id,question_key" });
      if (aErr) throw aErr;
    }

    // Update profile fields.
    if (body.profile) {
      const { error: pErr } = await supabase.from("profiles").update({
        full_name: body.profile.fullName,
        headline: body.profile.headline,
        short_bio: body.profile.shortBio,
        long_bio: body.profile.longBio,
        current_location: body.profile.currentLocation,
        updated_at: new Date().toISOString(),
      }).eq("user_id", user.id);
      if (pErr) throw pErr;

      const { error: uErr } = await supabase.from("app_users").update({
        preferred_language: body.profile.preferredLanguage,
        timezone: body.profile.timezone,
        onboarding_completed: true,
        last_seen_at: new Date().toISOString(),
      }).eq("id", user.id);
      if (uErr) throw uErr;
    } else {
      await supabase.from("app_users").update({
        onboarding_completed: true,
        last_seen_at: new Date().toISOString(),
      }).eq("id", user.id);
    }

    // Seed knowledge chunks from textual answers (skip empty / non-text).
    const textualAnswers = body.answers
      .filter((a) => typeof a.answerText === "string" && a.answerText.trim().length > 10);
    if (textualAnswers.length > 0) {
      const texts = textualAnswers.map((a) => `${a.questionKey}: ${a.answerText}`);
      try {
        const { vectors } = await embedBatch("onboarding-seed", texts, { userId: user.id });
        const chunkRows = textualAnswers.map((a, idx) => ({
          user_id: user.id,
          source_kind: "onboarding",
          chunk_index: idx,
          content: texts[idx],
          embedding: vectors[idx] as unknown,
          metadata: { public: true, question_key: a.questionKey },
        }));
        // Replace existing onboarding chunks (idempotent on re-onboarding).
        await supabase.from("knowledge_chunks")
          .delete()
          .eq("user_id", user.id)
          .eq("source_kind", "onboarding");
        const { error: kErr } = await supabase.from("knowledge_chunks").insert(chunkRows);
        if (kErr) throw kErr;
      } catch (embedErr) {
        log.warn("onboarding embedding skipped", embedErr);
      }
    }

    return respond(req, { ok: true });
  } catch (err) {
    log.error("failed", err);
    return respondError(req, err);
  }
});
