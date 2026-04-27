// Extracts structured profile fields (name, headline, bio, skills, …) from
// the user's most recent processed CV. Does NOT persist anything — the
// frontend uses the result to prefill the profile form for review/editing.

import { handlePreflight } from "../_shared/utils/cors.ts";
import { respond, respondError, AppError } from "../_shared/utils/errors.ts";
import { requireUser } from "../_shared/auth/requireUser.ts";
import { getServiceClient } from "../_shared/db/serviceClient.ts";
import { parseJsonBody } from "../_shared/validation/parse.ts";
import { ExtractProfileFromCvSchema } from "../_shared/validation/schemas.ts";
import { chatStructured } from "../_shared/ai/capabilities/chat.ts";
import {
  PROFILE_EXTRACT_JSON_SCHEMA,
  PROFILE_EXTRACT_SYSTEM,
  profileExtractUserMessage,
} from "../_shared/prompts/profileExtract.ts";
import { detectLangSimple, pickLanguage } from "../_shared/utils/locale.ts";
import { loggerForRequest } from "../_shared/utils/logger.ts";

const MAX_CV_CHARS = 30_000;

type ExtractedProfile = {
  fullName: string;
  headline: string;
  location: string;
  shortBio: string;
  longBio: string;
  skills: string[];
};

Deno.serve(async (req) => {
  const pf = handlePreflight(req);
  if (pf) return pf;
  const log = loggerForRequest(req, "extract-profile-from-cv");
  try {
    if (req.method !== "POST") {
      throw new AppError("METHOD_NOT_ALLOWED", "POST required", 405);
    }
    const user = await requireUser(req);
    const body = await parseJsonBody(req, ExtractProfileFromCvSchema);
    const supabase = getServiceClient();

    // Pick the source document: explicit id if provided, otherwise the most
    // recent successfully-processed upload that has an extraction row.
    let docQuery = supabase
      .from("uploaded_documents")
      .select(
        "id, original_filename, created_at, processing_status, document_extractions!inner(extraction_text, language)",
      )
      .eq("user_id", user.id)
      .eq("processing_status", "completed")
      .order("created_at", { ascending: false })
      .limit(1);

    if (body.documentId) {
      docQuery = docQuery.eq("id", body.documentId);
    }

    const { data: doc, error } = await docQuery.maybeSingle();
    if (error) throw error;
    if (!doc) {
      throw new AppError(
        "NO_PROCESSED_CV",
        "No processed CV found. Please upload a CV and wait for processing to complete.",
        404,
      );
    }

    const extractions = (doc as any).document_extractions as
      | { extraction_text: string | null; language: string | null }[]
      | { extraction_text: string | null; language: string | null }
      | null;
    const extraction = Array.isArray(extractions) ? extractions[0] : extractions;
    const cvText = (extraction?.extraction_text ?? "").trim();
    if (cvText.length < 80) {
      throw new AppError(
        "EMPTY_CV_TEXT",
        "Selected CV has no extractable text content.",
        422,
      );
    }

    const truncated = cvText.length > MAX_CV_CHARS
      ? cvText.slice(0, MAX_CV_CHARS)
      : cvText;

    const language = pickLanguage(
      body.language,
      extraction?.language ?? detectLangSimple(truncated),
      "en",
    ) as "en" | "nl" | "ar";

    const result = await chatStructured<ExtractedProfile>(
      "profile_extract",
      PROFILE_EXTRACT_JSON_SCHEMA,
      [
        { role: "system", content: PROFILE_EXTRACT_SYSTEM(language) },
        { role: "user", content: profileExtractUserMessage(truncated) },
      ],
      { temperature: 0.1, maxTokens: 1500, userId: user.id },
    );

    const r = result.object;
    log.info("extracted", {
      documentId: (doc as any).id,
      skills: r.skills?.length ?? 0,
    });

    return respond(req, {
      sourceDocumentId: (doc as any).id,
      sourceFilename: (doc as any).original_filename,
      language,
      profile: {
        fullName: r.fullName ?? "",
        headline: r.headline ?? "",
        location: r.location ?? "",
        shortBio: r.shortBio ?? "",
        longBio: r.longBio ?? "",
        skills: Array.isArray(r.skills) ? r.skills.filter((s) => typeof s === "string" && s.trim().length > 0) : [],
      },
      modelUsed: result.modelUsed,
    });
  } catch (err) {
    log.error("failed", { error: (err as Error).message });
    return respondError(req, err);
  }
});
