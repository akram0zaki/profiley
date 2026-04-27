import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  AdminCreateModelSchema,
  AdminSetFeatureModelSchema,
  AnalyzeJobFitSchema,
  ChatPersonaSchema,
  CompleteOnboardingSchema,
  CreateUploadUrlSchema,
  ExtractProfileFromCvSchema,
  FinalizeUploadSchema,
  GetPublicProfileSchema,
  InitializeUserProfileSchema,
  PublishProfileSchema,
  RESERVED_SLUGS,
  SubmitRecruiterContactSchema,
  TrackRecruiterEventSchema,
  UpdateProfileSlugSchema,
  UpdateUserLocaleSchema,
} from "../functions/_shared/validation/schemas.ts";

Deno.test("InitializeUserProfileSchema: accepts empty + restricts language enum", () => {
  assert(InitializeUserProfileSchema.safeParse({}).success);
  assert(
    InitializeUserProfileSchema.safeParse({
      email: "a@b.co",
      preferredLanguage: "ar",
    }).success,
  );
  assert(!InitializeUserProfileSchema.safeParse({ preferredLanguage: "fr" }).success);
  assert(!InitializeUserProfileSchema.safeParse({ email: "not-an-email" }).success);
});

Deno.test("UpdateUserLocaleSchema: enforces enum + length caps", () => {
  assert(UpdateUserLocaleSchema.safeParse({ preferredLanguage: "nl" }).success);
  assert(!UpdateUserLocaleSchema.safeParse({ timezone: "x".repeat(65) }).success);
});

Deno.test("CompleteOnboardingSchema: requires question keys, caps answers at 50", () => {
  const ok = CompleteOnboardingSchema.safeParse({
    answers: [{ questionKey: "name", answerText: "Alice" }],
    profile: { fullName: "Alice", headline: "Eng" },
  });
  assert(ok.success);

  const tooMany = CompleteOnboardingSchema.safeParse({
    answers: Array.from({ length: 51 }, (_, i) => ({ questionKey: `q${i}` })),
  });
  assert(!tooMany.success);

  const missingKey = CompleteOnboardingSchema.safeParse({
    answers: [{ answerText: "x" }],
  });
  assert(!missingKey.success);
});

Deno.test("PublishProfileSchema: requires boolean", () => {
  assert(PublishProfileSchema.safeParse({ publicVisibility: true }).success);
  assert(!PublishProfileSchema.safeParse({}).success);
  assert(!PublishProfileSchema.safeParse({ publicVisibility: "yes" }).success);
});

Deno.test("UpdateProfileSlugSchema: lowercases, enforces format and length", () => {
  const ok = UpdateProfileSlugSchema.safeParse({ newSlug: "Akram-Z" });
  assert(ok.success);
  assertEquals(ok.data!.newSlug, "akram-z");

  // Too short
  assert(!UpdateProfileSlugSchema.safeParse({ newSlug: "ab" }).success);
  // Too long
  assert(!UpdateProfileSlugSchema.safeParse({ newSlug: "a".repeat(41) }).success);
  // Leading hyphen
  assert(!UpdateProfileSlugSchema.safeParse({ newSlug: "-akram" }).success);
  // Trailing hyphen
  assert(!UpdateProfileSlugSchema.safeParse({ newSlug: "akram-" }).success);
  // Disallowed characters
  assert(!UpdateProfileSlugSchema.safeParse({ newSlug: "akram zaki" }).success);
  assert(!UpdateProfileSlugSchema.safeParse({ newSlug: "akram_zaki" }).success);
});

Deno.test("UpdateProfileSlugSchema: rejects reserved slugs (case-insensitive)", () => {
  assert(RESERVED_SLUGS.has("admin"));
  assert(!UpdateProfileSlugSchema.safeParse({ newSlug: "Admin" }).success);
  assert(!UpdateProfileSlugSchema.safeParse({ newSlug: "api" }).success);
  assert(!UpdateProfileSlugSchema.safeParse({ newSlug: "settings" }).success);
});

Deno.test("CreateUploadUrlSchema: defaults bucket to user_uploads, restricts enum", () => {
  const r = CreateUploadUrlSchema.safeParse({ filename: "cv.pdf", mimeType: "application/pdf" });
  assert(r.success && r.data.bucket === "user_uploads");
  assert(!CreateUploadUrlSchema.safeParse({ filename: "", mimeType: "application/pdf" }).success);
  assert(
    !CreateUploadUrlSchema.safeParse({
      filename: "a.pdf",
      mimeType: "application/pdf",
      bucket: "evil",
    }).success,
  );
});

Deno.test("FinalizeUploadSchema: 25MB upper bound + sha256 length", () => {
  const max = 25 * 1024 * 1024;
  assert(
    FinalizeUploadSchema.safeParse({
      bucket: "user_uploads",
      path: "u/1.pdf",
      originalFilename: "1.pdf",
      fileSize: max,
    }).success,
  );
  assert(
    !FinalizeUploadSchema.safeParse({
      bucket: "user_uploads",
      path: "u/1.pdf",
      originalFilename: "1.pdf",
      fileSize: max + 1,
    }).success,
  );
  assert(
    !FinalizeUploadSchema.safeParse({
      bucket: "user_uploads",
      path: "u/1.pdf",
      originalFilename: "1.pdf",
      fileSize: 10,
      checksumSha256: "deadbeef", // wrong length
    }).success,
  );
});

Deno.test("ChatPersonaSchema: message length limits + nullable conversationId", () => {
  assert(
    ChatPersonaSchema.safeParse({
      slug: "alice",
      message: "Hi",
      conversationId: null,
    }).success,
  );
  assert(
    !ChatPersonaSchema.safeParse({
      slug: "alice",
      message: "x".repeat(4001),
    }).success,
  );
  assert(!ChatPersonaSchema.safeParse({ slug: "alice", message: "" }).success);
  assert(
    !ChatPersonaSchema.safeParse({
      slug: "alice",
      message: "Hi",
      conversationId: "not-a-uuid",
    }).success,
  );
});

Deno.test("AnalyzeJobFitSchema: requires substantive job description", () => {
  assert(
    AnalyzeJobFitSchema.safeParse({
      slug: "alice",
      jobDescription: "Backend engineer with TS experience",
    }).success,
  );
  assert(!AnalyzeJobFitSchema.safeParse({ slug: "alice", jobDescription: "short" }).success);
});

Deno.test("GetPublicProfileSchema + Track + Submit recruiter contact", () => {
  assert(GetPublicProfileSchema.safeParse({ slug: "alice" }).success);
  assert(
    TrackRecruiterEventSchema.safeParse({ slug: "alice", eventName: "view" }).success,
  );

  const okContact = SubmitRecruiterContactSchema.safeParse({
    slug: "alice",
    visitorName: "Bob",
    visitorEmail: "bob@co.example",
    message: "Hi there, are you available for a chat?",
  });
  assert(okContact.success);

  const tooShort = SubmitRecruiterContactSchema.safeParse({
    slug: "alice",
    visitorName: "Bob",
    visitorEmail: "bob@co.example",
    message: "hi",
  });
  assert(!tooShort.success);
});

Deno.test("Admin schemas enforce capability enum + UUIDs", () => {
  assertEquals(
    AdminSetFeatureModelSchema.safeParse({
      featureKey: "chat",
      capability: "chat",
      providerConfigId: "00000000-0000-4000-8000-000000000000",
    }).success,
    true,
  );
  assert(
    !AdminSetFeatureModelSchema.safeParse({
      featureKey: "chat",
      capability: "video", // not a valid Capability
      providerConfigId: "00000000-0000-4000-8000-000000000000",
    }).success,
  );

  const create = AdminCreateModelSchema.safeParse({
    capability: "chat",
    provider: "openai",
    modelKey: "gpt-4o-mini",
    displayName: "GPT-4o mini",
  });
  assert(create.success && create.data.isActive === true && create.data.isDefault === false);
});

Deno.test("ExtractProfileFromCvSchema: empty body OK, optional documentId UUID, language enum", () => {
  // Empty body is valid (defaults to {}).
  const empty = ExtractProfileFromCvSchema.safeParse(undefined);
  assert(empty.success);

  assert(ExtractProfileFromCvSchema.safeParse({}).success);
  assert(
    ExtractProfileFromCvSchema.safeParse({
      documentId: "11111111-1111-1111-1111-111111111111",
      language: "ar",
    }).success,
  );
  assert(!ExtractProfileFromCvSchema.safeParse({ documentId: "not-a-uuid" }).success);
  assert(!ExtractProfileFromCvSchema.safeParse({ language: "fr" }).success);
});
