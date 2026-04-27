// Capability interfaces and shared types for the AI router.

export type Capability = "chat" | "embeddings" | "stt" | "tts" | "moderation";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type ChatSettings = {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  responseSchema?: unknown; // JSON schema or zod-derived
  responseFormat?: "text" | "json_object";
};

export type ChatResponse = {
  text: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  modelUsed: string;
};

export interface ChatAdapter {
  name: string;
  generateResponse(messages: ChatMessage[], settings?: ChatSettings): Promise<ChatResponse>;
  generateStructuredObject<T>(
    schema: unknown,
    messages: ChatMessage[],
    settings?: ChatSettings,
  ): Promise<{ object: T; modelUsed: string; usage?: ChatResponse["usage"] }>;
}

export interface EmbeddingAdapter {
  name: string;
  embedText(text: string, model?: string): Promise<{ vector: number[]; modelUsed: string }>;
  embedBatch(texts: string[], model?: string): Promise<{ vectors: number[][]; modelUsed: string }>;
}

export interface ModerationAdapter {
  name: string;
  check(text: string, model?: string): Promise<{
    flagged: boolean;
    categories: string[];
    modelUsed: string;
  }>;
}

export interface SttAdapter {
  name: string;
  transcribe(audio: Blob, opts?: { language?: string; model?: string }): Promise<{
    text: string;
    language?: string;
    modelUsed: string;
  }>;
}

export interface TtsAdapter {
  name: string;
  synthesize(text: string, opts?: { voice?: string; model?: string }): Promise<{
    audio: Uint8Array;
    modelUsed: string;
  }>;
}

export type ResolvedModel = {
  provider: string;
  modelKey: string;
  capability: Capability;
  configJson: Record<string, unknown>;
  fallbackTriggered: boolean;
};
