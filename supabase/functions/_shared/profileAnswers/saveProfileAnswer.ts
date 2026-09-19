import { embedText } from "../ai/capabilities/embeddings.ts";

type PersistedAnswerInput = {
  questionSetKey: string;
  questionKey: string;
  answerText: string;
  answerSummary?: string | null;
  answerJson?: Record<string, unknown> | null;
  captureMethod: "form" | "chat" | "imported";
  visibility: "private" | "avatar_queryable" | "public_profile";
  reviewState: "draft" | "confirmed" | "stale";
  version?: number;
  staleAfterAt?: string | null;
};

type ExistingAnswerRow = {
  id: string;
  version: number | null;
  answer_text: string | null;
  answer_summary: string | null;
  answer_json: Record<string, unknown> | null;
  visibility: "private" | "avatar_queryable" | "public_profile" | null;
  review_state: "draft" | "confirmed" | "stale" | null;
  capture_method: "form" | "chat" | "imported" | null;
  stale_after_at: string | null;
  approved_at: string | null;
  last_reviewed_at: string | null;
};

const STALE_AFTER_DAYS = 365;

export function computeNextProfileAnswerVersion(existingVersion: number | null, explicitVersion?: number) {
  if (typeof explicitVersion === "number") return explicitVersion;
  return (existingVersion ?? 0) + 1;
}

export function defaultProfileAnswerStaleAfter(nowIso: string) {
  const next = new Date(nowIso);
  next.setUTCDate(next.getUTCDate() + STALE_AFTER_DAYS);
  return next.toISOString();
}

export async function saveProfileAnswer(opts: {
  supabase: {
    from: (table: string) => unknown;
  };
  userId: string;
  input: PersistedAnswerInput;
  embedFeatureKey?: string;
  log?: { warn: (message: string, error: unknown) => void };
}) {
  const { supabase, userId, input } = opts;
  const now = new Date().toISOString();

  const existingQuery = supabase
    .from("onboarding_answers") as {
      select: (columns: string) => {
        eq: (column: string, value: unknown) => {
          eq: (column: string, value: unknown) => {
            eq: (column: string, value: unknown) => { maybeSingle: () => Promise<{ data: ExistingAnswerRow | null; error: unknown | null }> };
          };
        };
      };
    };
  const { data: existing, error: existingError } = await existingQuery
    .select("id, version, answer_text, answer_summary, answer_json, visibility, review_state, capture_method, stale_after_at, approved_at, last_reviewed_at")
    .eq("user_id", userId)
    .eq("question_set_key", input.questionSetKey)
    .eq("question_key", input.questionKey)
    .maybeSingle();
  if (existingError) throw existingError;

  const version = computeNextProfileAnswerVersion(existing?.version ?? null, input.version);
  const staleAfterAt = input.staleAfterAt ?? existing?.stale_after_at ?? defaultProfileAnswerStaleAfter(now);
  const approvedAt = input.reviewState === "confirmed" ? now : null;
  const lastReviewedAt = input.reviewState === "confirmed" ? now : existing?.last_reviewed_at ?? null;

  const row = {
    user_id: userId,
    question_set_key: input.questionSetKey,
    question_key: input.questionKey,
    answer_text: input.answerText,
    answer_summary: input.answerSummary ?? null,
    answer_json: input.answerJson ?? null,
    capture_method: input.captureMethod,
    visibility: input.visibility,
    review_state: input.reviewState,
    approved_at: approvedAt,
    version,
    stale_after_at: staleAfterAt,
    last_reviewed_at: lastReviewedAt,
    updated_at: now,
  };

  const upsertQuery = supabase.from("onboarding_answers") as {
    upsert: (row: Record<string, unknown>, opts: { onConflict: string }) => {
      select: (columns: string) => { single: () => Promise<{ data: Record<string, unknown> | null; error: unknown | null }> };
    };
  };
  const { data, error } = await upsertQuery
    .upsert(row, { onConflict: "user_id,question_set_key,question_key" })
    .select("id, question_set_key, question_key, answer_text, answer_summary, visibility, review_state, capture_method, version, stale_after_at, updated_at")
    .single();
  if (error) throw error;

  const deleteQuery = supabase.from("knowledge_chunks") as {
    delete: () => {
      eq: (column: string, value: unknown) => {
        eq: (column: string, value: unknown) => {
          contains: (column: string, value: unknown) => Promise<{ error: unknown | null }>;
        };
      };
    };
  };
  await deleteQuery
    .delete()
    .eq("user_id", userId)
    .eq("source_kind", "profile_answer")
    .contains("metadata", {
      question_set_key: input.questionSetKey,
      question_key: input.questionKey,
    } as never);

  const shouldIndex = input.reviewState === "confirmed" && input.visibility !== "private";
  if (shouldIndex) {
    const content = `${input.questionKey}: ${input.answerText}`;
    try {
      const { vector } = await embedText(opts.embedFeatureKey ?? "profile-answer", content, { userId });
      const insertQuery = supabase.from("knowledge_chunks") as {
        insert: (row: Record<string, unknown>) => Promise<{ error: unknown | null }>;
      };
      const { error: insertError } = await insertQuery.insert({
        user_id: userId,
        source_kind: "profile_answer",
        chunk_index: 0,
        content,
        embedding: vector as unknown,
        metadata: {
          public: input.visibility === "public_profile",
          question_set_key: input.questionSetKey,
          question_key: input.questionKey,
          visibility: input.visibility,
          capture_method: input.captureMethod,
          review_state: input.reviewState,
          version,
          stale_after_at: staleAfterAt,
        },
      });
      if (insertError) throw insertError;
    } catch (embedError) {
      opts.log?.warn("profile answer embedding skipped", embedError);
    }
  }

  return data;
}