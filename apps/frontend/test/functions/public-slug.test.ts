// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildOgImageUrl, onRequestGet } from '../../functions/public/[slug]';

const SHELL = '<html><head><title>Profiley — Let Your Experience Speak</title></head><body></body></html>';
const PHOTO = 'https://ref.supabase.co/storage/v1/object/public/avatars/u/avatar.png';

function ctx(env: Record<string, string | undefined>, slug = 'jane') {
  return {
    request: new Request(`https://profiley.pages.dev/public/${slug}`),
    params: { slug },
    env,
    next: async () => new Response(SHELL, { headers: { 'content-type': 'text/html' } }),
  } as any;
}

function mockProfile(data: Record<string, unknown>, status = 200) {
  const fetchMock = vi.fn(async () =>
    new Response(JSON.stringify({ success: status === 200, data }), { status }),
  );
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

const ENV = { SUPABASE_URL: 'https://ref.supabase.co/', SUPABASE_ANON_KEY: 'anon' };

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('buildOgImageUrl', () => {
  it('returns null without a photo', () => {
    expect(buildOgImageUrl(null, 'https://x/cdn-cgi/image')).toBeNull();
  });

  it('returns the raw photo URL without a resizing prefix', () => {
    expect(buildOgImageUrl(PHOTO)).toBe(PHOTO);
  });

  it('routes the photo through Cloudflare image resizing when configured', () => {
    expect(buildOgImageUrl(PHOTO, 'https://profiley.ai/cdn-cgi/image/')).toBe(
      `https://profiley.ai/cdn-cgi/image/width=600,height=600,fit=cover,format=jpeg,quality=80/${PHOTO}`,
    );
  });
});

describe('public/[slug] onRequestGet', () => {
  it('injects title, description and og:image for a published profile', async () => {
    const fetchMock = mockProfile({ full_name: 'Jane Doe', headline: 'Engineer', short_bio: 'Builds things', photoUrl: PHOTO });
    const html = await (await onRequestGet(ctx({ ...ENV, PUBLIC_APP_ORIGIN: 'https://profiley.ai' }))).text();

    expect(fetchMock).toHaveBeenCalledWith(
      'https://ref.supabase.co/functions/v1/get-public-profile?slug=jane',
      expect.anything(),
    );
    expect(html).toContain('<title>Jane Doe — Engineer</title>');
    expect(html).not.toContain('Let Your Experience Speak');
    expect(html).toContain('<meta property="og:description" content="Builds things" />');
    expect(html).toContain('<meta property="og:url" content="https://profiley.ai/public/jane" />');
    expect(html).toContain(`<meta property="og:image" content="${PHOTO}" />`);
    expect(html).not.toContain('og:image:width');
  });

  it('uses the resized image and declares its dimensions when a resizing prefix is set', async () => {
    mockProfile({ full_name: 'Jane Doe', photoUrl: PHOTO });
    const html = await (await onRequestGet(ctx({ ...ENV, CF_IMAGE_RESIZING_PREFIX: 'https://profiley.ai/cdn-cgi/image' }))).text();

    expect(html).toContain('og:image" content="https://profiley.ai/cdn-cgi/image/width=600');
    expect(html).toContain('<meta property="og:image:width" content="600" />');
    expect(html).toContain('<meta property="og:image:type" content="image/jpeg" />');
  });

  it('falls back to the request origin for og:url', async () => {
    mockProfile({ full_name: 'Jane Doe' });
    const html = await (await onRequestGet(ctx(ENV))).text();
    expect(html).toContain('<meta property="og:url" content="https://profiley.pages.dev/public/jane" />');
    expect(html).not.toContain('og:image');
  });

  it('escapes profile text inside tags and JSON-LD', async () => {
    mockProfile({ full_name: 'Jane "</script><script>x</script>' });
    const html = await (await onRequestGet(ctx(ENV))).text();
    expect(html).not.toContain('</script><script>x');
  });

  it('serves the untouched shell and logs when Supabase env vars are missing', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const res = await onRequestGet(ctx({}));

    expect(await res.text()).toBe(SHELL);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('SUPABASE_URL'));
  });

  it('serves the untouched shell for unknown slugs', async () => {
    mockProfile({}, 404);
    const res = await onRequestGet(ctx(ENV, 'nobody'));
    expect(await res.text()).toBe(SHELL);
  });
});
