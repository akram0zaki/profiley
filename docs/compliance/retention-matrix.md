# Retention Matrix

Last updated: 2026-05-03

This matrix documents the retention rules that Profiley enforces in code for app-controlled data. It is an engineering control document, not legal advice.

| Table | Data category | Retention period | Purge mechanism | Justification | Exclusions / notes |
| --- | --- | --- | --- | --- | --- |
| `public.recruiter_visits` | Public-profile visit telemetry | 90 days | `process-retention-purge` edge function via pg_cron | Short operational analytics window is sufficient for traffic troubleshooting and abuse review | Deleted sooner if the owning profile is deleted |
| `public.recruiter_events` | Recruiter interaction analytics | 180 days | `process-retention-purge` edge function via pg_cron | Supports feature diagnostics and aggregated funnel review without indefinite retention | Deleted sooner if the owning profile is deleted |
| `public.ai_call_logs` | Provider/model usage and reliability logs | 180 days | `process-retention-purge` edge function via pg_cron | Covers billing review, abuse investigation, and provider troubleshooting | `user_id` / `profile_id` may already be null via FK `on delete set null` |
| `public.moderation_events` | Safety and abuse-enforcement events | 365 days | `process-retention-purge` edge function via pg_cron | Longer window supports incident review, repeated-abuse investigation, and moderation tuning | Deleted sooner if the owning profile is deleted or nulled by FK |
| `public.job_fit_analyses` | Recruiter-facing job-fit outputs | 365 days | `process-retention-purge` edge function via pg_cron | Retains recent output history for debugging and support without indefinite storage | Deleted sooner if the owning profile is deleted |

## Excluded from automatic retention purge

- `public.conversations` and `public.messages`: retained while the account remains active; current product behavior does not expose per-message deletion tooling.
- `public.uploaded_documents`, `public.document_extractions`, `public.knowledge_chunks`, `public.profiles`, `public.profile_preferences`, and `public.onboarding_answers`: retained until the user deletes the underlying content or the account deletion flow is completed.
- Provider-managed backups: not enforceable directly from this repo. Public legal copy avoids promising an exact backup duration.