# Profiley Compliance Assessment

Last reviewed: 2026-05-02

This is an engineering and documentation audit of the repository state. It is not legal advice. The assessment is limited to evidence available in this repo and does not verify off-repo contracts, vendor settings, insurance, internal procedures, or production-only operational controls.

## Executive summary

Profiley is not demonstrably GDPR-compliant or EU AI Act-compliant on the evidence in this repository.

- GDPR: partially aligned on technical privacy controls, but not compliant end-to-end.
- EU AI Act: partially aligned on limited-risk transparency, but not ready for compliance if the shipped recruiter-facing job-fit functionality is used in recruitment or candidate-evaluation workflows.

The strongest positives are row-level security, public/private sharing controls, signed uploads, moderation, and public legal pages. The strongest negatives are policy-to-product mismatches, missing retention enforcement, missing evidence of terms/privacy acceptance capture, missing DSAR/account-deletion workflows, and the absence of the governance artifacts required for employment-related AI use.

## Sources reviewed

- [README.md](../../README.md)
- [apps/frontend/src/app/pages/privacy.tsx](../../apps/frontend/src/app/pages/privacy.tsx)
- [apps/frontend/src/app/pages/terms.tsx](../../apps/frontend/src/app/pages/terms.tsx)
- [apps/frontend/src/app/i18n/locales/en/legal.json](../../apps/frontend/src/app/i18n/locales/en/legal.json)
- [apps/frontend/src/app/pages/settings.tsx](../../apps/frontend/src/app/pages/settings.tsx)
- [apps/frontend/src/app/pages/public-profile.tsx](../../apps/frontend/src/app/pages/public-profile.tsx)
- [apps/frontend/src/app/pages/job-fit-preview.tsx](../../apps/frontend/src/app/pages/job-fit-preview.tsx)
- [docs/concept/profiley-prd.md](../concept/profiley-prd.md)
- [docs/concept/profiley-init-guide.md](../concept/profiley-init-guide.md)
- [supabase/migrations/0002_app_users.sql](../../supabase/migrations/0002_app_users.sql)
- [supabase/migrations/0011_job_fit_analyses.sql](../../supabase/migrations/0011_job_fit_analyses.sql)
- [supabase/migrations/0013_moderation_and_analytics.sql](../../supabase/migrations/0013_moderation_and_analytics.sql)
- [supabase/migrations/0017_ai_call_logs.sql](../../supabase/migrations/0017_ai_call_logs.sql)
- [supabase/migrations/0019_rls.sql](../../supabase/migrations/0019_rls.sql)
- [supabase/functions/initialize-user-profile/index.ts](../../supabase/functions/initialize-user-profile/index.ts)
- [supabase/functions/complete-onboarding/index.ts](../../supabase/functions/complete-onboarding/index.ts)
- [supabase/functions/_shared/ai/log.ts](../../supabase/functions/_shared/ai/log.ts)
- [supabase/functions/_shared/prompts/jobFit.ts](../../supabase/functions/_shared/prompts/jobFit.ts)

## GDPR assessment

### What is already in place

- Public-facing privacy, terms, and cookie disclosures exist and include data categories, legal bases, processor descriptions, transfer language, retention statements, and rights language in the UI copy in [apps/frontend/src/app/i18n/locales/en/legal.json](../../apps/frontend/src/app/i18n/locales/en/legal.json).
- User-owned tables are protected with row-level security in [supabase/migrations/0019_rls.sql](../../supabase/migrations/0019_rls.sql).
- Public exposure is scoped through `public_visibility` and per-feature privacy toggles in [apps/frontend/src/app/pages/settings.tsx](../../apps/frontend/src/app/pages/settings.tsx).
- The public profile page clearly separates public chat, job-fit analysis, and contact controls in [apps/frontend/src/app/pages/public-profile.tsx](../../apps/frontend/src/app/pages/public-profile.tsx).
- The product uses moderation events and AI call logs for operational control in [supabase/migrations/0013_moderation_and_analytics.sql](../../supabase/migrations/0013_moderation_and_analytics.sql) and [supabase/functions/_shared/ai/log.ts](../../supabase/functions/_shared/ai/log.ts).
- The job-fit prompt explicitly instructs the model to avoid protected-attribute reasoning in [supabase/functions/_shared/prompts/jobFit.ts](../../supabase/functions/_shared/prompts/jobFit.ts).

### Gaps and likely incompliances

#### 1. The legal text promises account deletion from settings, but the settings page only supports sign-out.

Status: likely non-compliant transparency / accuracy issue.

- The terms copy states: "You may delete your account at any time from the settings page" in [apps/frontend/src/app/i18n/locales/en/legal.json](../../apps/frontend/src/app/i18n/locales/en/legal.json).
- The actual settings UI in [apps/frontend/src/app/pages/settings.tsx](../../apps/frontend/src/app/pages/settings.tsx) exposes sign-out, privacy toggles, and locale changes, but no account-deletion flow.
- The only documented purge mechanism is admin-side SQL in [docs/concept/profiley-init-guide.md](../concept/profiley-init-guide.md), which is not a user-accessible GDPR erasure workflow.

Why this matters:

- Privacy notices and terms must accurately reflect actual processing and available controls. A promised self-service erasure control that does not exist is a concrete mismatch.

#### 2. Terms and privacy acceptance fields exist in schema, but there is no evidence they are ever written.

Status: compliance gap.

- `terms_accepted_at` and `privacy_accepted_at` exist in [supabase/migrations/0002_app_users.sql](../../supabase/migrations/0002_app_users.sql).
- The account initialization and onboarding handlers in [supabase/functions/initialize-user-profile/index.ts](../../supabase/functions/initialize-user-profile/index.ts) and [supabase/functions/complete-onboarding/index.ts](../../supabase/functions/complete-onboarding/index.ts) do not populate those fields.
- I found no frontend flow capturing acceptance events and no backend handler updating those timestamps.

Why this matters:

- If Profiley relies on accepted terms or privacy acknowledgements, the repo does not currently provide evidence of capture, timestamping, or auditability.

#### 3. The privacy policy states specific retention periods, but the repo shows no retention enforcement.

Status: likely non-compliant storage-limitation implementation gap.

- The privacy policy claims fixed retention windows for operational logs, AI call logs, backups, and other data in [apps/frontend/src/app/i18n/locales/en/legal.json](../../apps/frontend/src/app/i18n/locales/en/legal.json).
- The repo defines persistent tables for `job_fit_analyses`, `moderation_events`, `recruiter_visits`, `recruiter_events`, and `ai_call_logs` in [supabase/migrations/0011_job_fit_analyses.sql](../../supabase/migrations/0011_job_fit_analyses.sql), [supabase/migrations/0013_moderation_and_analytics.sql](../../supabase/migrations/0013_moderation_and_analytics.sql), and [supabase/migrations/0017_ai_call_logs.sql](../../supabase/migrations/0017_ai_call_logs.sql).
- I found no purge job, lifecycle policy, scheduled deletion function, or documented operational process that enforces the stated 90-day, 180-day, or backup-retention limits.

Why this matters:

- Stating retention periods without technical or operational enforcement is not enough for GDPR storage-limitation compliance.

#### 4. Data subject rights are described, but no operational DSAR workflow is evidenced.

Status: compliance gap.

- The privacy page tells users to email `privacy@profiley.ai` for access, erasure, portability, and other rights in [apps/frontend/src/app/i18n/locales/en/legal.json](../../apps/frontend/src/app/i18n/locales/en/legal.json).
- The repo does not contain a DSAR runbook, case-tracking process, identity-verification procedure, export package builder, or response SLA tooling.
- The only clear user-editable data controls are profile edits, locale, and public-sharing toggles.

Why this matters:

- Manual rights handling can be compliant, but there must be a real operating procedure behind it. This repo does not evidence one.

#### 5. International-transfer and processor-contract statements are not verifiable from the repo.

Status: unverified and needs operational proof.

- The privacy text says Profiley uses vetted processors under written DPAs and SCCs, including with Supabase and OpenAI, in [apps/frontend/src/app/i18n/locales/en/legal.json](../../apps/frontend/src/app/i18n/locales/en/legal.json).
- This repository contains no signed DPA copies, transfer impact assessment, subprocessor review record, or vendor onboarding checklist.

Why this matters:

- This is not a code defect by itself, but the repo does not provide enough evidence to call the product compliant on processor governance or international transfers.

#### 6. No repo evidence of a GDPR accountability pack.

Status: compliance gap.

- I found no record of processing activities, no legitimate-interest assessment, no DPIA, no breach-notification runbook, and no security/control owner matrix in the repo.

Why this matters:

- Given the volume and sensitivity of professional profile data, uploaded documents, recruiter interactions, and AI-supported profiling, some form of documented accountability package is expected even for a small controller.

### GDPR conclusion

Profiley has useful privacy-by-design controls, but it is not currently demonstrably GDPR-compliant on the basis of this repository. The biggest blockers are inaccurate legal claims, missing acceptance evidence, missing retention enforcement, and absent operational proof for rights handling and processor governance.

## EU AI Act assessment

### Classification risk

The repository describes and implements recruiter-facing AI features, not only candidate self-service assistance.

- The PRD says recruiters can query a candidate's experience and use AI-driven job-fit analysis in [docs/concept/profiley-prd.md](../concept/profiley-prd.md).
- The recruiter workflow explicitly includes fit scoring, strengths, gaps, and risks in [docs/concept/profiley-prd.md](../concept/profiley-prd.md).
- The public product UI exposes recruiter chat and job-fit tabs in [apps/frontend/src/app/pages/public-profile.tsx](../../apps/frontend/src/app/pages/public-profile.tsx).
- Job-fit analyses are persisted in [supabase/migrations/0011_job_fit_analyses.sql](../../supabase/migrations/0011_job_fit_analyses.sql).

Practical reading:

- If Profiley is used only as a candidate-owned self-presentation tool, some features may be treated as lower-risk transparency use cases.
- If recruiters use the system to evaluate, compare, shortlist, or otherwise influence hiring decisions, the job-fit analyzer pushes the product toward the EU AI Act's employment-related high-risk category.

### What is already in place

- The UI and copy repeatedly describe the experience as AI-powered in [README.md](../../README.md), [apps/frontend/src/app/pages/public-profile.tsx](../../apps/frontend/src/app/pages/public-profile.tsx), and [apps/frontend/src/app/i18n/locales/en/legal.json](../../apps/frontend/src/app/i18n/locales/en/legal.json).
- The job-fit flow includes source citations and a disclaimer that fit scores are guidance, not objective truth, in [docs/concept/profiley-prd.md](../concept/profiley-prd.md) and [apps/frontend/src/app/pages/job-fit-preview.tsx](../../apps/frontend/src/app/pages/job-fit-preview.tsx).
- The prompt layer includes an instruction to avoid protected-attribute reasoning in [supabase/functions/_shared/prompts/jobFit.ts](../../supabase/functions/_shared/prompts/jobFit.ts).
- Moderation and AI-call logging exist in [supabase/migrations/0013_moderation_and_analytics.sql](../../supabase/migrations/0013_moderation_and_analytics.sql) and [supabase/functions/_shared/ai/log.ts](../../supabase/functions/_shared/ai/log.ts).

### Gaps and likely incompliances

#### 1. No evidence of the AI governance system required for employment-related high-risk use.

Status: major compliance gap.

I found no repository evidence of:

- a quality-management system
- a formal risk-management process
- data-governance documentation for training, prompts, or evaluation inputs
- accuracy, robustness, or cybersecurity targets for the AI system
- human-oversight instructions for deployers or recruiters
- technical documentation suitable for conformity assessment
- post-market monitoring procedures
- serious-incident reporting procedures
- fundamental-rights impact assessment support
- CE-marking / declaration-of-conformity readiness

Why this matters:

- Those artifacts are core to high-risk compliance. Prompt guardrails and disclaimers do not substitute for them.

#### 2. The repo supports recruiter-facing fit scoring, but there is no evidence of deployer-side controls to keep humans meaningfully in control.

Status: major compliance gap.

- The product stores and presents fit scores, strengths, gaps, and risks.
- I found no recruiter-facing instructions, no required human review step, no audit trail of recruiter decisions, and no control preventing automation bias or over-reliance on scores.

Why this matters:

- In an employment context, human oversight must be designed into both documentation and operation, not only implied by a disclaimer.

#### 3. No evidence of AI literacy measures.

Status: compliance gap.

- I found no training material, operator guidance, or internal process showing that people deploying or administering the system have AI-literacy support.

Why this matters:

- AI literacy duties under the EU AI Act are already relevant and are not satisfied by code comments or public marketing copy.

#### 4. Limited-risk transparency is only partially addressed.

Status: partial alignment.

- Positive: the UI exposes AI branding and legal notices, and the public chat bot is labeled as AI in [apps/frontend/src/app/pages/public-profile.tsx](../../apps/frontend/src/app/pages/public-profile.tsx).
- Gap: I found no unified user-notice pattern that guarantees every recruiter or visitor is informed, before interaction, about what is automated, what data is processed, how long it is kept, and how to contest or escalate an outcome.

Why this matters:

- Transparency is not only a legal-page issue. It needs to be shown where the automated feature is used.

### EU AI Act conclusion

Profiley is not ready to be represented as EU AI Act-compliant if the recruiter-facing job-fit analyzer is used in real hiring or candidate-evaluation workflows. The current repo shows useful safety and transparency measures, but it lacks the governance, documentation, oversight, and conformity scaffolding expected for employment-related AI systems.

## Priority remediation list

### Highest priority

1. Implement a real account-deletion / erasure flow and remove or correct the false settings-page claim until it exists.
2. Capture and audit `terms_accepted_at` and `privacy_accepted_at`, or remove those fields and any reliance on them.
3. Implement retention enforcement for logs, recruiter analytics, job-fit analyses, and any backups, then align the privacy policy with what is actually enforced.
4. Create an operational DSAR runbook covering identity verification, data export, erasure handling, response timing, and exception handling.

### Next priority

5. Assemble a GDPR accountability pack: RoPA, LIA where used, DPIA where required, processor inventory, DPA/SCC evidence, and breach-response procedure.
6. Add deployer/operator documentation for AI use, especially around job-fit outputs, human review, and non-reliance on automated scoring.
7. Decide whether recruiter-facing job-fit is an employment-use AI system. If yes, start high-risk AI Act preparation now rather than treating the current prompt/disclaimer layer as sufficient.

### Required for any serious AI Act compliance position

8. Define the intended purpose and prohibited uses of the job-fit system.
9. Build risk-management, post-market monitoring, incident reporting, and human-oversight procedures.
10. Produce technical documentation, evaluation metrics, and deployer instructions suitable for regulatory review.

## External privacy policy links

- Supabase privacy policy: <https://supabase.com/privacy>
- OpenAI privacy policy: <https://openai.com/policies/privacy-policy/>
