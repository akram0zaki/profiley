# AI Incident Management

Last updated: 2026-05-03

Use this runbook for AI-specific incidents that do not fit neatly into generic infrastructure issues.

## Incident examples

- fabricated candidate facts shown to recruiters
- discriminatory or abusive output that bypasses guardrails
- private document content surfaced unexpectedly in public chat
- provider or prompt changes causing materially unsafe output patterns

## Triage

- `AI-SEV-1`: harmful output already shown publicly or repeated across users
- `AI-SEV-2`: unsafe behaviour reproducible but contained
- `AI-SEV-3`: isolated low-impact quality issue

## Response steps

1. Capture the prompt, output, provider/model, and affected profile.
2. Disable or narrow the affected feature if needed.
3. Preserve logs and supporting records.
4. Determine whether the issue is factuality, privacy, bias, safety, or vendor reliability.
5. Patch prompts, guards, UI notices, or provider settings as appropriate.
6. Update the risk register if the incident reveals a new failure mode.