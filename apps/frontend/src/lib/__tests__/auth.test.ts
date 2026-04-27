import { describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
  signInWithOtp: vi.fn().mockResolvedValue({ data: null, error: null }),
  signInWithOAuth: vi.fn().mockResolvedValue({ data: null, error: null }),
  signOut: vi.fn().mockResolvedValue({ error: null }),
  getSession: vi.fn(),
  onAuthStateChange: vi.fn().mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } },
  }),
}));

vi.mock('../supabase', () => ({
  supabase: { auth: mocks },
  FUNCTIONS_BASE: 'http://test.local/functions/v1',
}));

import { signInWithEmail, signInWithProvider, signOut, useAuth } from '../auth';

describe('auth helpers', () => {
  it('signInWithEmail uses default redirect when none given', async () => {
    Object.defineProperty(window, 'location', {
      value: { origin: 'https://app.example' },
      writable: true,
    });
    await signInWithEmail('user@example.com');
    expect(mocks.signInWithOtp).toHaveBeenCalledWith({
      email: 'user@example.com',
      options: { emailRedirectTo: 'https://app.example/auth/callback' },
    });
  });

  it('signInWithEmail honours an explicit redirect', async () => {
    await signInWithEmail('a@b.co', 'https://other/cb');
    expect(mocks.signInWithOtp).toHaveBeenLastCalledWith({
      email: 'a@b.co',
      options: { emailRedirectTo: 'https://other/cb' },
    });
  });

  it('signInWithProvider passes the provider through', async () => {
    await signInWithProvider('google');
    expect(mocks.signInWithOAuth).toHaveBeenLastCalledWith({
      provider: 'google',
      options: { redirectTo: expect.stringContaining('/auth/callback') },
    });
  });

  it('signOut delegates to supabase.auth.signOut', async () => {
    await signOut();
    expect(mocks.signOut).toHaveBeenCalled();
  });
});

describe('useAuth: ignores benign auth events', () => {
  it('keeps the same user reference when SIGNED_IN re-emits the same session', async () => {
    const session = {
      access_token: 'tok-1',
      user: { id: 'u-1', app_metadata: { role: 'user' } },
    };
    mocks.getSession.mockResolvedValueOnce({ data: { session } });
    let emit: ((event: string, session: any) => void) | null = null;
    mocks.onAuthStateChange.mockImplementationOnce((cb: any) => {
      emit = cb;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    const { result } = renderHook(() => useAuth());
    // flush getSession resolution
    await act(async () => {
      await Promise.resolve();
    });
    const firstUser = result.current.user;
    expect(firstUser?.id).toBe('u-1');

    // Simulate supabase-js firing SIGNED_IN with the same session on
    // visibility change — must NOT change the user reference.
    act(() => {
      emit?.('SIGNED_IN', { ...session, user: { ...session.user } });
    });
    expect(result.current.user).toBe(firstUser);

    // A genuine token refresh with a new access_token must update state.
    act(() => {
      emit?.('TOKEN_REFRESHED', { ...session, access_token: 'tok-2', user: { ...session.user } });
    });
    expect(result.current.session?.access_token).toBe('tok-2');

    // A real sign-out must clear the user.
    act(() => {
      emit?.('SIGNED_OUT', null);
    });
    expect(result.current.user).toBeNull();
  });
});
