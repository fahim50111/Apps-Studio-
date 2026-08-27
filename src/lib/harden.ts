/**
 * After the SPA has loaded, native document.write() calls document.open()
 * and wipes the page. Ad networks still use document.write, so we append
 * their HTML instead of replacing the document.
 */
export function hardenDocument() {
  if (typeof document === 'undefined') return;
  const w = window as Window & {
    __asHardened?: boolean;
    __adWriteSlot?: HTMLElement | null;
    __adWriteKind?: 'banner' | 'social' | 'pop' | '';
  };
  if (w.__asHardened) return;
  w.__asHardened = true;

  const nativeOpen = document.open.bind(document);
  const nativeWrite = document.write.bind(document);

  const hostFor = (kind: string) => {
    if (kind === 'banner' && w.__adWriteSlot && document.contains(w.__adWriteSlot)) {
      return w.__adWriteSlot;
    }
    const id = kind === 'pop' ? 'ad-pop-host' : 'ad-social-host';
    let host = document.getElementById(id);
    if (!host) {
      host = document.createElement('div');
      host.id = id;
      host.setAttribute('data-ad-write', kind || 'social');
      document.body.appendChild(host);
    }
    return host;
  };

  const runScripts = (root: ParentNode) => {
    root.querySelectorAll('script').forEach((old) => {
      const s = document.createElement('script');
      Array.from(old.attributes).forEach((a) => s.setAttribute(a.name, a.value));
      if (old.textContent) s.text = old.textContent;
      old.parentNode?.replaceChild(s, old);
    });
  };

  const appendHtml = (html: string) => {
    const kind = w.__adWriteKind || 'social';
    const host = hostFor(kind);
    const box = document.createElement('div');
    box.setAttribute('data-ad-write', kind);
    box.innerHTML = html;
    host.appendChild(box);
    runScripts(box);
  };

  try {
    document.open = ((...args: unknown[]) => {
      if (document.readyState === 'loading') {
        return nativeOpen(...(args as []));
      }
      return document;
    }) as typeof document.open;

    document.write = ((...args: unknown[]) => {
      const html = args.map(String).join('');
      if (document.readyState === 'loading') {
        nativeWrite(html);
        return;
      }
      appendHtml(html);
    }) as typeof document.write;

    document.writeln = ((...args: unknown[]) => {
      document.write(args.map(String).join('') + '\n');
    }) as typeof document.writeln;
  } catch {
    /* ignore */
  }

  const root = document.getElementById('root');
  if (!root || typeof MutationObserver === 'undefined') return;

  const observer = new MutationObserver(() => {
    if (document.getElementById('root')) return;
    try {
      document.body.insertBefore(root, document.body.firstChild);
    } catch {
      /* ignore */
    }
  });
  observer.observe(document.body, { childList: true });
}
