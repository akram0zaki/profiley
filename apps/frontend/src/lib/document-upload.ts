import { api, type DocumentKind } from './api';
import { supabase } from './supabase';

export const ACCEPTED_DOCUMENT_MIMES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown',
]);

export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

export type UploadValidationErrorCode = 'tooLarge' | 'legacyDoc' | 'unsupported';

export type UploadValidationResult =
  | { code: UploadValidationErrorCode; filename: string; mimeType?: string }
  | null;

async function sha256Hex(buf: ArrayBuffer): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export function validateDocumentFile(file: File): UploadValidationResult {
  if (file.size > MAX_DOCUMENT_BYTES) {
    return { code: 'tooLarge', filename: file.name };
  }

  const lowerName = file.name.toLowerCase();
  const isLegacyDoc =
    file.type === 'application/msword' ||
    (lowerName.endsWith('.doc') && !lowerName.endsWith('.docx'));
  if (isLegacyDoc) {
    return { code: 'legacyDoc', filename: file.name };
  }

  if (file.type && !ACCEPTED_DOCUMENT_MIMES.has(file.type)) {
    return { code: 'unsupported', filename: file.name, mimeType: file.type };
  }

  return null;
}

export async function uploadUserDocument(file: File, options: { documentKind: DocumentKind; bucket?: 'user_uploads' | 'avatars' | 'documents' }) {
  const bucket = options.bucket ?? 'user_uploads';
  const created = await api.createUploadUrl({
    filename: file.name,
    mimeType: file.type || 'application/octet-stream',
    bucket,
    documentKind: options.documentKind,
  });
  const { error: uploadError } = await supabase.storage
    .from(created.bucket)
    .uploadToSignedUrl(created.path, created.token, file, {
      contentType: file.type,
      upsert: true,
    });
  if (uploadError) throw uploadError;

  const checksumSha256 = await sha256Hex(await file.arrayBuffer());
  return await api.finalizeUpload({
    bucket: created.bucket as 'user_uploads' | 'avatars' | 'documents',
    path: created.path,
    originalFilename: file.name,
    mimeType: file.type,
    fileSize: file.size,
    checksumSha256,
    documentKind: options.documentKind,
  });
}