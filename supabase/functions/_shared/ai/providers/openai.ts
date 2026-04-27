// OpenAI adapter for chat, embeddings, moderation, STT, TTS.

import {
  ChatAdapter,
  ChatMessage,
  ChatResponse,
  ChatSettings,
  EmbeddingAdapter,
  ModerationAdapter,
  SttAdapter,
  TtsAdapter,
} from "../types.ts";

const BASE = Deno.env.get("OPENAI_BASE_URL") ?? "https://api.openai.com/v1";

function key(): string {
  const k = Deno.env.get("OPENAI_API_KEY");
  if (!k) throw new Error("OPENAI_API_KEY not configured");
  return k;
}

async function jsonRequest(path: string, body: unknown): Promise<any> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${key()}`,
      "Content-Type": "application/json",
      ...(Deno.env.get("OPENAI_ORG_ID")
        ? { "OpenAI-Organization": Deno.env.get("OPENAI_ORG_ID")! }
        : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI ${path} ${res.status}: ${text}`);
  }
  return res.json();
}

export const openaiChat: ChatAdapter = {
  name: "openai",
  async generateResponse(
    messages: ChatMessage[],
    settings: ChatSettings = {},
  ): Promise<ChatResponse> {
    const model = settings.model ?? "gpt-4o-mini";
    const body: Record<string, unknown> = {
      model,
      messages,
      temperature: settings.temperature ?? 0.2,
    };
    if (settings.maxTokens) body.max_tokens = settings.maxTokens;
    if (settings.responseFormat === "json_object") {
      body.response_format = { type: "json_object" };
    }
    const json = await jsonRequest("/chat/completions", body);
    const choice = json.choices?.[0];
    return {
      text: choice?.message?.content ?? "",
      usage: json.usage,
      modelUsed: `openai:${model}`,
    };
  },
  async generateStructuredObject<T>(
    schema: unknown,
    messages: ChatMessage[],
    settings: ChatSettings = {},
  ) {
    const model = settings.model ?? "gpt-4o-mini";
    const body: Record<string, unknown> = {
      model,
      messages,
      temperature: settings.temperature ?? 0.1,
      response_format: schema
        ? { type: "json_schema", json_schema: { name: "result", schema, strict: true } }
        : { type: "json_object" },
    };
    const json = await jsonRequest("/chat/completions", body);
    const text = json.choices?.[0]?.message?.content ?? "{}";
    let object: T;
    try {
      object = JSON.parse(text) as T;
    } catch {
      object = {} as T;
    }
    return { object, modelUsed: `openai:${model}`, usage: json.usage };
  },
};

export const openaiEmbeddings: EmbeddingAdapter = {
  name: "openai",
  async embedText(text: string, model?: string) {
    const m = model ?? "text-embedding-3-small";
    const json = await jsonRequest("/embeddings", { model: m, input: text });
    return { vector: json.data[0].embedding as number[], modelUsed: `openai:${m}` };
  },
  async embedBatch(texts: string[], model?: string) {
    const m = model ?? "text-embedding-3-small";
    const json = await jsonRequest("/embeddings", { model: m, input: texts });
    return {
      vectors: (json.data as Array<{ embedding: number[] }>).map((d) => d.embedding),
      modelUsed: `openai:${m}`,
    };
  },
};

export const openaiModeration: ModerationAdapter = {
  name: "openai",
  async check(text: string, model?: string) {
    const m = model ?? "omni-moderation-latest";
    const json = await jsonRequest("/moderations", { model: m, input: text });
    const r = json.results?.[0];
    const flagged = !!r?.flagged;
    const categories = r?.categories
      ? Object.keys(r.categories).filter((k) => r.categories[k])
      : [];
    return { flagged, categories, modelUsed: `openai:${m}` };
  },
};

export const openaiStt: SttAdapter = {
  name: "openai",
  async transcribe(audio: Blob, opts = {}) {
    const m = opts.model ?? "whisper-1";
    const form = new FormData();
    form.append("file", audio, "audio.webm");
    form.append("model", m);
    if (opts.language) form.append("language", opts.language);
    const res = await fetch(`${BASE}/audio/transcriptions`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${key()}` },
      body: form,
    });
    if (!res.ok) throw new Error(`OpenAI transcription ${res.status}: ${await res.text()}`);
    const json = await res.json();
    return { text: json.text ?? "", language: opts.language, modelUsed: `openai:${m}` };
  },
};

export const openaiTts: TtsAdapter = {
  name: "openai",
  async synthesize(text: string, opts = {}) {
    const m = opts.model ?? "tts-1";
    const res = await fetch(`${BASE}/audio/speech`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: m, input: text, voice: opts.voice ?? "alloy" }),
    });
    if (!res.ok) throw new Error(`OpenAI TTS ${res.status}: ${await res.text()}`);
    const buf = new Uint8Array(await res.arrayBuffer());
    return { audio: buf, modelUsed: `openai:${m}` };
  },
};
