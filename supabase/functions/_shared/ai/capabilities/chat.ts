// Chat capability façade: resolve provider, call adapter, log usage.

import { resolveModel } from "../router.ts";
import { ChatMessage, ChatSettings } from "../types.ts";
import { openaiChat } from "../providers/openai.ts";
import { geminiChat } from "../providers/gemini.ts";
import { mistralChat } from "../providers/mistral.ts";
import { logCall } from "../log.ts";

function adapterFor(provider: string) {
  switch (provider) {
    case "openai":
      return openaiChat;
    case "gemini":
      return geminiChat;
    case "mistral":
      return mistralChat;
    default:
      return openaiChat;
  }
}

export async function chat(
  featureKey: string,
  messages: ChatMessage[],
  opts: ChatSettings & {
    requestId?: string;
    userId?: string | null;
    profileId?: string | null;
  } = {},
) {
  const resolved = await resolveModel(featureKey, "chat");
  const adapter = adapterFor(resolved.provider);
  const start = Date.now();
  try {
    const out = await adapter.generateResponse(messages, {
      ...opts,
      model: opts.model ?? resolved.modelKey,
    });
    await logCall({
      featureKey,
      capability: "chat",
      provider: resolved.provider,
      modelKey: resolved.modelKey,
      latencyMs: Date.now() - start,
      promptTokens: out.usage?.prompt_tokens,
      completionTokens: out.usage?.completion_tokens,
      totalTokens: out.usage?.total_tokens,
      fallbackTriggered: resolved.fallbackTriggered,
      requestId: opts.requestId,
      userId: opts.userId ?? null,
      profileId: opts.profileId ?? null,
    });
    return out;
  } catch (err) {
    await logCall({
      featureKey,
      capability: "chat",
      provider: resolved.provider,
      modelKey: resolved.modelKey,
      latencyMs: Date.now() - start,
      errorCode: (err as Error).message?.slice(0, 200) ?? "ERROR",
      fallbackTriggered: resolved.fallbackTriggered,
      requestId: opts.requestId,
      userId: opts.userId ?? null,
      profileId: opts.profileId ?? null,
    });
    throw err;
  }
}

export async function chatStructured<T>(
  featureKey: string,
  schema: unknown,
  messages: ChatMessage[],
  opts: ChatSettings & {
    requestId?: string;
    userId?: string | null;
    profileId?: string | null;
  } = {},
) {
  const resolved = await resolveModel(featureKey, "chat");
  const adapter = adapterFor(resolved.provider);
  const start = Date.now();
  try {
    const out = await adapter.generateStructuredObject<T>(schema, messages, {
      ...opts,
      model: opts.model ?? resolved.modelKey,
    });
    await logCall({
      featureKey,
      capability: "chat",
      provider: resolved.provider,
      modelKey: resolved.modelKey,
      latencyMs: Date.now() - start,
      promptTokens: out.usage?.prompt_tokens,
      completionTokens: out.usage?.completion_tokens,
      totalTokens: out.usage?.total_tokens,
      fallbackTriggered: resolved.fallbackTriggered,
      requestId: opts.requestId,
      userId: opts.userId ?? null,
      profileId: opts.profileId ?? null,
    });
    return out;
  } catch (err) {
    await logCall({
      featureKey,
      capability: "chat",
      provider: resolved.provider,
      modelKey: resolved.modelKey,
      latencyMs: Date.now() - start,
      errorCode: (err as Error).message?.slice(0, 200) ?? "ERROR",
      fallbackTriggered: resolved.fallbackTriggered,
      requestId: opts.requestId,
      userId: opts.userId ?? null,
      profileId: opts.profileId ?? null,
    });
    throw err;
  }
}
