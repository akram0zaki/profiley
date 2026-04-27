// Google Gemini chat adapter (minimal). Embeddings/STT/TTS not implemented at MVP.

import { ChatAdapter, ChatMessage, ChatResponse, ChatSettings } from "../types.ts";

const BASE = "https://generativelanguage.googleapis.com/v1beta";

function key(): string {
  const k = Deno.env.get("GOOGLE_GEMINI_API_KEY");
  if (!k) throw new Error("GOOGLE_GEMINI_API_KEY not configured");
  return k;
}

function toContents(messages: ChatMessage[]) {
  const system = messages
    .filter((m) => m.role === "system")
    .map((m) => m.content).join("\n\n") || undefined;
  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));
  return { system_instruction: system ? { parts: [{ text: system }] } : undefined, contents };
}

export const geminiChat: ChatAdapter = {
  name: "gemini",
  async generateResponse(
    messages: ChatMessage[],
    settings: ChatSettings = {},
  ): Promise<ChatResponse> {
    const model = settings.model ?? "gemini-1.5-pro";
    const { contents, system_instruction } = toContents(messages);
    const res = await fetch(
      `${BASE}/models/${model}:generateContent?key=${key()}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          systemInstruction: system_instruction,
          generationConfig: {
            temperature: settings.temperature ?? 0.2,
            maxOutputTokens: settings.maxTokens,
          },
        }),
      },
    );
    if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
    const json = await res.json();
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    return { text, modelUsed: `gemini:${model}` };
  },
  async generateStructuredObject<T>(
    _schema: unknown,
    messages: ChatMessage[],
    settings: ChatSettings = {},
  ) {
    // Gemini supports response_mime_type=application/json; we lean on prompt for schema.
    const r = await this.generateResponse(messages, { ...settings });
    let object: T;
    try {
      object = JSON.parse(r.text) as T;
    } catch {
      object = {} as T;
    }
    return { object, modelUsed: r.modelUsed };
  },
};
