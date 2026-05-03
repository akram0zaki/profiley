export const PUBLIC_JOB_FIT_ENABLED_KEY = "public_job_fit_enabled";

export function parseBooleanRuntimeSetting(
  value: string | null | undefined,
  defaultValue: boolean,
): boolean {
  if (value == null) return defaultValue;
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return defaultValue;
}

export async function getRuntimeSetting(
  supabase: any,
  key: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("runtime_settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();

  if (error) throw error;
  return typeof data?.value === "string" ? data.value : null;
}

export async function isPublicJobFitEnabled(supabase: any): Promise<boolean> {
  const value = await getRuntimeSetting(supabase, PUBLIC_JOB_FIT_ENABLED_KEY);
  return parseBooleanRuntimeSetting(value, true);
}