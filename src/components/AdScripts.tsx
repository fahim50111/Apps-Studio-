import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { safeAdKey } from '../lib/security';

const SOCIAL_SRC =
  'https://pl28865518.profitablecpmratenetwork.com/c3/2e/df/c32edf399a2465e679c6916a452916a5.js';
const POPHOLDER_SRC =
  'https://pl29173150.profitablecpmratenetwork.com/58/dc/4e/58dc4e250696a8ca032b8aeda82e02db.js';
const BANNER_KEY = '2f5bbf6218f8e38947d13ae964d09fd6';

declare global {
  interface Window {
    atOptions?: Record<string, unknown>;
    __adWriteSlot?: HTMLElement | null;
    __adWriteKind?: 'banner' | 'social' | 'pop' | '';
  }
}

function isSocialPage(pathname: string) {
  return (
    pathname === '/' ||
    pathname === '/categories' ||
    pathname.startsWith('/categories/') ||
    pathname === '/toplist' ||
    pathname.startsWith('/toplist/')
  );
}

function isPopholderPage(pathname: string) {
  return pathname.startsWith('/app/');
}

function socialHost(): HTMLElement {
  let host = document.getElementById('ad-social-host');
  if (!host) {
    host = document.createElement('div');
    host.id = 'ad-social-host';
    host.setAttribute('data-ad-write', 'social');
    document.body.appendChild(host);
  }
  return host;
}

function injectScript(src: string, target: HTMLElement, id: string) {
  if (document.getElementById(id)) return;
  const s = document.createElement('script');
  s.id = id;
  s.src = src;
  s.async = true;
  s.setAttribute('data-cfasync', 'false');
  target.appendChild(s);
}

export function AdRouteScripts() {
  const { pathname } = useLocation();
  const social = isSocialPage(pathname);
  const popholder = isPopholderPage(pathname);

  useEffect(() => {
    document.documentElement.dataset.socialAd = social ? 'on' : 'off';
    document.documentElement.dataset.popAd = popholder ? 'on' : 'off';
    const host = document.getElementById('ad-social-host');
    if (host) host.hidden = !social;
  }, [social, popholder]);

  useEffect(() => {
    if (!social) return;
    window.__adWriteKind = 'social';
    window.__adWriteSlot = null;
    socialHost().hidden = false;
    const t = window.setTimeout(() => {
      window.__adWriteKind = 'social';
      injectScript(SOCIAL_SRC, document.body, 'ad-socialbar');
    }, 400);
    return () => window.clearTimeout(t);
  }, [social]);

  useEffect(() => {
    if (!popholder) return undefined;
    window.__adWriteKind = 'pop';
    window.__adWriteSlot = null;
    const load = () => {
      window.__adWriteKind = 'pop';
      injectScript(POPHOLDER_SRC, document.head, 'ad-popholder');
    };
    const t = window.setTimeout(load, 280);
    let armed = false;
    const onClick = () => {
      if (armed) return;
      armed = true;
      load();
    };
    document.addEventListener('pointerdown', onClick, true);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener('pointerdown', onClick, true);
    };
  }, [popholder]);

  return null;
}

export function AdBanner({
  compact = false,
  adKey = BANNER_KEY,
  width = 300,
  height = 250,
}: {
  compact?: boolean;
  adKey?: string;
  width?: number;
  height?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const key = safeAdKey(adKey) || BANNER_KEY;
  const src = `https://www.highperformanceformat.com/${key}/invoke.js`;
  const w = Math.max(1, Math.min(width, 1200));
  const h = Math.max(1, Math.min(height, 1200));

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.replaceChildren();
    el.setAttribute('data-ad-write-target', '1');
    window.__adWriteKind = 'banner';
    window.__adWriteSlot = el;
    window.atOptions = { key, format: 'iframe', height: h, width: w, params: {} };
    const cfg = document.createElement('script');
    cfg.type = 'text/javascript';
    cfg.text = `atOptions = {'key':'${key}','format':'iframe','height':${h},'width':${w},'params':{}};`;
    const s = document.createElement('script');
    s.src = src;
    s.async = false;
    s.setAttribute('data-cfasync', 'false');
    s.onerror = () => {
      el.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:${h}px;width:${w}px;max-width:100%;border-radius:12px;background:rgba(0,0,0,.04);font:12px sans-serif;color:#777;text-align:center;padding:8px;">Advertisement could not load.</div>`;
    };
    el.appendChild(cfg);
    el.appendChild(s);
    return () => {
      if (window.__adWriteSlot === el) window.__adWriteSlot = null;
      if (window.__adWriteKind === 'banner') window.__adWriteKind = '';
      el.removeAttribute('data-ad-write-target');
      el.replaceChildren();
    };
  }, [key, src, w, h]);

  return (
    <div className={`mx-auto flex w-full justify-center rounded-2xl border border-line bg-panel p-3 ${compact ? 'max-w-[340px]' : ''}`} data-ad-banner>
      <div ref={ref} className="overflow-hidden rounded-xl" style={{ width: w, maxWidth: '100%', minHeight: h }} data-ad-write-target="1" />
    </div>
  );
}
