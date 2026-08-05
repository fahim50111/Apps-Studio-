const DEFAULT_TITLE = 'Apps Studio — Free Premium Apps & Mod Games Download';
const DEFAULT_DESC =
  'Apps Studio — Download all premium unlock apps, mod games and free subscriptions. 100% safe, fast and free.';
const SITE = 'Apps Studio';

interface SEOOptions {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  jsonLd?: Record<string, unknown> | null;
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

function setJsonLd(data: Record<string, unknown> | null) {
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
  const url = opts.url || window.location.href;
  const image =
    opts.image ||
    'https://i.supaimg.com/cd9a9717-a15f-44d3-bd7f-a1e5dcf50d81/8cd107a9-5f9b-4457-b838-9132d8e448cb.png';
  const type = opts.type || 'website';

  document.title = title;
  setMeta('name', 'description', description);
  setMeta('property', 'og:site_name', SITE);
  setMeta('property', 'og:title', title);
  setMeta('property', 'og:description', description);
  setMeta('property', 'og:image', image);
  setMeta('property', 'og:url', url);
  setMeta('property', 'og:type', type);
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

export { DEFAULT_TITLE, DEFAULT_DESC };
