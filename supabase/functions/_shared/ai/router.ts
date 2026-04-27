// Provider/model resolution: feature override → capability default → env fallback.

import { getServiceClient } from "../db/serviceClient.ts";
import { Capability, ResolvedModel } from "./types.ts";

const FALLBACKS: Record<Capability, { provider: string; modelKey: string }> = {
  chat: { provider: "openai", modelKey: "gpt-4o-mini" },
  embeddings: { provider: "openai", modelKey: "text-embedding-3-small" },
  moderation: { provider: "openai", modelKey: "omni-moderation-latest" },
  stt: { provider: "openai", modelKey: "whisper-1" },
  tts: { provider: "openai", modelKey: "tts-1" },
};

export async function resolveModel(
  featureKey: string | null,
  capability: Capability,
): Promise<ResolvedModel> {
  const supabase = getServiceClient();
  let fallbackTriggered = false;

  if (featureKey) {
    const { data } = await supabase
      .from("feature_model_assignments")
      .select(
        "provider_config_id, ai_provider_configs!inner(provider, model_key, is_active, config_json)",
      )
      .eq("feature_key", featureKey)
      .eq("capability", capability)
      .maybeSingle();

    const cfg = (data as any)?.ai_provider_configs;
    if (cfg && cfg.is_active) {
      return {
        provider: cfg.provider,
        modelKey: cfg.model_key,
        capability,
        configJson: cfg.config_json ?? {},
        fallbackTriggered: false,
      };
    }
  }

  const { data: defaultRow } = await supabase
    .from("ai_provider_configs")
    .select("provider, model_key, config_json")
    .eq("capability", capability)
    .eq("is_default", true)
    .eq("is_active", true)
    .maybeSingle();

  if (defaultRow) {
    return {
      provider: defaultRow.provider,
      modelKey: defaultRow.model_key,
      capability,
      configJson: (defaultRow.config_json as Record<string, unknown>) ?? {},
      fallbackTriggered: featureKey !== null,
    };
  }

  fallbackTriggered = true;
  const fb = FALLBACKS[capability];
  return {
    provider: fb.provider,
    modelKey: fb.modelKey,
    capability,
    configJson: {},
    fallbackTriggered,
  };
}
