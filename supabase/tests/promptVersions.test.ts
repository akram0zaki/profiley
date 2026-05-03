import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  JOB_FIT_PROMPT_VERSION,
  PERSONA_CHAT_PROMPT_VERSION,
  PROMPT_VERSION_REGISTRY,
} from "../functions/_shared/prompts/versions.ts";

Deno.test("prompt version registry: exposes stable versions for recruiter-facing prompts", () => {
  assertEquals(PROMPT_VERSION_REGISTRY["persona-chat"], PERSONA_CHAT_PROMPT_VERSION);
  assertEquals(PROMPT_VERSION_REGISTRY["job-fit"], JOB_FIT_PROMPT_VERSION);
  assertEquals(PERSONA_CHAT_PROMPT_VERSION, "2026-05-03");
  assertEquals(JOB_FIT_PROMPT_VERSION, "2026-05-03");
});