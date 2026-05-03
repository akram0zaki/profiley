# Production Synchronization Tracker - Compliance Foundation

## Overview
This document tracks the database migrations and edge functions that need to be deployed to production for the current compliance foundation work already implemented in the workspace.

**Feature Description:** Versioned legal acceptance, self-service account deletion with delayed purge, retention enforcement, self-service data export, and recruiter-AI hardening controls for the compliance baseline.

**Source Commits:**
- Workspace changes currently uncommitted at tracker creation time

**Status:** 🚧 In Development

---

## 🗄️ Database Migrations Required

### New Migrations (Apply in Order)
```sql
supabase/migrations/0029_legal_acceptance_versions.sql
supabase/migrations/0030_account_deletion_requests.sql
supabase/migrations/0031_retention_purge.sql
supabase/migrations/0032_ai_audit_controls.sql
supabase/migrations/0033_backfill_runtime_function_urls.sql
```

### Migration Descriptions

#### Legal Acceptance
1. **0029_legal_acceptance_versions.sql**
   - **Purpose**: Adds versioned legal-acceptance fields to `public.app_users` so terms and privacy acknowledgement are auditable per published version.
   - **Tables**: `public.app_users`
   - **Policies**: No new RLS policies; extends existing user record schema
   - **Critical**: Yes - required before deploying `accept-legal-documents` or enabling the legal acceptance gate in production

#### Account Deletion Lifecycle
2. **0030_account_deletion_requests.sql**
   - **Purpose**: Adds deferred account-deletion state, supporting indexes, and the hourly cron trigger that calls `process-account-deletions` through `public.runtime_settings`.
   - **Tables**: `public.app_users`, `public.runtime_settings`, cron metadata
   - **Policies**: No new RLS policies; relies on service-role edge functions and existing cascades
   - **Critical**: Yes - required before deploying account-deletion request/cancel flows to production

#### Retention Enforcement
3. **0031_retention_purge.sql**
   - **Purpose**: Adds retention-purge indexes and the daily cron trigger that calls `process-retention-purge` through `public.runtime_settings`.
   - **Tables**: `public.recruiter_visits`, `public.recruiter_events`, `public.runtime_settings`, cron metadata
   - **Policies**: No new RLS policies; purge runs through service-role edge execution
   - **Critical**: Yes - required before production can truthfully rely on the enforced retention windows

#### Export + AI Audit Controls
4. **0032_ai_audit_controls.sql**
  - **Purpose**: Adds prompt-version and safety metadata columns for recruiter-facing AI auditability and seeds the global `public_job_fit_enabled` runtime setting.
  - **Tables**: `public.ai_call_logs`, `public.job_fit_analyses`, `public.runtime_settings`
  - **Policies**: No new RLS policies; extends existing admin-only / service-role access surfaces
  - **Critical**: Yes - required before deploying the export and P2 hardening follow-up safely to production

#### Runtime URL Backfill
5. **0033_backfill_runtime_function_urls.sql**
  - **Purpose**: Backfills `account_deletions_url` and `retention_purge_url` from the existing `process_document_url` so cron endpoints stay environment-specific without hardcoded project refs in repo SQL.
  - **Tables**: `public.runtime_settings`
  - **Policies**: No new RLS policies; operational backfill only
  - **Critical**: Yes - required for environments that already have `process_document_url` but are missing the newer cron target URLs

---

## ⚡ Edge Functions to Deploy/Update

### New Edge Functions
```
✅ NEW: accept-legal-documents (v1)
✅ NEW: request-account-deletion (v1)
✅ NEW: cancel-account-deletion (v1)
✅ NEW: process-account-deletions (v1)
✅ NEW: process-retention-purge (v1)
✅ NEW: export-user-data (v1)
```

- **accept-legal-documents**
  - **Purpose**: Persists current terms/privacy acceptance timestamps, versions, and source for the authenticated user
  - **Authentication**: JWT required
  - **Dependencies**: `public.app_users`, shared legal version constants, migration `0029`

- **request-account-deletion**
  - **Purpose**: Schedules account deletion, stores the 30-day due date, and hides the public profile immediately
  - **Authentication**: JWT required
  - **Dependencies**: `public.app_users`, `public.profiles`, shared account-deletion helpers, migration `0030`

- **cancel-account-deletion**
  - **Purpose**: Cancels a pending deletion request before it becomes due and restores prior public visibility when appropriate
  - **Authentication**: JWT required
  - **Dependencies**: `public.app_users`, `public.profiles`, shared account-deletion helpers, migration `0030`

- **process-account-deletions**
  - **Purpose**: Hourly cron-driven processor that removes storage artifacts and deletes due `auth.users` records
  - **Authentication**: Anonymous gateway access with `X-Cron-Secret`; deploy with `--no-verify-jwt`
  - **Dependencies**: `public.app_users`, `public.uploaded_documents`, `public.profiles`, storage buckets, migration `0030`, `public.runtime_settings.account_deletions_url`, `public.runtime_settings.cron_secret`

- **process-retention-purge**
  - **Purpose**: Daily cron-driven processor that deletes expired recruiter telemetry, AI call logs, moderation events, and job-fit analyses
  - **Authentication**: Anonymous gateway access with `X-Cron-Secret`; deploy with `--no-verify-jwt`
  - **Dependencies**: retained tables, shared retention helper, migration `0031`, `public.runtime_settings.retention_purge_url`, `public.runtime_settings.cron_secret`

- **export-user-data**
  - **Purpose**: Builds the self-service JSON export bundle used by the Settings privacy export flow
  - **Authentication**: JWT required
  - **Dependencies**: user-owned tables across profiles, documents, conversations, and recruiter contacts; no extra secrets

### Updated Edge Functions
```
⚠️  UPDATE: analyze-job-fit, chat-persona, test-persona-chat, and get-public-profile now need redeploy for the P2 hardening rollout.
```

---

## Runtime Settings Required In Production

The following `public.runtime_settings` keys must exist and point to the production project before cron jobs will work correctly:

- `account_deletions_url` → `https://<PROD_PROJECT_REF>.supabase.co/functions/v1/process-account-deletions`
- `retention_purge_url` → `https://<PROD_PROJECT_REF>.supabase.co/functions/v1/process-retention-purge`
- `public_job_fit_enabled` → `true` to allow public recruiter job-fit, `false` to disable it globally
- `cron_secret` → shared secret used by the pg_cron-triggered functions

## Supabase Config Requirements

The production deployment must include the matching `verify_jwt = false` behavior for:

- `process-account-deletions`
- `process-retention-purge`

These cron-driven functions must be deployed with `--no-verify-jwt` so the platform gateway does not reject calls before the function-level `X-Cron-Secret` check.

---

## 🚨 Production Issues Tracker

### Current Issues
| Issue | Status | Impact | Next Action |
|-------|--------|--------|-------------|
| No production sync tracker previously existed for the compliance migrations/functions | ✅ Resolved | Medium | Use this tracker for deploy sequencing |
| Compliance migrations and cron endpoints are not yet recorded as production-ready | 🟡 Monitoring | Medium | Confirm prod deploy timing and apply migrations in order |
| P1.5 export and P2 hardening deploy steps were not listed in the production tracker | ✅ Resolved | Medium | Use the expanded sections below for rollout sequencing |

### Resolved Issues
| Issue | Resolved Date | Resolution | Impact |
|-------|---------------|------------|--------|
| Missing production sync documentation for compliance foundation | 2026-05-03 | Added `supabase/trackers/compliance-foundation-sync-tracker.md` | Medium |

---

## 🚀 Deployment Sequence

### 1. Pre-Deployment Checklist
- [ ] Confirm the workspace migrations have been reviewed in order
- [ ] Confirm production `runtime_settings` values for `account_deletions_url`, `retention_purge_url`, and `cron_secret`
- [ ] Confirm the production `public_job_fit_enabled` value matches the intended recruiter rollout state
- [ ] Confirm the production URLs point at the prod project, not dev
- [ ] Confirm the cron-driven functions will be deployed with `--no-verify-jwt`
- [ ] Run focused tests for legal acceptance, account deletion, retention, export, and validation before release

### 2. Database Migrations
Apply in this order:

1. `0029_legal_acceptance_versions.sql`
2. `0030_account_deletion_requests.sql`
3. `0031_retention_purge.sql`
4. `0032_ai_audit_controls.sql`
5. `0033_backfill_runtime_function_urls.sql`

### 3. Edge Function Deployments
Deploy in this order:

1. `accept-legal-documents`
2. `request-account-deletion`
3. `cancel-account-deletion`
4. `process-account-deletions --no-verify-jwt`
5. `process-retention-purge --no-verify-jwt`
6. `export-user-data`
7. `get-public-profile`
8. `analyze-job-fit`
9. `chat-persona`
10. `test-persona-chat`

### 4. Post-Deployment Verification
- [ ] Legal acceptance succeeds for an authenticated user and writes versions into `public.app_users`
- [ ] Account deletion can be requested and cancelled in production safely
- [ ] Settings export downloads the JSON bundle for an authenticated user
- [ ] `public.runtime_settings.account_deletions_url` targets the production function URL
- [ ] `public.runtime_settings.retention_purge_url` targets the production function URL
- [ ] `public.runtime_settings.public_job_fit_enabled` matches the intended rollout state
- [ ] Cron-triggered functions return 200 responses in `net._http_response`

---

## Notes

- This tracker covers the Supabase-side production sync requirements for the compliance foundation already implemented in the repo.
- It now also covers the `P1.5` data export rollout and the current `P2` recruiter-AI hardening changes that introduced new Supabase deploy steps.