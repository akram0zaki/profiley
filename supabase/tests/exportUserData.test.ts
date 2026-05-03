import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  USER_DATA_EXPORT_TABLES,
  USER_DATA_EXPORT_VERSION,
  buildUserDataExportBundle,
} from "../functions/_shared/exportUserData.ts";

Deno.test("buildUserDataExportBundle: returns a stable manifest and table counts", () => {
  const bundle = buildUserDataExportBundle(
    "user-123",
    {
      app_users: [{ id: "user-123", email: "user@example.com" }],
      profiles: [{ id: "profile-1", user_id: "user-123", profile_photo_path: "avatars/user-123.png" }],
      uploaded_documents: [{ id: "doc-1", storage_path: "documents/user-123/resume.pdf" }],
      knowledge_chunks: [{ id: "chunk-1", user_id: "user-123" }],
    },
    "2026-05-03T12:00:00.000Z",
  );

  assertEquals(bundle.manifest.subjectUserId, "user-123");
  assertEquals(bundle.manifest.exportedAt, "2026-05-03T12:00:00.000Z");
  assertEquals(bundle.manifest.profileyVersion, USER_DATA_EXPORT_VERSION);
  assertEquals(bundle.manifest.deliveryMode, "self_service_download");
  assertEquals(bundle.manifest.format, "json_bundle");
  assertEquals(bundle.manifest.tables, [...USER_DATA_EXPORT_TABLES]);
  assertEquals(bundle.manifest.tableCounts.app_users, 1);
  assertEquals(bundle.manifest.tableCounts.profiles, 1);
  assertEquals(bundle.manifest.tableCounts.uploaded_documents, 1);
  assertEquals(bundle.manifest.tableCounts.messages, 0);
  assertEquals(bundle.tables.profile_preferences.length, 0);
  assertEquals(bundle.tables.knowledge_chunks.length, 1);
});

Deno.test("buildUserDataExportBundle: lists storage artifacts referenced by the export", () => {
  const bundle = buildUserDataExportBundle(
    "user-123",
    {
      profiles: [{ id: "profile-1", profile_photo_path: "avatars/user-123.png" }],
      uploaded_documents: [
        { id: "doc-1", storage_path: "documents/user-123/resume.pdf" },
        { id: "doc-2", storage_path: "documents/user-123/cover-letter.pdf" },
      ],
    },
    "2026-05-03T12:00:00.000Z",
  );

  assertEquals(bundle.manifest.storageArtifacts.length, 3);

  const [photo, resume, coverLetter] = bundle.manifest.storageArtifacts;
  assertExists(photo);
  assertEquals(photo.kind, "profile_photo");
  assertEquals(photo.bucket, "avatars");
  assertEquals(resume.kind, "uploaded_document");
  assertEquals(resume.bucket, "documents");
  assertEquals(coverLetter.path, "documents/user-123/cover-letter.pdf");
});