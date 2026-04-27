import { resolveModel } from "../router.ts";
import { openaiTts } from "../providers/openai.ts";
import { logCall } from "../log.ts";

export async function synthesize(
  featureKey: string,
  text: string,
  opts: { voice?: string; requestId?: string; userId?: string | null } = {},
) {
  const resolved = await resolveModel(featureKey, "tts");
  const start = Date.now();
  try {
    const out = await openaiTts.synthesize(text, {
      model: resolved.modelKey,
      voice: opts.voice ?? (resolved.configJson?.voice as string | undefined),
    });
    await logCall({
      featureKey,
      capability: "tts",
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
      capability: "tts",
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
