# AI Evaluation Plan

Last updated: 2026-05-03

This plan defines a lightweight but concrete evaluation loop for recruiter chat and job-fit.

## Evaluation sets

- Golden recruiter questions grounded in known profile facts
- Job descriptions that should produce clear strengths, gaps, and citations
- Negative prompts designed to trigger unsupported speculation or irrelevant claims

## Minimum checks

- factual consistency with the source profile and uploaded documents
- no unsupported claims about experience or achievements
- no discriminatory or sensitive-trait inference
- job-fit outputs remain assistive and non-authoritative in wording
- notices and citations remain visible in the frontend

## When to run

- before changing prompts or switching default providers
- after material model-version changes
- after incidents involving hallucination, bias, or privacy leakage

## Current repo anchors

- Prompt versions are tracked in `supabase/functions/_shared/prompts/versions.ts`.
- Seed evaluation cases live in `supabase/tests/fixtures/ai-evaluation-snapshots.json`.
- Any future benchmark run should record the prompt version used for each result.