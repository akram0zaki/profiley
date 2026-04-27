import { resolveModel } from "../router.ts";
import { openaiEmbeddings } from "../providers/openai.ts";
import { logCall } from "../log.ts";

export async function embedText(
  featureKey: string,
  text: string,
  opts: { requestId?: string; userId?: string | null } = {},
) {
  const resolved = await resolveModel(featureKey, "embeddings");
  const start = Date.now();
  try {
    const out = await openaiEmbeddings.embedText(text, resolved.modelKey);
    await logCall({
      featureKey,
      capability: "embeddings",
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
      capability: "embeddings",
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

export async function embedBatch(
  featureKey: string,
  texts: string[],
  opts: { requestId?: string; userId?: string | null } = {},
) {
  const resolved = await resolveModel(featureKey, "embeddings");
  const start = Date.now();
  try {
    const out = await openaiEmbeddings.embedBatch(texts, resolved.modelKey);
    await logCall({
      featureKey,
      capability: "embeddings",
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
      capability: "embeddings",
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
