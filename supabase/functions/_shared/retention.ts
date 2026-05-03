export const RETENTION_WINDOWS_DAYS = {
  recruiter_visits: 90,
  recruiter_events: 180,
  ai_call_logs: 180,
  moderation_events: 365,
  job_fit_analyses: 365,
} as const;

export type RetentionTarget = keyof typeof RETENTION_WINDOWS_DAYS;

export function retentionCutoffIso(nowIso: string, days: number): string {
  const cutoff = new Date(nowIso);
  cutoff.setUTCDate(cutoff.getUTCDate() - days);
  return cutoff.toISOString();
}

export function buildRetentionCutoffs(nowIso: string): Record<RetentionTarget, string> {
  return {
    recruiter_visits: retentionCutoffIso(nowIso, RETENTION_WINDOWS_DAYS.recruiter_visits),
    recruiter_events: retentionCutoffIso(nowIso, RETENTION_WINDOWS_DAYS.recruiter_events),
    ai_call_logs: retentionCutoffIso(nowIso, RETENTION_WINDOWS_DAYS.ai_call_logs),
    moderation_events: retentionCutoffIso(nowIso, RETENTION_WINDOWS_DAYS.moderation_events),
    job_fit_analyses: retentionCutoffIso(nowIso, RETENTION_WINDOWS_DAYS.job_fit_analyses),
  };
}

export function isExpiredByRetention(createdAtIso: string, cutoffIso: string): boolean {
  return new Date(createdAtIso).getTime() <= new Date(cutoffIso).getTime();
}