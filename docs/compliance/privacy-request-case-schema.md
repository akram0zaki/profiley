# Privacy Request Case Schema

Last updated: 2026-05-03

Use this structure when a single row in `privacy-requests-log-template.md` is not enough to document the request safely.

## Required fields

- `request_id`
- `received_at`
- `request_type`
- `requester_name`
- `account_email`
- `requested_scope`
- `verification_method`
- `verification_completed_at`
- `owner`
- `due_date`
- `status`
- `response_channel`
- `closed_at`

## Recommended evidence fields

- `intake_summary`: what the requester asked for in plain language
- `systems_reviewed`: tables, storage buckets, or documents reviewed
- `export_package_reference`: downloaded bundle name, manual attachments, or omission rationale
- `exceptions_applied`: legal hold, third-party-data exclusion, or excessive-request rationale
- `communications`: sent acknowledgements, verification requests, extension notices, and completion responses
- `closure_notes`: final outcome and any follow-up promised

## Suggested statuses

- `Open`
- `Awaiting verification`
- `In progress`
- `Completed`
- `Partially refused`
- `Refused`
- `Extended`

## Storage rule

- Keep the case record in the repo-controlled operator process.
- Do not store government-ID scans in the repo.
- If temporary verification evidence is collected elsewhere, reference it briefly and delete it once no longer needed.