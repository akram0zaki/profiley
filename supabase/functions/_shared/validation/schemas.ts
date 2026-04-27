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
