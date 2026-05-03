# International Transfers

Last updated: 2026-05-03

This note documents what Profiley can say today about international data transfers based on repo evidence and public vendor materials.

## What is currently evidenced

- Supabase can be configured with EU-hosted infrastructure, but parts of the service organisation are US-based.
- Cloudflare operates a global edge network; request metadata may be processed outside the EEA depending on routing.
- OpenAI publishes Europe privacy and transfer materials but still processes data on infrastructure that may involve the US.
- Google and Mistral publish public privacy/legal materials describing their processing commitments.

## What is not evidenced in the repo

- No separate custom signed SCCs or bespoke transfer addenda are stored in the repo.
- No transfer impact assessment files are yet maintained beyond this note and the DPIA.
- No hard promise is made about a fixed backup location or exclusive EEA processing for every provider component.

## Operator position

- Prefer EU-hosted or EU-regional options where the provider offers them.
- Do not claim more than the public vendor materials and in-repo configuration support.
- Review transfer-facing legal copy when adding a new provider or changing deployment region.