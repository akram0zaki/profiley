// Mistral chat adapter (minimal).

import { ChatAdapter, ChatMessage, ChatResponse, ChatSettings } from "../types.ts";

const BASE = "https://api.mistral.ai/v1";

function key(): string {
  const k = Deno.env.get("MISTRAL_API_KEY");
  if (!k) throw new Error("MISTRAL_API_KEY not configured");
  return k;
}

export const mistralChat: ChatAdapter = {
  name: "mistral",
  async generateResponse(
    messages: ChatMessage[],
    settings: ChatSettings = {},
  ): Promise<ChatResponse> {
    const model = settings.model ?? "mistral-large-latest";
    const res = await fetch(`${BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: settings.temperature ?? 0.2,
        max_tokens: settings.maxTokens,
        response_format: settings.responseFormat === "json_object"
          ? { type: "json_object" }
          : undefined,
      }),
    });
    if (!res.ok) throw new Error(`Mistral ${res.status}: ${await res.text()}`);
    const json = await res.json();
    return {
      text: json.choices?.[0]?.message?.content ?? "",
      usage: json.usage,
      modelUsed: `mistral:${model}`,
    };
  },
  async generateStructuredObject<T>(
    _schema: unknown,
    messages: ChatMessage[],
    settings: ChatSettings = {},
  ) {
    const r = await this.generateResponse(messages, {
      ...settings,
      responseFormat: "json_object",
    });
    let object: T;
    try {
      object = JSON.parse(r.text) as T;
    } catch {
      object = {} as T;
    }
    return { object, modelUsed: r.modelUsed, usage: r.usage };
  },
};
