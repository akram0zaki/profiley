import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { parseBooleanRuntimeSetting } from "../functions/_shared/runtimeSettings.ts";

Deno.test("parseBooleanRuntimeSetting: handles common truthy values", () => {
  assertEquals(parseBooleanRuntimeSetting("true", false), true);
  assertEquals(parseBooleanRuntimeSetting(" YES ", false), true);
  assertEquals(parseBooleanRuntimeSetting("1", false), true);
});

Deno.test("parseBooleanRuntimeSetting: handles common falsy values", () => {
  assertEquals(parseBooleanRuntimeSetting("false", true), false);
  assertEquals(parseBooleanRuntimeSetting("off", true), false);
  assertEquals(parseBooleanRuntimeSetting("0", true), false);
});

Deno.test("parseBooleanRuntimeSetting: falls back for missing or unknown values", () => {
  assertEquals(parseBooleanRuntimeSetting(undefined, true), true);
  assertEquals(parseBooleanRuntimeSetting(null, false), false);
  assertEquals(parseBooleanRuntimeSetting("maybe", true), true);
});