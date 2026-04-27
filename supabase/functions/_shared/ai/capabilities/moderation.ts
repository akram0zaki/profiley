import { resolveModel } from "../router.ts";
import { openaiModeration } from "../providers/openai.ts";
import { logCall } from "../log.ts";

export async function moderate(
  featureKey: string,
  text: string,
  opts: { requestId?: string; userId?: string | null } = {},
) {
  const resolved = await resolveModel(featureKey, "moderation");
  const start = Date.now();
  try {
    const out = await openaiModeration.check(text, resolved.modelKey);
    await logCall({
      featureKey,
      capability: "moderation",
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
      capability: "moderation",
      provider: resolved.provider,
      modelKey: resolved.modelKey,
      latencyMs: Date.now() - start,
      errorCode: (err as Error).message?.slice(0, 200) ?? "ERROR",
      fallbackTriggered: resolved.fallbackTriggered,
      requestId: opts.requestId,
      userId: opts.userId ?? null,
    });
    // Fail-open on moderation outage; let caller decide.
    throw err;
  }
}
