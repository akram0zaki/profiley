import { describe, expect, it, vi } from 'vitest';

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

import { signInWithEmail, signInWithProvider, signOut } from '../auth';

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
