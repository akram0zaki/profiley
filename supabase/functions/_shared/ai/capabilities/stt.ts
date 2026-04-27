import { resolveModel } from "../router.ts";
import { openaiStt } from "../providers/openai.ts";
import { logCall } from "../log.ts";

export async function transcribe(
  featureKey: string,
  audio: Blob,
  opts: { language?: string; requestId?: string; userId?: string | null } = {},
) {
  const resolved = await resolveModel(featureKey, "stt");
  const start = Date.now();
  try {
    const out = await openaiStt.transcribe(audio, {
      model: resolved.modelKey,
      language: opts.language,
    });
    await logCall({
      featureKey,
      capability: "stt",
      provider: resolved.provider,
      modelKey: resolved.modelKey,
      latencyMs: Date.now() - start,
      fallbackTriggered: resolved.fallbackTriggered,
      requestId: opts.requestId,
      userId: opts.userId ?? null,
    });
    return out;
  } catch (err) {
    await logCall({
      featureKey,
      capability: "stt",
      provider: resolved.provider,
      modelKey: resolved.modelKey,
      latencyMs: Date.now() - start,
      errorCode: (err as Error).message?.slice(0, 200) ?? "ERROR",
      fallbackTriggered: resolved.fallbackTriggered,
      requestId: opts.requestId,
      userId: opts.userId ?? null,
    });
    throw err;
  }
}
