// Extracts structured profile fields (name, headline, bio, skills, …) from
// the user's processed CVs. Does NOT persist anything — the frontend uses
// the result to prefill the profile form for review/editing.
//
// When no specific documentId is provided we feed the model up to the most
// recently uploaded N processed CVs (newest-first) so it can prefer values
// from the candidate's latest résumé while still merging accumulating facts
// (skills) across versions.

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
  type CvSource,
} from "../_shared/prompts/profileExtract.ts";
import { detectLangSimple, pickLanguage } from "../_shared/utils/locale.ts";
import { loggerForRequest } from "../_shared/utils/logger.ts";

const MAX_TOTAL_CHARS = 30_000;
const MAX_PER_CV_CHARS = 12_000;
const MAX_CVS = 5;

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

    // Pick the source documents: explicit id if provided (single CV), else
    // the most recently uploaded successfully-processed CVs (newest-first).
    let docQuery = supabase
      .from("uploaded_documents")
      .select(
        "id, original_filename, created_at, processing_status, document_extractions!inner(extraction_text, language)",
      )
      .eq("user_id", user.id)
      .eq("processing_status", "completed")
      .order("created_at", { ascending: false });

    if (body.documentId) {
      docQuery = docQuery.eq("id", body.documentId).limit(1);
    } else {
      docQuery = docQuery.limit(MAX_CVS);
    }

    const { data: docs, error } = await docQuery;
    if (error) throw error;
    if (!docs || docs.length === 0) {
      throw new AppError(
        "NO_PROCESSED_CV",
        "No processed CV found. Please upload a CV and wait for processing to complete.",
        404,
      );
    }

    type DocRow = {
      id: string;
      original_filename: string | null;
      created_at: string;
      document_extractions:
        | { extraction_text: string | null; language: string | null }[]
        | { extraction_text: string | null; language: string | null }
        | null;
    };

    const sources: CvSource[] = [];
    let totalChars = 0;
    let primaryLanguage: string | null = null;
    for (const raw of docs as DocRow[]) {
      const extractions = raw.document_extractions;
      const extraction = Array.isArray(extractions) ? extractions[0] : extractions;
      const text = (extraction?.extraction_text ?? "").trim();
      if (text.length < 80) continue;
      const sliced = text.length > MAX_PER_CV_CHARS ? text.slice(0, MAX_PER_CV_CHARS) : text;
      // Reserve total budget across CVs; stop adding once full.
      const remaining = MAX_TOTAL_CHARS - totalChars;
      if (remaining <= 200) break;
      const finalText = sliced.length > remaining ? sliced.slice(0, remaining) : sliced;
      sources.push({
        filename: raw.original_filename ?? "cv",
        uploadedAt: raw.created_at,
        text: finalText,
      });
      totalChars += finalText.length;
      if (!primaryLanguage) primaryLanguage = extraction?.language ?? null;
    }

    if (sources.length === 0) {
      throw new AppError(
        "EMPTY_CV_TEXT",
        "Selected CV has no extractable text content.",
        422,
      );
    }

    const language = pickLanguage(
      body.language,
      primaryLanguage ?? detectLangSimple(sources[0].text),
      "en",
    ) as "en" | "nl" | "ar";

    const result = await chatStructured<ExtractedProfile>(
      "profile_extract",
      PROFILE_EXTRACT_JSON_SCHEMA,
      [
        { role: "system", content: PROFILE_EXTRACT_SYSTEM(language) },
        { role: "user", content: profileExtractUserMessage(sources) },
      ],
      { temperature: 0.1, maxTokens: 1500, userId: user.id },
    );

    const r = result.object;
    const primaryDoc = docs[0] as DocRow;
    log.info("extracted", {
      primaryDocumentId: primaryDoc.id,
      cvCount: sources.length,
      skills: r.skills?.length ?? 0,
    });

    return respond(req, {
      sourceDocumentId: primaryDoc.id,
      sourceFilename: primaryDoc.original_filename,
      sourceDocumentIds: sources.map((_, i) => (docs[i] as DocRow).id),
      cvCount: sources.length,
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
