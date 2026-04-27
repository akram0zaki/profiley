// Cloudflare Pages Function: SSR meta injection for /public/:slug.
// Fetches public profile JSON from Supabase and rewrites the SPA shell's
// <title>, <meta description>, and OG tags before delivery.

interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  PUBLIC_SITE_URL?: string;
}

function escape(s: string | null | undefined): string {
  return (s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as Record<string, string>)[c]!
  );
}

export const onRequestGet: PagesFunction<Env> = async ({ request, params, env, next }) => {
  const slug = String(params.slug ?? '');
  // Fetch the SPA shell first.
  const shellResp = await next();
  if (!shellResp.headers.get('content-type')?.includes('text/html')) {
    return shellResp;
  }
  let html = await shellResp.text();

  // Fetch profile JSON from Supabase edge function.
  try {
    const fnUrl = `${env.SUPABASE_URL.replace(/\/$/, '')}/functions/v1/get-public-profile?slug=${encodeURIComponent(slug)}`;
    const res = await fetch(fnUrl, {
      headers: {
        apikey: env.SUPABASE_ANON_KEY,
        authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
      },
    });
    if (res.ok) {
      const json = await res.json() as { data?: any; success?: boolean };
      const p = json?.data;
      if (json?.success && p) {
        const title = p.seo_title || `${p.full_name} — ${p.headline ?? 'Profiley'}`;
        const desc = p.seo_description || p.short_bio || `Interactive AI persona of ${p.full_name}.`;
        const url = `${env.PUBLIC_SITE_URL ?? new URL(request.url).origin}/public/${encodeURIComponent(slug)}`;
        const image = p.photoUrl ?? '';

        const jsonLd = {
          '@context': 'https://schema.org',
          '@type': 'Person',
          name: p.full_name,
          description: desc,
          jobTitle: p.headline ?? undefined,
          address: p.current_location ? { '@type': 'PostalAddress', addressLocality: p.current_location } : undefined,
          url,
          image: image || undefined,
        };

        const meta = [
          `<title>${escape(title)}</title>`,
          `<meta name="description" content="${escape(desc)}" />`,
          `<meta property="og:title" content="${escape(title)}" />`,
          `<meta property="og:description" content="${escape(desc)}" />`,
          `<meta property="og:type" content="profile" />`,
          `<meta property="og:url" content="${escape(url)}" />`,
          image ? `<meta property="og:image" content="${escape(image)}" />` : '',
          `<meta name="twitter:card" content="summary_large_image" />`,
          `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`,
        ].filter(Boolean).join('\n    ');

        // Replace the existing <title>…</title> if present and inject extra meta tags.
        html = html.replace(/<title>[\s\S]*?<\/title>/i, '');
        html = html.replace('</head>', `    ${meta}\n  </head>`);
      }
    }
  } catch {
    // Fall through with un-rewritten shell.
  }

  return new Response(html, {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=60, s-maxage=300',
    },
  });
};
