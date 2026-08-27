export const LIMITS = {
  requestName: 120,
  requestNote: 600,
  searchTerm: 80,
} as const;

export function sanitizeText(input: string, max: number): string {
  return input
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

export function safeUrl(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const u = new URL(trimmed);
    if (u.protocol === 'http:' || u.protocol === 'https:') {
      return u.href;
    }
    return null;
  } catch {
    return null;
  }
}

export function openExternal(raw: string | undefined | null): boolean {
  const url = safeUrl(raw);
  if (!url) return false;
  const win = window.open(url, '_blank', 'noopener,noreferrer');
  if (win) win.opener = null;
  return true;
}

export function safeAdKey(raw: string | undefined | null): string | null {
  if (!raw) return null;
  return /^[a-f0-9]{32}$/i.test(raw.trim()) ? raw.trim().toLowerCase() : null;
}
