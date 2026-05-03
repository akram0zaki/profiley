# Data Export Spec

Last updated: 2026-05-03

This document defines the current self-service export package for Profiley. The standard path is Settings -> Export your data, which downloads a machine-readable JSON bundle. Operator follow-up is only needed when the requester also needs stored files or a reviewed expansion beyond the default export scope.

## Package format

- Container: single JSON file download
- Root keys:
  - `manifest`
  - `tables`
- Encoding: UTF-8
- Timestamp format: ISO 8601 UTC

## Manifest shape

```json
{
  "exportedAt": "2026-05-03T12:00:00.000Z",
  "profileyVersion": "self-service-export-v1",
  "subjectUserId": "<uuid>",
  "deliveryMode": "self_service_download",
  "format": "json_bundle",
  "tables": ["app_users", "profiles", "profile_preferences"],
  "tableCounts": {
    "app_users": 1,
    "profiles": 1
  },
  "storageArtifacts": [
    {
      "kind": "uploaded_document",
      "bucket": "documents",
      "path": "documents/<user-id>/resume.pdf",
      "sourceTable": "uploaded_documents",
      "sourceId": "<uuid>"
    }
  ]
}
```

## Included tables

| Table | Include | Notes |
| --- | --- | --- |
| `app_users` | Yes | Include acceptance metadata, locale, onboarding status, deletion schedule state |
| `profiles` | Yes | Include all profile content and visibility flags |
| `profile_preferences` | Yes | Include feature toggles and model overrides |
| `public_pages` | Yes | Include public-page metadata |
| `uploaded_documents` | Yes | Metadata plus storage path |
| `document_extractions` | Yes | Extracted text and language |
| `knowledge_chunks` | Yes | Exclude rows with `deleted_at` set |
| `onboarding_answers` | Yes | Include `answer_text` and `answer_json` |
| `conversations` | Yes | Limited to conversations linked to the user's profile |
| `messages` | Yes | Includes message content and retrieval context for exported conversations |
| `job_fit_analyses` | Yes | Includes recruiter-facing job-fit outputs stored for the user's profile |
| `recruiter_contacts` | Yes | Includes direct recruiter messages sent to the user's profile |

## Excluded tables by default

- `recruiter_visits`
- `recruiter_events`
- `moderation_events`
- `ai_call_logs`
- `rate_limit_buckets`
- `avatar_sessions`

These tables are operational or third-party-heavy data sets and should only be exported after a specific legal review.

## Storage artifacts

- The self-service export includes storage references in `manifest.storageArtifacts` for uploaded documents and profile photos.
- The current self-service bundle does not inline file bytes.
- If the requester explicitly asks for stored files, the operator should use the listed bucket/path references to attach them manually after identity verification.

## Field-level cautions

- `visitor_session_id`: visitor metadata, not necessarily the account owner's own personal data
- `messages.retrieval_context`: may contain excerpts of uploaded documents and citations
- `job_fit_analyses.job_description`: often contains recruiter-supplied text
- `recruiter_contacts`: contains recruiter name, email, company, and freeform message text

## Operator follow-up order

1. Ask the signed-in requester to download the self-service bundle from Settings when the standard scope is sufficient.
2. Review `manifest.storageArtifacts` if the requester also needs stored files.
3. Review excluded tables only when a lawful basis and identity verification support expanding the export.
4. Record any manual additions or exclusions in `privacy-requests-log-template.md`.