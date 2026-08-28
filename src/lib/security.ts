// ============================================================
// Client-side security helpers.
// These are defense-in-depth on top of Firestore rules — they do
// NOT replace server rules, but reduce abuse and unsafe navigation.
// ============================================================

export const LIMITS = {
  requestName: 120,
  requestNote: 600,
  searchTerm: 80,
} as const;

/**
 * Collapse whitespace, strip control characters, and hard-cap length.
 * Used before persisting any user-provided text.
 */
export function sanitizeText(input: string, max: number): string {
  return input
    // remove control chars (keep normal printable + emoji-free text)
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

/**
 * Only allow http(s) URLs. Blocks javascript:, data:, vbscript:, file: etc.
 * Returns a safe absolute URL string, or null if it isn't safe.
 */
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

/**
 * Open an external link in a new tab with the hardened opener settings so the
 * destination cannot access window.opener (reverse-tabnabbing protection).
 * Silently no-ops for unsafe URLs.
 */
export function openExternal(raw: string | undefined | null): boolean {
  const url = safeUrl(raw);
  if (!url) return false;
  const win = window.open(url, '_blank', 'noopener,noreferrer');
  if (win) win.opener = null;
  return true;
}

/** Only hex Adstera keys — never pass user input into script URLs. */
export function safeAdKey(raw: string | undefined | null): string | null {
  if (!raw) return null;
  return /^[a-f0-9]{32}$/i.test(raw.trim()) ? raw.trim().toLowerCase() : null;
}
