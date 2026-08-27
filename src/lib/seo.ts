export const SITE = 'Apps Studio';
export const DEFAULT_TITLE =
  'Apps Studio — Free Premium Apps & Mod Games Download';
export const DEFAULT_DESC =
  'Download premium unlocked apps, mod games and useful tools from Apps Studio. Fast, free, and regularly updated.';
export const DEFAULT_IMAGE =
  'https://i.supaimg.com/cd9a9717-a15f-44d3-bd7f-a1e5dcf50d81/8cd107a9-5f9b-4457-b838-9132d8e448cb.png';

export function siteOrigin(): string {
  if (typeof window === 'undefined') return 'https://apps-studio-1f1c0.web.app';
  return window.location.origin;
}

export function canonicalUrl(path?: string): string {
  const origin = siteOrigin();
  if (path) {
    const clean = path.startsWith('/') ? path : `/${path}`;
    return `${origin}${clean}`;
  }
  if (typeof window === 'undefined') return `${origin}/`;
  const url = new URL(window.location.href);
  url.hash = '';
  return url.toString();
}

interface SEOOptions {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  robots?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[] | null;
}

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(
    `meta[${attr}="${key}"]`
  );
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(url: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', url);
}

const JSONLD_ID = 'dynamic-jsonld';

function setJsonLd(
  data: Record<string, unknown> | Record<string, unknown>[] | null
) {
  const existing = document.getElementById(JSONLD_ID);
  if (existing) existing.remove();
  if (!data) return;
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.id = JSONLD_ID;
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
}

export function updateSEO(opts: SEOOptions = {}) {
  const title = opts.title || DEFAULT_TITLE;
  const description = opts.description || DEFAULT_DESC;
  const url = opts.url || canonicalUrl();
  const image = opts.image || DEFAULT_IMAGE;
  const type = opts.type || 'website';
  const robots = opts.robots || 'index, follow';

  document.title = title;
  setMeta('name', 'description', description);
  setMeta('name', 'robots', robots);
  setMeta('name', 'author', SITE);
  setMeta('property', 'og:site_name', SITE);
  setMeta('property', 'og:title', title);
  setMeta('property', 'og:description', description);
  setMeta('property', 'og:image', image);
  setMeta('property', 'og:url', url);
  setMeta('property', 'og:type', type);
  setMeta('property', 'og:locale', 'en_US');
  setMeta('name', 'twitter:card', 'summary_large_image');
  setMeta('name', 'twitter:title', title);
  setMeta('name', 'twitter:description', description);
  setMeta('name', 'twitter:image', image);
  setCanonical(url);
  setJsonLd(opts.jsonLd === undefined ? null : opts.jsonLd);
}

export function resetSEO() {
  updateSEO();
}

export function websiteJsonLd() {
  const origin = siteOrigin();
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE,
      url: origin,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${origin}/search?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: SITE,
      url: origin,
      logo: `${origin}/favicon.svg`,
    },
  ];
}
