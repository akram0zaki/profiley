// Public persona chat endpoint. Rate-limited per visitor session and per IP.

import { handlePreflight } from "../_shared/utils/cors.ts";
import { respond, respondError, AppError } from "../_shared/utils/errors.ts";
import { getServiceClient } from "../_shared/db/serviceClient.ts";
import { parseJsonBody } from "../_shared/validation/parse.ts";
import { ChatPersonaSchema } from "../_shared/validation/schemas.ts";
import { rateLimit, visitorSessionFromHeader, clientIp, hashIp } from "../_shared/utils/rateLimit.ts";
import { retrieveKnowledge } from "../_shared/rag/retrieveKnowledge.ts";
import { buildContext } from "../_shared/rag/buildContext.ts";
import { chat } from "../_shared/ai/capabilities/chat.ts";
import { moderate } from "../_shared/ai/capabilities/moderation.ts";
import { PERSONA_SYSTEM, personaUserMessage } from "../_shared/prompts/personaChat.ts";
import { PERSONA_CHAT_PROMPT_VERSION } from "../_shared/prompts/versions.ts";
import { detectLangSimple, pickLanguage } from "../_shared/utils/locale.ts";
import { loggerForRequest } from "../_shared/utils/logger.ts";

Deno.serve(async (req) => {
  const pf = handlePreflight(req);
  if (pf) return pf;
  const log = loggerForRequest(req, "chat-persona");
  try {
    if (req.method !== "POST") throw new AppError("METHOD_NOT_ALLOWED", "POST required", 405);
    const body = await parseJsonBody(req, ChatPersonaSchema);
    const supabase = getServiceClient();

    // Resolve profile via slug.
    const { data: profile, error: pErr } = await supabase
      .from("public_profile_view")
      .select("id, user_id, full_name, allow_public_chat")
      .eq("slug", body.slug)
      .maybeSingle();
    if (pErr || !profile) throw new AppError("PROFILE_NOT_FOUND", "Profile not found", 404);
    if (!profile.allow_public_chat) throw new AppError("CHAT_DISABLED", "Owner has disabled public chat", 403);

    // Rate limits.
    const session = body.visitorSessionId ?? visitorSessionFromHeader(req);
    const ipHash = hashIp(clientIp(req) ?? "unknown");
    await rateLimit({ key: `chat:session:${profile.id}:${session}`, windowSeconds: 3600, max: 20 });
    await rateLimit({ key: `chat:ip:${profile.id}:${ipHash}`, windowSeconds: 3600, max: 60 });

    let safety = { flagged: false, categories: [] as string[] };

    // Moderation (input).
    try {
      const m = await moderate("chat-input", body.message, {
        userId: null,
        profileId: profile.id,
        policyContext: {
          audience: "public_recruiter",
          surface: "chat",
          stage: "input",
        },
      });
      safety = { flagged: m.flagged, categories: m.categories };
      if (m.flagged) {
        await supabase.from("moderation_events").insert({
          profile_id: profile.id,
          event_type: "input_blocked",
          input_excerpt: body.message.slice(0, 200),
        });
        throw new AppError("INPUT_BLOCKED", "Input violates content policy", 400, { categories: m.categories });
      }
    } catch (e) {
      if (e instanceof AppError) throw e;
      log.warn("moderation unavailable, fail-open", {
        error: e instanceof Error ? e.message : String(e),
      });
    }

    // Pick language: explicit > detected > profile fallback.
    const language = pickLanguage(
      body.language,
      detectLangSimple(body.message),
      "en",
    ) as "en" | "nl" | "ar";

    // Retrieve.
    const chunks = await retrieveKnowledge(profile.user_id, body.message, {
      onlyPublic: true,
      featureKey: "chat-retrieve",
    });
    const ctx = buildContext(chunks);

    // Conversation: create or reuse.
    let conversationId = body.conversationId ?? null;
    if (!conversationId) {
      const { data: conv } = await supabase.from("conversations").insert({
        profile_id: profile.id,
        visitor_session_id: session,
        initiated_by: "visitor",
        mode: "chat",
        language,
      }).select("id").single();
      conversationId = conv?.id ?? null;
    }

    // Persist user message.
    if (conversationId) {
      await supabase.from("messages").insert({
        conversation_id: conversationId,
        role: "user",
        content: body.message,
      });
    }

    // Generate.
    const sys = PERSONA_SYSTEM({ fullName: profile.full_name, language, ownerMode: false });
    const userMsg = personaUserMessage(body.message, ctx.text || "(no relevant excerpts found)");
    const out = await chat(
      "persona-chat",
      [
        { role: "system", content: sys },
        { role: "user", content: userMsg },
      ],
      {
        temperature: 0.4,
        maxTokens: 700,
        profileId: profile.id,
        promptVersion: PERSONA_CHAT_PROMPT_VERSION,
        safety,
        policyContext: {
          audience: "public_recruiter",
          surface: "chat",
        },
      },
    );

    // Persist assistant message.
    if (conversationId) {
      await supabase.from("messages").insert({
        conversation_id: conversationId,
        role: "assistant",
        content: out.text,
        retrieval_context: { citations: ctx.citations },
        model_used: out.modelUsed,
      });
    }

    return respond(req, {
      conversationId,
      message: out.text,
      citations: ctx.citations,
      modelUsed: out.modelUsed,
      language,
    });
  } catch (err) {
    log.error("failed", err);
    return respondError(req, err);
  }
});
