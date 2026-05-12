export const SOCIAL_PLATFORMS = [
  'linkedin',
  'github',
  'twitter',
  'reddit',
  'discord',
  'instagram',
  'tiktok',
  'youtube',
] as const;

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];
export type SocialLinks = Partial<Record<SocialPlatform, string>>;
export type SocialVisibilityMap = Partial<Record<SocialPlatform, boolean>>;

export const SOCIAL_PLATFORM_META: Record<SocialPlatform, { label: string; example: string }> = {
  linkedin: { label: 'LinkedIn', example: 'linkedin.com/in/your-name' },
  github: { label: 'GitHub', example: 'github.com/your-handle' },
  twitter: { label: 'X / Twitter', example: '@yourhandle' },
  reddit: { label: 'Reddit', example: 'u/yourname' },
  discord: { label: 'Discord', example: 'username or username#1234' },
  instagram: { label: 'Instagram', example: '@yourhandle' },
  tiktok: { label: 'TikTok', example: '@yourhandle' },
  youtube: { label: 'YouTube', example: '@yourchannel' },
};

const TRAILING_PUNCTUATION_REGEX = /[),.;:!?]+$/;
const DISCORD_HANDLE_REGEX = /^[A-Za-z0-9._-]{2,32}(?:#[0-9]{4})?$/;

function stripTrailingPunctuation(value: string): string {
  return value.trim().replace(TRAILING_PUNCTUATION_REGEX, '');
}

function looksLikeUrl(value: string): boolean {
  return /^https?:\/\//i.test(value)
    || /^www\./i.test(value)
    || /^[A-Za-z0-9.-]+\.[A-Za-z]{2,}(?:\/|$)/.test(value);
}

function normalizeUrl(raw: string): URL | null {
  const cleaned = stripTrailingPunctuation(raw);
  if (!cleaned) return null;

  try {
    return new URL(cleaned.startsWith('http') ? cleaned : `https://${cleaned}`);
  } catch {
    return null;
  }
}

function cleanHandle(raw: string): string {
  return stripTrailingPunctuation(raw)
    .replace(/^@+/, '')
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .trim();
}

function canonicalizeUrl(url: URL): string {
  url.hash = '';
  url.search = '';
  url.pathname = url.pathname.replace(/\/+$/, '');
  return url.toString();
}

export function normalizeSocialLink(platform: SocialPlatform, raw: string): string | null {
  const value = stripTrailingPunctuation(raw);
  if (!value) return null;
  const url = looksLikeUrl(value) ? normalizeUrl(value) : null;

  switch (platform) {
    case 'linkedin': {
      if (url) {
        const host = url.hostname.toLowerCase().replace(/^www\./, '');
        if (host !== 'linkedin.com') return null;
        const parts = url.pathname.split('/').filter(Boolean);
        if (parts.length < 2 || !['in', 'pub', 'company'].includes(parts[0])) return null;
        return canonicalizeUrl(new URL(`https://www.linkedin.com/${parts[0]}/${parts[1]}`));
      }
      const handle = cleanHandle(value).replace(/^linkedin\.com\//i, '');
      if (!handle || /\s/.test(handle)) return null;
      return `https://www.linkedin.com/in/${handle.replace(/^in\//i, '')}`;
    }
    case 'github': {
      if (url) {
        const host = url.hostname.toLowerCase().replace(/^www\./, '');
        if (host !== 'github.com') return null;
        const handle = url.pathname.split('/').filter(Boolean)[0];
        if (!handle) return null;
        return `https://github.com/${handle}`;
      }
      const handle = cleanHandle(value).split('/')[0];
      if (!/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/.test(handle)) return null;
      return `https://github.com/${handle}`;
    }
    case 'twitter': {
      if (url) {
        const host = url.hostname.toLowerCase().replace(/^www\./, '');
        if (host !== 'x.com' && host !== 'twitter.com') return null;
        const handle = url.pathname.split('/').filter(Boolean)[0];
        if (!handle) return null;
        return `https://x.com/${handle.replace(/^@/, '')}`;
      }
      const handle = cleanHandle(value).replace(/^x\.com\//i, '').replace(/^twitter\.com\//i, '');
      if (!/^[A-Za-z0-9_]{1,15}$/.test(handle)) return null;
      return `https://x.com/${handle}`;
    }
    case 'reddit': {
      if (url) {
        const host = url.hostname.toLowerCase().replace(/^www\./, '');
        if (host !== 'reddit.com') return null;
        const parts = url.pathname.split('/').filter(Boolean);
        if (parts.length < 2 || !['u', 'user'].includes(parts[0])) return null;
        return `https://www.reddit.com/user/${parts[1]}`;
      }
      const handle = cleanHandle(value).replace(/^u\//i, '').replace(/^user\//i, '');
      if (!/^[A-Za-z0-9_-]{2,32}$/.test(handle)) return null;
      return `https://www.reddit.com/user/${handle}`;
    }
    case 'discord': {
      if (url) {
        const host = url.hostname.toLowerCase().replace(/^www\./, '');
        if (!['discord.gg', 'discord.com', 'discordapp.com'].includes(host)) return null;
        return canonicalizeUrl(url);
      }
      const handle = cleanHandle(value);
      return DISCORD_HANDLE_REGEX.test(handle) ? handle : null;
    }
    case 'instagram': {
      if (url) {
        const host = url.hostname.toLowerCase().replace(/^www\./, '');
        if (host !== 'instagram.com') return null;
        const handle = url.pathname.split('/').filter(Boolean)[0];
        if (!handle) return null;
        return `https://www.instagram.com/${handle}`;
      }
      const handle = cleanHandle(value).replace(/^instagram\.com\//i, '');
      if (!/^[A-Za-z0-9._]{1,30}$/.test(handle)) return null;
      return `https://www.instagram.com/${handle}`;
    }
    case 'tiktok': {
      if (url) {
        const host = url.hostname.toLowerCase().replace(/^www\./, '');
        if (host !== 'tiktok.com') return null;
        const handle = url.pathname.split('/').filter(Boolean)[0];
        if (!handle) return null;
        return `https://www.tiktok.com/${handle.startsWith('@') ? handle : `@${handle}`}`;
      }
      const handle = cleanHandle(value).replace(/^tiktok\.com\//i, '').replace(/^@/, '');
      if (!/^[A-Za-z0-9._]{2,24}$/.test(handle)) return null;
      return `https://www.tiktok.com/@${handle}`;
    }
    case 'youtube': {
      if (url) {
        const host = url.hostname.toLowerCase().replace(/^www\./, '');
        if (host !== 'youtube.com' && host !== 'youtu.be') return null;
        return canonicalizeUrl(url);
      }
      const handle = cleanHandle(value).replace(/^youtube\.com\//i, '');
      if (!handle) return null;
      return handle.startsWith('@')
        ? `https://www.youtube.com/${handle}`
        : `https://www.youtube.com/@${handle}`;
    }
  }
}

export function normalizeSocialLinks(inputs: SocialLinks): {
  normalized: SocialLinks;
  invalidPlatform: SocialPlatform | null;
} {
  const normalized: SocialLinks = {};

  for (const platform of SOCIAL_PLATFORMS) {
    const value = inputs[platform]?.trim();
    if (!value) continue;
    const next = normalizeSocialLink(platform, value);
    if (!next) {
      return { normalized: {}, invalidPlatform: platform };
    }
    normalized[platform] = next;
  }

  return { normalized, invalidPlatform: null };
}

export function socialLinkHref(value: string): string | null {
  return /^https?:\/\//i.test(value) ? value : null;
}

export function socialLinkDisplayValue(platform: SocialPlatform, value: string): string {
  if (platform === 'discord') return value;

  try {
    const url = new URL(value);
    const parts = url.pathname.split('/').filter(Boolean);
    switch (platform) {
      case 'linkedin':
        return parts.slice(0, 2).join('/');
      case 'github':
        return parts[0] ?? value;
      case 'twitter':
        return `@${(parts[0] ?? '').replace(/^@/, '')}`;
      case 'reddit':
        return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : value;
      case 'instagram':
        return `@${(parts[0] ?? '').replace(/^@/, '')}`;
      case 'tiktok':
      case 'youtube':
        return parts[0] ?? value;
      case 'discord':
        return value;
    }
  } catch {
    return value;
  }
}