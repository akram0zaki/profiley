import { z } from "https://esm.sh/zod@3.23.8";

export { z };

// ----- Auth / profile -----
export const InitializeUserProfileSchema = z.object({
  email: z.string().email().optional(),
  browserLocale: z.string().max(20).optional(),
  timezone: z.string().max(64).optional(),
  preferredLanguage: z.enum(["en", "nl", "ar"]).optional(),
  fullName: z.string().min(1).max(120).optional(),
});

export const UpdateUserLocaleSchema = z.object({
  browserLocale: z.string().max(20).optional(),
  timezone: z.string().max(64).optional(),
  preferredLanguage: z.enum(["en", "nl", "ar"]).optional(),
});

export const AcceptLegalDocumentsSchema = z.object({
  termsAccepted: z.literal(true),
  privacyAccepted: z.literal(true),
  acceptanceSource: z.enum(["in_app_gate"]).default("in_app_gate"),
});

export const RequestAccountDeletionSchema = z.object({
  confirmationText: z.literal("DELETE"),
  requestSource: z.enum(["settings"]).default("settings"),
});

export const CompleteOnboardingSchema = z.object({
  answers: z.array(
    z.object({
      questionKey: z.string().min(1).max(60),
      answerText: z.string().max(4000).nullable().optional(),
      answerJson: z.unknown().optional(),
    }),
  ).max(50),
  profile: z.object({
    fullName: z.string().min(1).max(120).optional(),
    headline: z.string().max(160).optional(),
    shortBio: z.string().max(600).optional(),
    longBio: z.string().max(4000).optional(),
    currentLocation: z.string().max(120).optional(),
    preferredLanguage: z.enum(["en", "nl", "ar"]).optional(),
    timezone: z.string().max(64).optional(),
  }).optional(),
});

export const PublishProfileSchema = z.object({
  publicVisibility: z.boolean(),
});

// Lowercased, must start and end with [a-z0-9], allows internal hyphens.
// Length 3..40 keeps URLs readable and aligns with `baseSlug` cap (40).
export const SLUG_REGEX = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

// Slugs we never let users claim — these can collide with current or future
// app routes, generic admin/system handles, or the public profile URL prefix.
export const RESERVED_SLUGS = new Set<string>([
  "admin", "administrator", "api", "auth", "authentication",
  "dashboard", "settings", "profile", "profiles", "public",
  "login", "logout", "signin", "signup", "register",
  "onboarding", "uploads", "upload", "documents", "system",
  "support", "help", "about", "privacy", "terms",
  "root", "user", "users", "me", "account", "accounts",
  "static", "assets", "favicon", "robots", "sitemap",
  "profiley", "www",
]);

export const UpdateProfileSlugSchema = z.object({
  newSlug: z.string()
    .min(3)
    .max(40)
    .transform((s) => s.trim().toLowerCase())
    .refine((s) => SLUG_REGEX.test(s), {
      message: "Slug must be lowercase letters, digits, or hyphens (no leading/trailing hyphen).",
    })
    .refine((s) => !RESERVED_SLUGS.has(s), { message: "This slug is reserved." }),
});

// ----- Uploads -----
export const CreateUploadUrlSchema = z.object({
  filename: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(120),
  bucket: z.enum(["user_uploads", "avatars", "documents"]).default("user_uploads"),
});

export const FinalizeUploadSchema = z.object({
  bucket: z.enum(["user_uploads", "avatars", "documents"]),
  path: z.string().min(1).max(512),
  originalFilename: z.string().min(1).max(255),
  mimeType: z.string().max(120).optional(),
  fileSize: z.number().int().positive().max(26214400),
  checksumSha256: z.string().length(64).optional(),
});

export const ProcessDocumentSchema = z.object({
  documentId: z.string().uuid(),
});

export const ExtractProfileFromCvSchema = z.object({
  documentId: z.string().uuid().optional(),
  language: z.enum(["en", "nl", "ar"]).optional(),
}).default({});

// ----- Chat -----
export const ChatPersonaSchema = z.object({
  slug: z.string().min(1).max(80),
  message: z.string().min(1).max(4000),
  conversationId: z.string().uuid().nullable().optional(),
  language: z.enum(["en", "nl", "ar"]).optional(),
  visitorSessionId: z.string().min(8).max(128).optional(),
});

export const TestPersonaChatSchema = z.object({
  message: z.string().min(1).max(4000),
  conversationId: z.string().uuid().nullable().optional(),
  language: z.enum(["en", "nl", "ar"]).optional(),
});

// ----- Job-fit -----
export const AnalyzeJobFitSchema = z.object({
  slug: z.string().min(1).max(80),
  jobTitle: z.string().max(200).optional(),
  companyName: z.string().max(200).optional(),
  jobDescription: z.string().min(20).max(16000),
  language: z.enum(["en", "nl", "ar"]).optional(),
  visitorSessionId: z.string().min(8).max(128).optional(),
});

// ----- Public + analytics -----
export const GetPublicProfileSchema = z.object({
  slug: z.string().min(1).max(80),
});

export const TrackRecruiterEventSchema = z.object({
  slug: z.string().min(1).max(80),
  eventName: z.string().min(1).max(60),
  payload: z.record(z.unknown()).optional(),
  visitorSessionId: z.string().min(8).max(128).optional(),
});

export const SubmitRecruiterContactSchema = z.object({
  slug: z.string().min(1).max(80),
  visitorName: z.string().min(1).max(120),
  visitorEmail: z.string().email().max(200),
  company: z.string().max(160).optional(),
  message: z.string().min(10).max(4000),
  captchaToken: z.string().min(1).optional(),
  visitorSessionId: z.string().min(8).max(128).optional(),
});

// ----- Admin -----
export const AdminSetFeatureModelSchema = z.object({
  featureKey: z.string().min(1).max(60),
  capability: z.enum(["chat", "embeddings", "stt", "tts", "moderation"]),
  providerConfigId: z.string().uuid(),
});

export const AdminCreateModelSchema = z.object({
  capability: z.enum(["chat", "embeddings", "stt", "tts", "moderation"]),
  provider: z.string().min(1).max(40),
  modelKey: z.string().min(1).max(120),
  displayName: z.string().min(1).max(160),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
  configJson: z.record(z.unknown()).optional(),
});

export const AdminToggleModelSchema = z.object({
  id: z.string().uuid(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
});

// ----- Avatar (post-MVP) -----
export const CreateAvatarProfileSchema = z.object({
  sourcePhotoPath: z.string().min(1).max(512),
  voiceProvider: z.string().max(40).optional(),
  voiceModel: z.string().max(120).optional(),
});
