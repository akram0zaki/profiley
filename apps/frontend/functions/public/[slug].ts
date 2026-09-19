// Cloudflare Pages Function: SSR meta injection for /public/:slug.
// Fetches public profile JSON from Supabase and rewrites the SPA shell's
// <title>, <meta description>, and OG tags before delivery, so link previews
// (WhatsApp, LinkedIn, Slack, X) get a title, description, and thumbnail.

interface Env {
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  PUBLIC_APP_ORIGIN?: string;
  /** @deprecated use PUBLIC_APP_ORIGIN */
  PUBLIC_SITE_URL?: string;
  // e.g. https://profiley.ai/cdn-cgi/image — requires Cloudflare Image
  // Transformations enabled on the zone with supabase.co allowed as a source.
  CF_IMAGE_RESIZING_PREFIX?: string;
}

interface PublicProfile {
  full_name?: string | null;
  headline?: string | null;
  short_bio?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  current_location?: string | null;
  photoUrl?: string | null;
}

// Square thumbnail: WhatsApp drops previews for large images (~600 KB+), and
// avatars are uploaded at full resolution.
export const OG_IMAGE_SIZE = 600;

function escape(s: string | null | undefined): string {
  return (s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as Record<string, string>)[c]!
  );
}

export function buildOgImageUrl(photoUrl: string | null | undefined, resizingPrefix?: string): string | null {
  if (!photoUrl) return null;
  if (!resizingPrefix) return photoUrl;
  const opts = `width=${OG_IMAGE_SIZE},height=${OG_IMAGE_SIZE},fit=cover,format=jpeg,quality=80`;
  return `${resizingPrefix.replace(/\/$/, '')}/${opts}/${photoUrl}`;
}

export function buildMetaTags(p: PublicProfile, pageUrl: string, image: string | null, resized: boolean): string {
  const name = p.full_name ?? 'Profiley';
  const title = p.seo_title || `${name} — ${p.headline ?? 'Profiley'}`;
  const desc = p.seo_description || p.short_bio || `Interactive AI persona of ${name}.`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name,
    description: desc,
    jobTitle: p.headline ?? undefined,
    address: p.current_location ? { '@type': 'PostalAddress', addressLocality: p.current_location } : undefined,
    url: pageUrl,
    image: image ?? undefined,
  };

  const tags = [
    `<title>${escape(title)}</title>`,
    `<meta name="description" content="${escape(desc)}" />`,
    `<link rel="canonical" href="${escape(pageUrl)}" />`,
    `<meta property="og:site_name" content="Profiley" />`,
    `<meta property="og:title" content="${escape(title)}" />`,
    `<meta property="og:description" content="${escape(desc)}" />`,
    `<meta property="og:type" content="profile" />`,
    `<meta property="og:url" content="${escape(pageUrl)}" />`,
    `<meta name="twitter:card" content="summary" />`,
    `<meta name="twitter:title" content="${escape(title)}" />`,
    `<meta name="twitter:description" content="${escape(desc)}" />`,
  ];
  if (image) {
    tags.push(
      `<meta property="og:image" content="${escape(image)}" />`,
      `<meta property="og:image:secure_url" content="${escape(image)}" />`,
      `<meta property="og:image:alt" content="${escape(name)}" />`,
      `<meta name="twitter:image" content="${escape(image)}" />`,
    );
    if (resized) {
      tags.push(
        `<meta property="og:image:type" content="image/jpeg" />`,
        `<meta property="og:image:width" content="${OG_IMAGE_SIZE}" />`,
        `<meta property="og:image:height" content="${OG_IMAGE_SIZE}" />`,
      );
    }
  }
  // Escape "<" so profile text can never close the script tag.
  tags.push(`<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>`);
  return tags.join('\n    ');
}

export const onRequestGet: PagesFunction<Env> = async ({ request, params, env, next }) => {
  const slug = String(params.slug ?? '');
  // Fetch the SPA shell first.
  const shellResp = await next();
  if (!shellResp.headers.get('content-type')?.includes('text/html')) {
    return shellResp;
  }
  let html = await shellResp.text();

  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    console.error('[public/slug] SUPABASE_URL / SUPABASE_ANON_KEY not set on this Pages project; serving shell without OG tags');
  } else {
    try {
      const fnUrl = `${env.SUPABASE_URL.replace(/\/$/, '')}/functions/v1/get-public-profile?slug=${encodeURIComponent(slug)}`;
      const res = await fetch(fnUrl, {
        headers: {
          apikey: env.SUPABASE_ANON_KEY,
          authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
        },
      });
      if (res.ok) {
        const json = await res.json() as { data?: PublicProfile; success?: boolean };
        const p = json?.data;
        if (json?.success && p) {
          const origin = (env.PUBLIC_APP_ORIGIN ?? env.PUBLIC_SITE_URL ?? new URL(request.url).origin).replace(/\/$/, '');
          const pageUrl = `${origin}/public/${encodeURIComponent(slug)}`;
          const image = buildOgImageUrl(p.photoUrl, env.CF_IMAGE_RESIZING_PREFIX);
          const meta = buildMetaTags(p, pageUrl, image, Boolean(image && env.CF_IMAGE_RESIZING_PREFIX));

          // Replace the existing <title>…</title> if present and inject extra meta tags.
          html = html.replace(/<title>[\s\S]*?<\/title>/i, '');
          html = html.replace('</head>', `    ${meta}\n  </head>`);
        }
      } else if (res.status !== 404) {
        console.error(`[public/slug] get-public-profile returned ${res.status} for "${slug}"`);
      }
    } catch (err) {
      // Fall through with un-rewritten shell.
      console.error('[public/slug] meta injection failed', err);
    }
  }

  return new Response(html, {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=60, s-maxage=300',
    },
  });
};
