# Security Measures

Last updated: 2026-05-03

This document lists security measures evidenced in the repo today.

## Technical controls

- Supabase row-level security on user-scoped tables
- Signed upload URLs for storage writes
- Public/private profile gating through `public_visibility` and feature toggles
- Manual JWT validation in edge functions with explicit auth checks
- `X-Cron-Secret` verification for cron-triggered functions
- Provider and moderation logging for safety and troubleshooting
- Content moderation and prompt guardrails in AI flows
- Encrypted transport provided by Supabase / Cloudflare managed services

## Operational controls

- Workspace-first migrations and edge-function definitions
- Secrets stored in gitignored env files and deployed through workspace workflows
- Retention purge and account deletion processors scheduled through `pg_cron`
- Compliance docs and runbooks kept in-repo as docs-as-code

## Product controls

- Public profile publication is opt-in
- Users can disable public chat, job-fit analysis, contact form, and citations
- Self-service account deletion with a 30-day cancellation window
- Legal acceptance is versioned and stored with timestamps and source

## Known limitations

- No formal external certification is claimed
- Provider-managed backups are outside direct repo enforcement
- No dedicated admin case-management UI yet for privacy requests