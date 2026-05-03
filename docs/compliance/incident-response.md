# Incident Response

Last updated: 2026-05-03

This runbook covers general privacy and security incidents for Profiley.

## Detection sources

- Edge-function logs
- Moderation events
- AI call logs
- User reports to privacy@profiley.ai
- Failed cron jobs for deletion or retention purge

## Triage levels

- `SEV-1`: active data exposure, broken deletion path, or unauthorized access
- `SEV-2`: significant service degradation affecting privacy or safety controls
- `SEV-3`: isolated or low-impact issue with no known data exposure

## Response steps

1. Identify affected systems, tables, and users.
2. Stop the bleed: disable the affected feature, revoke the key, or pause the job.
3. Preserve logs and relevant evidence.
4. Assess whether personal-data breach notification is likely required.
5. Fix, validate, and document the remediation.

## Notification checkpoints

- If a personal-data breach is likely to risk individuals' rights or freedoms, assess notification within 72 hours.
- If direct user notification is required, use plain language and explain what happened, what data was affected, and what the user should do next.

## Post-incident review

- Root cause
- Detection gap
- Control changes needed
- Whether legal copy or runbooks changed
- Follow-up owner and due date