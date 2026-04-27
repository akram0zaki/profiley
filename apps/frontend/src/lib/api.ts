// Typed client wrappers for our Supabase edge functions.

import { FUNCTIONS_BASE, supabase } from './supabase';

export type Envelope<T> = {
  success: boolean;
  data: T | null;
  error: { code: string; message: string; details?: unknown } | null;
  meta?: Record<string, unknown>;
};

let _visitorSessionId: string | null = null;
function visitorSessionId(): string {
  if (_visitorSessionId) return _visitorSessionId;
  const KEY = 'profiley-visitor-session';
  const existing = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null;
  if (existing) {
    _visitorSessionId = existing;
    return existing;
  }
  const id = (crypto.randomUUID?.() ?? `v-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  if (typeof localStorage !== 'undefined') localStorage.setItem(KEY, id);
  _visitorSessionId = id;
  return id;
}

export async function callFn<T>(
  name: string,
  body?: unknown,
  opts: { method?: 'GET' | 'POST'; auth?: boolean } = {},
): Promise<T> {
  const method = opts.method ?? 'POST';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Visitor-Session': visitorSessionId(),
  };
  const anon = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY) as string | undefined;
  if (anon) headers['apikey'] = anon;

  if (opts.auth !== false) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    } else if (anon) {
      headers['Authorization'] = `Bearer ${anon}`;
    }
  } else if (anon) {
    headers['Authorization'] = `Bearer ${anon}`;
  }

  const url = method === 'GET' && body
    ? `${FUNCTIONS_BASE}/${name}?${new URLSearchParams(body as Record<string, string>)}`
    : `${FUNCTIONS_BASE}/${name}`;

  const res = await fetch(url, {
    method,
    headers,
    body: method === 'GET' ? undefined : JSON.stringify(body ?? {}),
  });
  let json: Envelope<T>;
  try {
    json = await res.json();
  } catch {
    throw new ApiError('INVALID_RESPONSE', `Non-JSON response (${res.status})`, res.status);
  }
  if (!json.success || json.error) {
    throw new ApiError(json.error?.code ?? 'ERROR', json.error?.message ?? 'Request failed', res.status, json.error?.details);
  }
  return json.data as T;
}

export class ApiError extends Error {
  constructor(public code: string, message: string, public status: number, public details?: unknown) {
    super(message);
  }
}

// Convenience wrappers per endpoint.
export const api = {
  initializeUserProfile: (b: { email?: string; browserLocale?: string; timezone?: string; preferredLanguage?: string; fullName?: string }) =>
    callFn('initialize-user-profile', b),
  updateUserLocale: (b: { browserLocale?: string; timezone?: string; preferredLanguage?: string }) =>
    callFn('update-user-locale', b),
  completeOnboarding: (b: unknown) => callFn('complete-onboarding', b),
  publishProfile: (b: { publicVisibility: boolean }) => callFn('publish-profile', b),
  createUploadUrl: (b: { filename: string; mimeType: string; bucket?: 'user_uploads' | 'avatars' | 'documents' }) =>
    callFn<{ bucket: string; path: string; signedUrl: string; token: string }>('create-upload-url', b),
  finalizeUpload: (b: unknown) => callFn<{ documentId: string }>('finalize-upload', b),
  listUserDocuments: () => callFn<{ documents: any[] }>('list-user-documents', {}, { method: 'POST' }),
  deleteDocument: (b: { documentId: string }) => callFn('delete-document', b),
  testPersonaChat: (b: unknown) => callFn<{ conversationId: string | null; message: string; citations: any[]; modelUsed: string; language: string }>('test-persona-chat', b),
  chatPersona: (b: unknown) => callFn<{ conversationId: string | null; message: string; citations: any[]; modelUsed: string; language: string }>('chat-persona', b, { auth: false }),
  analyzeJobFit: (b: unknown) => callFn<any>('analyze-job-fit', b, { auth: false }),
  getPublicProfile: (slug: string) => callFn<any>('get-public-profile', { slug }, { method: 'GET', auth: false }),
  trackRecruiterEvent: (b: unknown) => callFn('track-recruiter-event', b, { auth: false }),
  submitRecruiterContact: (b: unknown) => callFn('submit-recruiter-contact', b, { auth: false }),
  adminListModels: () => callFn<{ configs: any[]; assignments: any[] }>('admin-list-models', {}, { method: 'POST' }),
  adminSetFeatureModel: (b: unknown) => callFn('admin-set-feature-model', b),
  adminCreateModel: (b: unknown) => callFn('admin-create-model', b),
  adminToggleModel: (b: unknown) => callFn('admin-toggle-model', b),
  adminProviderHealth: (hours = 24) => callFn<{ hours: number; summary: any[] }>('admin-provider-health', { hours: String(hours) }, { method: 'GET' }),
  adminListModeration: () => callFn<{ events: any[] }>('admin-list-moderation', {}, { method: 'GET' }),
  adminResolveModeration: (b: unknown) => callFn('admin-resolve-moderation', b),
  adminListProfiles: () => callFn<{ profiles: any[] }>('admin-list-profiles', {}, { method: 'GET' }),
  adminForceUnpublish: (b: unknown) => callFn('admin-force-unpublish', b),
  adminRenameSlug: (b: unknown) => callFn('admin-rename-slug', b),
};

export { visitorSessionId };
