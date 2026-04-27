// Voice transcription endpoint (gated by ENABLE_AVATAR_FOUNDATION).

import { handlePreflight } from "../_shared/utils/cors.ts";
import { respond, respondError, AppError } from "../_shared/utils/errors.ts";
import { requireUser } from "../_shared/auth/requireUser.ts";
import { transcribe } from "../_shared/ai/capabilities/stt.ts";

Deno.serve(async (req) => {
  const pf = handlePreflight(req);
  if (pf) return pf;
  try {
    if (Deno.env.get("ENABLE_AVATAR_FOUNDATION") !== "true") {
      throw new AppError("NOT_IMPLEMENTED", "Voice transcription is not enabled", 501);
    }
    if (req.method !== "POST") throw new AppError("METHOD_NOT_ALLOWED", "POST required", 405);
    const user = await requireUser(req);
    const ct = req.headers.get("content-type") ?? "";
    if (!ct.startsWith("audio/")) throw new AppError("BAD_CONTENT_TYPE", "Expected audio/* body", 400);
    const audio = await req.blob();
    const out = await transcribe("voice-stt", audio, { userId: user.id });
    return respond(req, out);
  } catch (err) {
    return respondError(req, err);
  }
});
