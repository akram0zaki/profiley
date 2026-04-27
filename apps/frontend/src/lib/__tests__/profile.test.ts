import { describe, expect, it, vi } from 'vitest';

const getPublicUrl = vi.fn();
vi.mock('../supabase', () => ({
  FUNCTIONS_BASE: 'http://test/functions/v1',
  supabase: {
    storage: { from: () => ({ getPublicUrl }) },
    auth: { getSession: vi.fn(), onAuthStateChange: vi.fn() },
  },
}));

import { avatarPublicUrl } from '../profile';

describe('avatarPublicUrl', () => {
  it('returns null for null path', () => {
    expect(avatarPublicUrl(null)).toBeNull();
    expect(getPublicUrl).not.toHaveBeenCalled();
  });

  it('returns the storage public URL for a real path', () => {
    getPublicUrl.mockReturnValue({ data: { publicUrl: 'https://cdn/avatar.png' } });
    expect(avatarPublicUrl('user/123.png')).toBe('https://cdn/avatar.png');
    expect(getPublicUrl).toHaveBeenCalledWith('user/123.png');
  });

  it('returns null when supabase storage returns no url', () => {
    getPublicUrl.mockReturnValue({ data: { publicUrl: null } });
    expect(avatarPublicUrl('a.png')).toBeNull();
  });
});
