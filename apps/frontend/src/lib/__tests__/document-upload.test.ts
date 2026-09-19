import { beforeEach, describe, expect, it, vi } from 'vitest';
import { uploadUserDocument, validateDocumentFile } from '../document-upload';

const createUploadUrlMock = vi.fn();
const finalizeUploadMock = vi.fn();
const uploadToSignedUrlMock = vi.fn();

vi.mock('../api', async () => {
  const actual = await vi.importActual('../api');
  return {
    ...actual,
    api: {
      createUploadUrl: (...args: unknown[]) => createUploadUrlMock(...args),
      finalizeUpload: (...args: unknown[]) => finalizeUploadMock(...args),
    },
  };
});

vi.mock('../supabase', () => ({
  supabase: {
    storage: {
      from: () => ({
        uploadToSignedUrl: (...args: unknown[]) => uploadToSignedUrlMock(...args),
      }),
    },
  },
}));

describe('document upload helper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(globalThis.crypto.subtle, 'digest').mockResolvedValue(new ArrayBuffer(32));
    createUploadUrlMock.mockResolvedValue({
      bucket: 'user_uploads',
      path: 'user-1/cv.pdf',
      token: 'token-1',
      signedUrl: 'https://example.test/upload',
      documentKind: 'cv',
    });
    uploadToSignedUrlMock.mockResolvedValue({ error: null });
    finalizeUploadMock.mockResolvedValue({ documentId: 'doc-1' });
  });

  it('validates unsupported files before upload', () => {
    const file = new File(['exe'], 'resume.exe', { type: 'application/octet-stream' });
    expect(validateDocumentFile(file)).toEqual({
      code: 'unsupported',
      filename: 'resume.exe',
      mimeType: 'application/octet-stream',
    });
  });

  it('uploads a CV with documentKind=cv', async () => {
    const file = new File(['resume'], 'resume.pdf', { type: 'application/pdf' });
    Object.defineProperty(file, 'arrayBuffer', {
      value: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
    });

    await uploadUserDocument(file, { documentKind: 'cv' });

    expect(createUploadUrlMock).toHaveBeenCalledWith(
      expect.objectContaining({
        filename: 'resume.pdf',
        documentKind: 'cv',
      }),
    );
    expect(finalizeUploadMock).toHaveBeenCalledWith(
      expect.objectContaining({
        originalFilename: 'resume.pdf',
        documentKind: 'cv',
      }),
    );
  });
});