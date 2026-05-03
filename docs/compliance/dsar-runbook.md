# DSAR Runbook

Last updated: 2026-05-03

This runbook describes how Profiley handles privacy-rights requests. It is written for a single operator in the Netherlands and is intended to be executable by a future human operator or AI agent working in the repo.

## Intake channels

- Email: privacy@profiley.ai
- In-product export: Settings -> Export your data
- In-product deletion: Settings -> Delete account

## Request classes

| Request | Primary handling path | Notes |
| --- | --- | --- |
| Access | Self-service export first, operator follow-up if needed | Use the data export spec in `data-export-spec.md` |
| Portability / export | Self-service export first, operator follow-up if needed | Standard scope now downloads from Settings as structured JSON |
| Rectification | Ask user to self-edit where possible; operator assists otherwise | Prefer product self-service for profile fields |
| Restriction / objection | Manual review | Usually applies to analytics or legitimate-interest processing |
| Erasure | Settings self-service flow or manual operator flow | Product deletes after a 30-day grace period |
| Consent withdrawal | Apply setting / feature toggle or stop optional outreach | Does not undo past lawful processing |

## Identity verification

Default rule: collect the least additional information necessary.

| Request path | Verification rule |
| --- | --- |
| Logged-in request from the account session | Accept as verified if it originates from the authenticated user and the requested scope matches their account |
| Email from the exact account address | Accept after a reply-confirmation from the same address |
| Email from a different address | Ask the requester to write from the account address or sign in and submit from inside the product |
| High-risk request (export of chats/documents, contested ownership) | Require a signed-in confirmation or ask for a recent profile detail only the account holder would know |

Do not routinely request passport, ID-card, or driving-license scans. Escalate before collecting government IDs.

## Timeline

- Acknowledge within 5 business days
- Complete within 1 calendar month of verified receipt
- Extension: up to 2 additional months only when the request is complex or numerous; inform the requester inside the first month

## Standard workflow

1. Open a new row in `privacy-requests-log-template.md` and use `privacy-request-case-schema.md` if the request needs more than the minimum table row.
2. Classify the request type and requested scope.
3. Verify identity using the rules above.
4. Check for legal or safety holds before making destructive changes.
5. Fulfil the request using the relevant playbook below.
6. Send the response using `privacy-request-response-templates.md` where helpful and record completion date, outcome, and any partial refusals.

## Fulfilment playbooks

### Access / portability

1. Ask the requester to use Settings -> Export your data when the standard scope is sufficient.
2. Follow `data-export-spec.md` for the exact self-service scope and any manual follow-up.
3. Review excluded or third-party-heavy tables before expanding beyond the default bundle.
4. Deliver any manual follow-up files through the verified account email or another agreed secure channel.

### Rectification

1. Ask the user to update their profile directly if the product already exposes the field.
2. If the field is not user-editable, update it through the least-privileged operator path available.
3. Record what changed and when.

### Restriction / objection

1. Identify the processing activity and legal basis.
2. If the activity is based on legitimate interest, document the balancing outcome.
3. Where feasible, disable the relevant feature or stop the specific processing.

### Erasure

1. If the requester can sign in, direct them to the Settings deletion flow.
2. If they cannot sign in, use `erasure-runbook.md`.
3. Confirm that deletion is delayed by 30 days unless a legal/safety exception requires a different path.

## Refusals and partial refusals

Possible reasons for refusal or partial refusal:

- Identity could not be verified
- The request would disclose another person's personal data without a lawful basis
- Legal, tax, fraud, or safety obligations require limited continued retention
- The request is manifestly unfounded or excessive

Always explain the reason in plain language and record it in the request log.

## Templates

Use `privacy-request-response-templates.md` for acknowledgement, verification, extension, completion, partial refusal, and closure wording.