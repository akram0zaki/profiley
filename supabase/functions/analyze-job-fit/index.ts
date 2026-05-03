// Job-fit analysis: structured output JSON conforming to JOB_FIT_JSON_SCHEMA.

import { handlePreflight } from "../_shared/utils/cors.ts";
import { respond, respondError, AppError } from "../_shared/utils/errors.ts";
import { getServiceClient } from "../_shared/db/serviceClient.ts";
import { parseJsonBody } from "../_shared/validation/parse.ts";
import { AnalyzeJobFitSchema } from "../_shared/validation/schemas.ts";
import { rateLimit, visitorSessionFromHeader, clientIp, hashIp } from "../_shared/utils/rateLimit.ts";
import { retrieveKnowledge } from "../_shared/rag/retrieveKnowledge.ts";
import { buildContext } from "../_shared/rag/buildContext.ts";
import { chatStructured } from "../_shared/ai/capabilities/chat.ts";
import { moderate } from "../_shared/ai/capabilities/moderation.ts";
import { JOB_FIT_JSON_SCHEMA, JOB_FIT_SYSTEM, jobFitUserMessage } from "../_shared/prompts/jobFit.ts";
import { JOB_FIT_PROMPT_VERSION } from "../_shared/prompts/versions.ts";
import { detectLangSimple, pickLanguage } from "../_shared/utils/locale.ts";
import { loggerForRequest } from "../_shared/utils/logger.ts";
import { isPublicJobFitEnabled } from "../_shared/runtimeSettings.ts";

type JobFitResult = {
  fitBand: string;
  fitScore: number;
  strengths: string[];
  gaps: string[];
  risks: string[];
  transferableStrengths: string[];
  reasoningSummary: string;
  confidenceLabel: string;
  citations: Array<{ label: string; chunkId: string }>;
};

Deno.serve(async (req) => {
  const pf = handlePreflight(req);
  if (pf) return pf;
  const log = loggerForRequest(req, "analyze-job-fit");
  try {
    if (req.method !== "POST") throw new AppError("METHOD_NOT_ALLOWED", "POST required", 405);
    const body = await parseJsonBody(req, AnalyzeJobFitSchema);
    const supabase = getServiceClient();

    const { data: profile, error } = await supabase
      .from("public_profile_view")
      .select("id, user_id, full_name, allow_job_fit_analysis")
      .eq("slug", body.slug)
      .maybeSingle();
    if (error || !profile) throw new AppError("PROFILE_NOT_FOUND", "Profile not found", 404);
    if (!(await isPublicJobFitEnabled(supabase))) {
      throw new AppError("JOB_FIT_GLOBALLY_DISABLED", "Job-fit analysis is currently unavailable", 403);
    }
    if (!profile.allow_job_fit_analysis) {
      throw new AppError("JOB_FIT_DISABLED", "Owner disabled job-fit analysis", 403);
    }

    const session = body.visitorSessionId ?? visitorSessionFromHeader(req);
    const ipHash = hashIp(clientIp(req) ?? "unknown");
    await rateLimit({ key: `jobfit:session:${profile.id}:${session}`, windowSeconds: 3600, max: 5 });
    await rateLimit({ key: `jobfit:ip:${profile.id}:${ipHash}`, windowSeconds: 3600, max: 15 });

    const language = pickLanguage(
      body.language,
      detectLangSimple(body.jobDescription),
      "en",
    ) as "en" | "nl" | "ar";

    let safety = { flagged: false, categories: [] as string[] };
    try {
      const moderation = await moderate("job-fit-input", body.jobDescription, {
        profileId: profile.id,
        policyContext: {
          audience: "public_recruiter",
          surface: "job_fit",
          stage: "input",
        },
      });
      safety = { flagged: moderation.flagged, categories: moderation.categories };
      if (moderation.flagged) {
        await supabase.from("moderation_events").insert({
          profile_id: profile.id,
          event_type: "input_blocked",
          input_excerpt: body.jobDescription.slice(0, 200),
        });
        throw new AppError("INPUT_BLOCKED", "Job description violates content policy", 400, {
          categories: moderation.categories,
        });
      }
    } catch (err) {
      if (err instanceof AppError) throw err;
      log.warn("moderation unavailable, fail-open", {
        error: err instanceof Error ? err.message : String(err),
      });
    }

    const chunks = await retrieveKnowledge(profile.user_id, body.jobDescription, {
      onlyPublic: true,
      matchCount: 12,
      featureKey: "job-fit-retrieve",
    });
    const ctx = buildContext(chunks, { maxChars: 8000 });

    const result = await chatStructured<JobFitResult>(
      "job-fit",
      JOB_FIT_JSON_SCHEMA,
      [
        { role: "system", content: JOB_FIT_SYSTEM(language) },
        { role: "user", content: jobFitUserMessage(body.jobDescription, ctx.text || "(no excerpts)") },
      ],
      {
        temperature: 0.1,
        maxTokens: 1500,
        profileId: profile.id,
        promptVersion: JOB_FIT_PROMPT_VERSION,
        safety,
        policyContext: {
          audience: "public_recruiter",
          surface: "job_fit",
        },
      },
    );

    const r = result.object;
    // Persist analysis.
    const { data: row } = await supabase.from("job_fit_analyses").insert({
      profile_id: profile.id,
      visitor_session_id: session,
      job_title: body.jobTitle,
      company_name: body.companyName,
      job_description: body.jobDescription,
      fit_score: r.fitScore,
      fit_band: r.fitBand,
      strengths: r.strengths ?? [],
      gaps: r.gaps ?? [],
      risks: r.risks ?? [],
      transferable_strengths: r.transferableStrengths ?? [],
      reasoning_summary: r.reasoningSummary,
      confidence_label: r.confidenceLabel,
      citations: r.citations ?? [],
      model_used: result.modelUsed,
      prompt_version: JOB_FIT_PROMPT_VERSION,
      safety_flagged: safety.flagged,
      safety_categories: safety.categories,
    }).select("id").single();

    return respond(req, {
      analysisId: row?.id ?? null,
      ...r,
      modelUsed: result.modelUsed,
    });
  } catch (err) {
    log.error("failed", err);
    return respondError(req, err);
  }
});
