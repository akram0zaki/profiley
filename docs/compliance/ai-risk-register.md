# AI Risk Register

Last updated: 2026-05-03

| Risk | Surface | Harm | Existing controls | Monitoring signal | Owner |
| --- | --- | --- | --- | --- | --- |
| Hallucinated candidate claims | Recruiter chat, job-fit | Recruiter relies on false information | Retrieval grounding, citations, point-of-use notices | User complaints, moderation events, manual review | Operator |
| Automation bias in hiring | Public job-fit | Recruiter over-trusts the score | Assistive framing, prohibited-use doc, human-oversight doc | Support complaints, feedback from users, future acknowledgement events | Operator |
| Bias or discriminatory inference | Chat, job-fit | Unfair employment impact | System prompts, prohibited-use policy, moderation | Incident reports, qualitative review set | Operator |
| Privacy leakage from uploads | Chat, citations, exports | Sensitive data exposed to recruiters | User-controlled publication, visibility toggles, deletion path | User reports, moderation flags | Operator |
| Prompt abuse / injection | Public chat | Unsafe or off-policy output | Moderation layer, rate limiting, prompt guardrails | Moderation events, rate-limit spikes | Operator |
| Excessive retention of operational data | Analytics, logs | Storage-limitation breach | Retention matrix, purge job, deletion flow | Cron failures, stale-row checks | Operator |