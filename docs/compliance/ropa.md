# Record Of Processing Activities

Last updated: 2026-05-03

Controller: Akram Zaki, private individual, Netherlands

| Activity | Data subjects | Categories of personal data | Purpose | Legal basis | Recipients / processors | Retention | Core safeguards |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Account creation and sign-in | Users | Email, auth identifiers, locale, timezone | Provide access to the service | Contract | Supabase | While account active | Auth provider, RLS, JWT validation |
| Profile hosting and publication | Users | Name, headline, bios, skills, profile photo, slug, public visibility | Let users publish an interactive professional profile | Contract | Supabase, Cloudflare | While account active | Visibility flags, public/private separation |
| Document ingestion | Users | Uploaded files, extracted text, embeddings/chunks | Build the user's searchable knowledge base | Contract | Supabase, selected AI provider | While account active | Signed uploads, server-side processing, cascades on account delete |
| Persona chat | Users, public visitors | Profile excerpts, chunks, visitor prompts, chat responses | Answer recruiter and visitor questions | Contract for the user; legitimate interest for service safety | Supabase, selected AI provider | Conversations while account active; AI call logs 180 days | Grounded retrieval, moderation, rate limits |
| Job-fit analysis | Users, public visitors | Job descriptions, fit outputs, citations | Provide recruiter-facing assistive analysis | Contract for the user; legitimate interest for service operation | Supabase, selected AI provider | Analyses 365 days | Prompt guardrails, human-oversight notice |
| Recruiter analytics | Public visitors, users | Visit and interaction telemetry, IP hash, locale, session id | Measure usage and troubleshoot abuse | Legitimate interest | Supabase, Cloudflare | Visits 90 days; events 180 days | Limited retention, pseudonymous session data |
| Moderation and abuse prevention | Users, public visitors | Input excerpts, event type, resolution, review timestamps | Keep the service safe and investigate abuse | Legitimate interest / legal obligation where applicable | Supabase, selected AI provider | 365 days | Moderation events, admin review |
| Privacy and compliance handling | Users, requesters | Request metadata, account scope, correspondence | Respond to GDPR requests and operational incidents | Legal obligation / legitimate interest | Email provider, internal operator tooling | Case-by-case | Manual verification, request logging |