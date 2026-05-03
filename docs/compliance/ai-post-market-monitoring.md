# AI Post-Market Monitoring

Last updated: 2026-05-03

Profiley's monitoring plan relies on repo-backed telemetry and operator review.

## Signals already available

- `moderation_events` for blocked or reviewed prompts
- `ai_call_logs` for provider, model, token, and error patterns
- `job_fit_analyses` for sampled quality review of real outputs
- `recruiter_contacts` and direct support emails for complaints or correction requests
- frontend notices and settings flows that may drive support requests

## Review cadence

- Weekly: scan errors, provider failures, and moderation spikes
- Monthly: manually review a small sample of recruiter chat and job-fit outputs for factuality, tone, and unsupported claims
- Quarterly: review risk register, intended-purpose doc, and vendor/transfer documents

## Triggered review

Start an immediate review when:

- a user reports a harmful or fabricated recruiter-facing answer
- a provider/model change materially shifts output behaviour
- moderation events spike unexpectedly
- deletion or retention jobs fail in ways that affect AI-related data