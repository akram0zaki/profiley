# Human Oversight

Last updated: 2026-05-03

This document operationalizes the rule that Profiley's recruiter-facing AI outputs are assistive, not authoritative.

## Required reviewer behavior

Any person using recruiter chat or job-fit outputs must:

1. Review the underlying profile and cited evidence before acting.
2. Treat unsupported or low-confidence claims as unverified.
3. Use interviews, reference checks, portfolio review, or other human processes before making employment decisions.
4. Ignore any output that appears discriminatory, fabricated, or irrelevant.

## Product-level supports already in repo

- Public recruiter chat and job-fit surfaces now show point-of-use AI notices.
- Owner-side preview flows also show pre-use notices and privacy/help links.
- Job-fit output is framed as advisory and not a verified employment assessment.
- Users can disable public chat or job-fit analysis per profile.
- Operators can disable public recruiter job-fit globally via `public.runtime_settings.public_job_fit_enabled`.

## Current limitations

- There is no recruiter acknowledgement checkbox or audit trail yet.
- Recruiter chat does not yet require an explicit acknowledgement before first use.

## Deployment rule

If a future admin UI or operator workflow enables public job-fit broadly, the deployer must review this file, `ai-intended-purpose.md`, and `ai-prohibited-uses.md` before setting `public.runtime_settings.public_job_fit_enabled = 'true'` in production.