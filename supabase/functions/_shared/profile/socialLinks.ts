export const SOCIAL_PLATFORMS = [
  "linkedin",
  "github",
  "twitter",
  "reddit",
  "discord",
  "instagram",
  "tiktok",
  "youtube",
] as const;

export type SocialPlatform = typeof SOCIAL_PLATFORMS[number];
export type SocialLinks = Partial<Record<SocialPlatform, string>>;

type TextSource = { text: string };

const URL_REGEX = /\b(?:https?:\/\/|www\.)[^\s<>()]+/gi;
const TRAILING_PUNCTUATION_REGEX = /[),.;:!?]+$/;
const DISCORD_HANDLE_REGEX = /^[A-Za-z0-9._-]{2,32}(?:#[0-9]{4})?$/;

const PLATFORM_LABEL_PATTERNS: Record<SocialPlatform, RegExp[]> = {
  linkedin: [/\blinkedin\b\s*[:|\-]?\s*([^\s,;]+)/i],
  github: [/\bgithub\b\s*[:|\-]?\s*([^\s,;]+)/i],
  twitter: [/\b(?:twitter|x)\b\s*[:|\-]?\s*([^\s,;]+)/i],
  reddit: [/\breddit\b\s*[:|\-]?\s*([^\s,;]+)/i],
  discord: [/\bdiscord\b\s*[:|\-]?\s*([^\s,;]+)/i],
  instagram: [/\binstagram\b\s*[:|\-]?\s*([^\s,;]+)/i],
  tiktok: [/\btiktok\b\s*[:|\-]?\s*([^\s,;]+)/i],
  youtube: [/\b(?:youtube|yt)\b\s*[:|\-]?\s*([^\s,;]+)/i],
};

function stripTrailingPunctuation(value: string): string {
  return value.trim().replace(TRAILING_PUNCTUATION_REGEX, "");
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
    return new URL(cleaned.startsWith("http") ? cleaned : `https://${cleaned}`);
  } catch {
    return null;
  }
}

function cleanHandle(raw: string): string {
  return stripTrailingPunctuation(raw)
    .replace(/^@+/, "")
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .trim();
}

function canonicalizeUrl(url: URL): string {
  url.hash = "";
  url.search = "";
  url.pathname = url.pathname.replace(/\/+$/, "");
  return url.toString();
}

function detectPlatformFromUrl(raw: string): SocialPlatform | null {
  const url = normalizeUrl(raw);
  if (!url) return null;
  const host = url.hostname.toLowerCase().replace(/^www\./, "");

  if (host === "linkedin.com") return "linkedin";
  if (host === "github.com") return "github";
  if (host === "x.com" || host === "twitter.com") return "twitter";
  if (host === "reddit.com") return "reddit";
  if (host === "instagram.com") return "instagram";
  if (host === "tiktok.com") return "tiktok";
  if (host === "youtube.com" || host === "youtu.be") return "youtube";
  if (host === "discord.gg" || host === "discord.com" || host === "discordapp.com") return "discord";
  return null;
}

export function normalizeSocialLink(platform: SocialPlatform, raw: string): string | null {
  const value = stripTrailingPunctuation(raw);
  if (!value) return null;
  const url = looksLikeUrl(value) ? normalizeUrl(value) : null;

  switch (platform) {
    case "linkedin": {
      if (url) {
        const host = url.hostname.toLowerCase().replace(/^www\./, "");
        if (host !== "linkedin.com") return null;
        const parts = url.pathname.split("/").filter(Boolean);
        if (parts.length < 2 || !["in", "pub", "company"].includes(parts[0])) return null;
        return canonicalizeUrl(new URL(`https://www.linkedin.com/${parts[0]}/${parts[1]}`));
      }
      const handle = cleanHandle(value).replace(/^linkedin\.com\//i, "");
      if (!handle || /\s/.test(handle)) return null;
      return `https://www.linkedin.com/in/${handle.replace(/^in\//i, "")}`;
    }
    case "github": {
      if (url) {
        const host = url.hostname.toLowerCase().replace(/^www\./, "");
        if (host !== "github.com") return null;
        const handle = url.pathname.split("/").filter(Boolean)[0];
        if (!handle) return null;
        return `https://github.com/${handle}`;
      }
      const handle = cleanHandle(value).split("/")[0];
      if (!/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/.test(handle)) return null;
      return `https://github.com/${handle}`;
    }
    case "twitter": {
      if (url) {
        const host = url.hostname.toLowerCase().replace(/^www\./, "");
        if (host !== "x.com" && host !== "twitter.com") return null;
        const handle = url.pathname.split("/").filter(Boolean)[0];
        if (!handle) return null;
        return `https://x.com/${handle.replace(/^@/, "")}`;
      }
      const handle = cleanHandle(value).replace(/^x\.com\//i, "").replace(/^twitter\.com\//i, "");
      if (!/^[A-Za-z0-9_]{1,15}$/.test(handle)) return null;
      return `https://x.com/${handle}`;
    }
    case "reddit": {
      if (url) {
        const host = url.hostname.toLowerCase().replace(/^www\./, "");
        if (host !== "reddit.com") return null;
        const parts = url.pathname.split("/").filter(Boolean);
        if (parts.length < 2 || !["u", "user"].includes(parts[0])) return null;
        return `https://www.reddit.com/user/${parts[1]}`;
      }
      const handle = cleanHandle(value).replace(/^u\//i, "").replace(/^user\//i, "");
      if (!/^[A-Za-z0-9_-]{2,32}$/.test(handle)) return null;
      return `https://www.reddit.com/user/${handle}`;
    }
    case "discord": {
      if (url) {
        const host = url.hostname.toLowerCase().replace(/^www\./, "");
        if (!["discord.gg", "discord.com", "discordapp.com"].includes(host)) return null;
        return canonicalizeUrl(url);
      }
      const handle = cleanHandle(value);
      return DISCORD_HANDLE_REGEX.test(handle) ? handle : null;
    }
    case "instagram": {
      if (url) {
        const host = url.hostname.toLowerCase().replace(/^www\./, "");
        if (host !== "instagram.com") return null;
        const handle = url.pathname.split("/").filter(Boolean)[0];
        if (!handle) return null;
        return `https://www.instagram.com/${handle}`;
      }
      const handle = cleanHandle(value).replace(/^instagram\.com\//i, "");
      if (!/^[A-Za-z0-9._]{1,30}$/.test(handle)) return null;
      return `https://www.instagram.com/${handle}`;
    }
    case "tiktok": {
      if (url) {
        const host = url.hostname.toLowerCase().replace(/^www\./, "");
        if (host !== "tiktok.com") return null;
        const handle = url.pathname.split("/").filter(Boolean)[0];
        if (!handle) return null;
        return `https://www.tiktok.com/${handle.startsWith("@") ? handle : `@${handle}`}`;
      }
      const handle = cleanHandle(value).replace(/^tiktok\.com\//i, "").replace(/^@/, "");
      if (!/^[A-Za-z0-9._]{2,24}$/.test(handle)) return null;
      return `https://www.tiktok.com/@${handle}`;
    }
    case "youtube": {
      if (url) {
        const host = url.hostname.toLowerCase().replace(/^www\./, "");
        if (host !== "youtube.com" && host !== "youtu.be") return null;
        return canonicalizeUrl(url);
      }
      const handle = cleanHandle(value).replace(/^youtube\.com\//i, "");
      if (!handle) return null;
      return handle.startsWith("@")
        ? `https://www.youtube.com/${handle}`
        : `https://www.youtube.com/@${handle}`;
    }
  }
}

export function mergeSocialLinks(...sets: Array<SocialLinks | null | undefined>): SocialLinks {
  const merged: SocialLinks = {};

  for (const set of sets) {
    if (!set) continue;
    for (const platform of SOCIAL_PLATFORMS) {
      if (merged[platform] || !set[platform]) continue;
      merged[platform] = set[platform];
    }
  }

  return merged;
}

export function extractSocialLinks(text: string): SocialLinks {
  const extracted: SocialLinks = {};

  for (const match of text.matchAll(URL_REGEX)) {
    const raw = match[0];
    const platform = detectPlatformFromUrl(raw);
    if (!platform || extracted[platform]) continue;
    const normalized = normalizeSocialLink(platform, raw);
    if (normalized) extracted[platform] = normalized;
  }

  const lines = text.split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    for (const platform of SOCIAL_PLATFORMS) {
      if (extracted[platform]) continue;
      for (const pattern of PLATFORM_LABEL_PATTERNS[platform]) {
        const match = line.match(pattern);
        if (!match?.[1]) continue;
        const normalized = normalizeSocialLink(platform, match[1]);
        if (normalized) {
          extracted[platform] = normalized;
          break;
        }
      }
    }
  }

  return extracted;
}

export function extractSocialLinksFromSources(sources: TextSource[]): SocialLinks {
  return mergeSocialLinks(...sources.map((source) => extractSocialLinks(source.text ?? "")));
}