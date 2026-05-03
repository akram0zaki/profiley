import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const authMocks = vi.hoisted(() => {
  let authListener: ((event: string, session: any) => void) | null = null;
  const onAuthStateChange = vi.fn();

  const installOnAuthStateChange = () => {
    onAuthStateChange.mockImplementation((callback) => {
      authListener = callback;
      return {
        data: {
          subscription: {
            unsubscribe: vi.fn(() => {
              authListener = null;
            }),
          },
        },
      };
    });
  };

  installOnAuthStateChange();

  return {
    getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    onAuthStateChange,
    emitAuthState: (event: string, session: any) => {
      authListener?.(event, session);
    },
    reset: () => {
      authListener = null;
      onAuthStateChange.mockReset();
      installOnAuthStateChange();
    },
  };
});

vi.mock('../supabase', () => ({
  FUNCTIONS_BASE: 'http://test.local/functions/v1',
  supabase: {
    auth: {
      getSession: authMocks.getSession,
      onAuthStateChange: authMocks.onAuthStateChange,
    },
  },
}));

import { ApiError, callFn, visitorSessionId } from '../api';
import { supabase } from '../supabase';

describe('callFn', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    globalThis.fetch = fetchMock as any;
    fetchMock.mockReset();
    authMocks.reset();
    authMocks.getSession.mockReset();
    authMocks.getSession.mockResolvedValue({ data: { session: { access_token: 'jwt-default' } } });
    localStorage.clear();
  });

  afterEach(() => {
    delete (globalThis as any).fetch;
  });

  function jsonResponse(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json' },
    });
  }

  it('returns data from a success envelope', async () => {
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: { access_token: 'jwt-123' } },
    });
    fetchMock.mockResolvedValue(
      jsonResponse({ success: true, data: { ok: 1 }, error: null }),
    );
    const out = await callFn<{ ok: number }>('foo', { x: 1 });
    expect(out).toEqual({ ok: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://test.local/functions/v1/foo');
    expect((init as RequestInit).method).toBe('POST');
    const headers = (init as RequestInit).headers as Record<string, string>;
    expect(headers['Content-Type']).toBe('application/json');
    expect(headers['X-Visitor-Session']).toBeTruthy();
    expect(headers['apikey']).toBe('test-anon-key');
    expect(headers['Authorization']).toBe('Bearer jwt-123');
  });

  it('uses session bearer token when authenticated', async () => {
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: { access_token: 'jwt-123' } },
    });
    fetchMock.mockResolvedValue(jsonResponse({ success: true, data: null, error: null }));
    await callFn('bar', {});
    const headers = (fetchMock.mock.calls[0][1] as RequestInit).headers as Record<string, string>;
    expect(headers['Authorization']).toBe('Bearer jwt-123');
  });

  it('waits briefly for auth hydration before calling protected functions', async () => {
    (supabase.auth.getSession as any).mockResolvedValue({ data: { session: null } });
    fetchMock.mockResolvedValue(jsonResponse({ success: true, data: { ok: true }, error: null }));

    const pending = callFn<{ ok: boolean }>('late-auth', {});
    expect(fetchMock).not.toHaveBeenCalled();

    authMocks.emitAuthState('SIGNED_IN', { access_token: 'jwt-late' });

    await expect(pending).resolves.toEqual({ ok: true });
    const headers = (fetchMock.mock.calls[0][1] as RequestInit).headers as Record<string, string>;
    expect(headers['Authorization']).toBe('Bearer jwt-late');
  });

  it('throws when a protected call has no authenticated session', async () => {
    (supabase.auth.getSession as any).mockResolvedValue({ data: { session: null } });
    vi.useFakeTimers();
    try {
      const pending = callFn('needs-auth', {});
      const rejection = expect(pending).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
        status: 401,
      });
      await vi.advanceTimersByTimeAsync(800);
      await rejection;
      expect(fetchMock).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it('throws ApiError when envelope reports an error', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        { success: false, data: null, error: { code: 'BAD', message: 'nope' } },
        400,
      ),
    );
    await expect(callFn('baz', {})).rejects.toMatchObject({
      name: 'Error',
      code: 'BAD',
      message: 'nope',
      status: 400,
    });
  });

  it('throws ApiError when response is not JSON', async () => {
    fetchMock.mockResolvedValue(new Response('not-json', { status: 502 }));
    await expect(callFn('boom', {})).rejects.toBeInstanceOf(ApiError);
  });

  it('builds GET querystring from body and skips JSON body', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ success: true, data: null, error: null }));
    await callFn('qry', { slug: 'alice' }, { method: 'GET' });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://test.local/functions/v1/qry?slug=alice');
    expect((init as RequestInit).body).toBeUndefined();
    expect((init as RequestInit).method).toBe('GET');
  });

  it('omits the user JWT when auth: false even if session exists', async () => {
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: { access_token: 'jwt-123' } },
    });
    fetchMock.mockResolvedValue(jsonResponse({ success: true, data: null, error: null }));
    await callFn('pub', {}, { auth: false });
    const headers = (fetchMock.mock.calls[0][1] as RequestInit).headers as Record<string, string>;
    expect(headers['Authorization']).toBe('Bearer test-anon-key');
  });

  it('reuses the visitor session id between calls', async () => {
    // The module caches the id in a module-level variable; reset modules so
    // this test sees a fresh first-call path that also writes to localStorage.
    vi.resetModules();
    const { visitorSessionId: freshVsi } = await import('../api');
    const id = freshVsi();
    expect(id).toMatch(/^[0-9a-f-]{8,}/i);
    expect(freshVsi()).toBe(id);
    expect(localStorage.getItem('profiley-visitor-session')).toBe(id);
  });

  it('uses the export-user-data endpoint for self-service exports', async () => {
    const { api } = await import('../api');
    fetchMock.mockResolvedValue(
      jsonResponse({
        success: true,
        data: {
          manifest: {
            exportedAt: '2026-05-03T12:00:00.000Z',
            profileyVersion: 'self-service-export-v1',
            subjectUserId: 'user-1',
            deliveryMode: 'self_service_download',
            format: 'json_bundle',
            tables: [],
            tableCounts: {},
            storageArtifacts: [],
          },
          tables: {},
        },
        error: null,
      }),
    );

    await api.exportUserData();

    expect(fetchMock.mock.calls[0][0]).toBe('http://test.local/functions/v1/export-user-data');
  });
});

describe('ApiError', () => {
  it('carries code, status, details', () => {
    const err = new ApiError('X', 'msg', 418, { hint: 'teapot' });
    expect(err).toBeInstanceOf(Error);
    expect(err.code).toBe('X');
    expect(err.status).toBe(418);
    expect(err.details).toEqual({ hint: 'teapot' });
  });
});
