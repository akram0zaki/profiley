// Owner preview chat — same persona logic but no public visibility / no rate limit / pulls all chunks.

import { handlePreflight } from "../_shared/utils/cors.ts";
import { respond, respondError, AppError } from "../_shared/utils/errors.ts";
import { requireUser } from "../_shared/auth/requireUser.ts";
import { getServiceClient } from "../_shared/db/serviceClient.ts";
import { parseJsonBody } from "../_shared/validation/parse.ts";
import { TestPersonaChatSchema } from "../_shared/validation/schemas.ts";
import { retrieveKnowledge } from "../_shared/rag/retrieveKnowledge.ts";
import { buildContext } from "../_shared/rag/buildContext.ts";
import { chat } from "../_shared/ai/capabilities/chat.ts";
import { PERSONA_SYSTEM, personaUserMessage } from "../_shared/prompts/personaChat.ts";
import { PERSONA_CHAT_PROMPT_VERSION } from "../_shared/prompts/versions.ts";
import { detectLangSimple, pickLanguage } from "../_shared/utils/locale.ts";

Deno.serve(async (req) => {
  const pf = handlePreflight(req);
  if (pf) return pf;
  try {
    if (req.method !== "POST") throw new AppError("METHOD_NOT_ALLOWED", "POST required", 405);
    const user = await requireUser(req);
    const body = await parseJsonBody(req, TestPersonaChatSchema);
    const supabase = getServiceClient();

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id, user_id, full_name")
      .eq("user_id", user.id)
      .maybeSingle();
    if (error || !profile) throw new AppError("PROFILE_NOT_FOUND", "Profile not found", 404);

    const language = pickLanguage(body.language, detectLangSimple(body.message), "en") as "en" | "nl" | "ar";
    const chunks = await retrieveKnowledge(user.id, body.message, {
      onlyPublic: false,
      featureKey: "chat-retrieve",
    });
    const ctx = buildContext(chunks);

    let conversationId = body.conversationId ?? null;
    if (!conversationId) {
      const { data: conv } = await supabase.from("conversations").insert({
        profile_id: profile.id,
        initiated_by: "owner",
        mode: "preview",
        language,
      }).select("id").single();
      conversationId = conv?.id ?? null;
    }

    if (conversationId) {
      await supabase.from("messages").insert({
        conversation_id: conversationId,
        role: "user",
        content: body.message,
      });
    }

    const sys = PERSONA_SYSTEM({ fullName: profile.full_name, language, ownerMode: true });
    const out = await chat(
      "persona-chat",
      [
        { role: "system", content: sys },
        { role: "user", content: personaUserMessage(body.message, ctx.text || "(no excerpts)") },
      ],
      {
        temperature: 0.4,
        maxTokens: 700,
        profileId: profile.id,
        userId: user.id,
        promptVersion: PERSONA_CHAT_PROMPT_VERSION,
        policyContext: {
          audience: "owner_preview",
          surface: "chat_preview",
        },
      },
    );

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
    return respondError(req, err);
  }
});
