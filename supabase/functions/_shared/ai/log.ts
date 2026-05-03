// Logs each AI call to ai_call_logs.

import { getServiceClient } from "../db/serviceClient.ts";
import { Capability } from "./types.ts";

export type CallLog = {
  featureKey: string | null;
  capability: Capability;
  provider: string;
  modelKey: string;
  latencyMs: number;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  errorCode?: string | null;
  fallbackTriggered?: boolean;
  requestId?: string;
  userId?: string | null;
  profileId?: string | null;
  promptVersion?: string | null;
  safetyFlagged?: boolean;
  safetyCategories?: string[];
  policyContext?: Record<string, unknown>;
};

export async function logCall(entry: CallLog): Promise<void> {
  try {
    const supabase = getServiceClient();
    await supabase.from("ai_call_logs").insert({
      feature_key: entry.featureKey,
      capability: entry.capability,
      provider: entry.provider,
      model_key: entry.modelKey,
      latency_ms: entry.latencyMs,
      prompt_tokens: entry.promptTokens,
      completion_tokens: entry.completionTokens,
      total_tokens: entry.totalTokens,
      error_code: entry.errorCode ?? null,
      fallback_triggered: entry.fallbackTriggered ?? false,
      request_id: entry.requestId,
      user_id: entry.userId ?? null,
      profile_id: entry.profileId ?? null,
      prompt_version: entry.promptVersion ?? null,
      safety_flagged: entry.safetyFlagged ?? false,
      safety_categories: entry.safetyCategories ?? [],
      policy_context: entry.policyContext ?? {},
    });
  } catch {
    // Never fail the request because logging failed.
  }
}
