# DPIA

Last updated: 2026-05-03

This is a pragmatic data-protection impact assessment for the current Profiley product. It is not a substitute for external legal review.

## Scope

- Uploaded professional documents
- Public profile publication
- Recruiter chat and job-fit analysis
- Moderation, analytics, and retention jobs

## Why a DPIA is warranted

- Professional documents can contain large volumes of personal data
- The product publishes profile data publicly by design
- Recruiter-facing AI outputs can influence employment-related decisions
- Multiple processors and cross-border AI providers are involved

## Necessity and proportionality

Profiley's core proposition requires document ingestion, profile generation, and AI-assisted response generation. The product limits exposure through opt-in public visibility, per-feature toggles, short retention for analytics, and a user-controlled deletion path.

## Main risks

| Risk | Impact | Existing mitigation | Residual concern |
| --- | --- | --- | --- |
| Over-disclosure from uploaded CVs or documents | Public exposure of unintended personal data | User-controlled publishing, source review, public visibility toggle | Users may still upload more than intended |
| Recruiters over-rely on job-fit outputs | Employment harm or unfair screening | Legal notices, human-oversight docs, assistive framing | High residual concern; requires ongoing governance |
| Cross-border processor risk | Data transfer uncertainty | Public vendor terms, EU-hosted options where available | Vendor evidence remains partly outside repo control |
| Excessive log retention | Storage-limitation non-compliance | Enforced purge job and retention matrix | Backups remain provider-managed |
| Abuse or prompt injection | Safety, privacy, or reputational harm | Moderation events, rate limits, prompt guardrails | Continuous monitoring required |

## Risk decision

Profiley can operate with the controls in this repo, but recruiter-facing job-fit and public AI features remain the highest-risk area. They should stay assistive, visible, and operationally monitored.

## Actions that must stay in place

- Maintain the Settings deletion flow and scheduled purge
- Keep retention enforcement deployed and monitored
- Keep recruiter-facing AI notices and human-oversight guidance visible
- Review vendor/transfer docs whenever providers or regions change