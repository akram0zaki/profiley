import { describe, expect, it } from 'vitest';

import {
  normalizeSocialLink,
  normalizeSocialLinks,
  socialLinkDisplayValue,
  socialLinkHref,
} from '../social-links';

describe('social-links helpers', () => {
  it('normalizes handles and URLs to canonical platform values', () => {
    expect(normalizeSocialLink('linkedin', 'linkedin.com/in/test-user/')).toBe('https://www.linkedin.com/in/test-user');
    expect(normalizeSocialLink('github', 'test-user')).toBe('https://github.com/test-user');
    expect(normalizeSocialLink('twitter', '@test_user')).toBe('https://x.com/test_user');
    expect(normalizeSocialLink('discord', 'test-user#1234')).toBe('test-user#1234');
  });

  it('returns the first invalid platform when normalizing a form map', () => {
    const out = normalizeSocialLinks({ linkedin: 'not a valid link', github: 'valid-user' });
    expect(out.invalidPlatform).toBe('linkedin');
    expect(out.normalized).toEqual({});
  });

  it('builds display values and hrefs for public rendering', () => {
    expect(socialLinkHref('https://x.com/test_user')).toBe('https://x.com/test_user');
    expect(socialLinkHref('test-user#1234')).toBeNull();
    expect(socialLinkDisplayValue('twitter', 'https://x.com/test_user')).toBe('@test_user');
    expect(socialLinkDisplayValue('discord', 'test-user#1234')).toBe('test-user#1234');
  });
});