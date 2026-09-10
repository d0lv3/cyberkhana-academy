/* ─── Social links on a member's profile ───
 *
 * Every link is shown to other members as something to click, so nothing a
 * member types is ever used as a URL as-is. Platforms with a fixed profile
 * address store only a handle, and the frontend builds the address from a
 * template it owns; the two that cannot (Hack The Box, a personal website)
 * store a URL that has been parsed, limited to http(s), stripped of
 * credentials, query and fragment, and, for Hack The Box, pinned to its
 * domain. A pasted profile URL is accepted anywhere a handle is, and reduced
 * to the handle.
 *
 * Mirrored in the frontend's services/socials.ts, which gives the same
 * answers in the form before the round trip. Keep the two in step.
 */

export const SOCIAL_PLATFORMS = [
  'github',
  'linkedin',
  'x',
  'tryhackme',
  'hackthebox',
  'youtube',
  'instagram',
  'telegram',
  'discord',
  'website',
] as const;

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export type SocialLinks = Partial<Record<SocialPlatform, string>>;

export function isSocialPlatform(value: string): value is SocialPlatform {
  return (SOCIAL_PLATFORMS as readonly string[]).includes(value);
}

const MAX_INPUT = 300;
const MAX_URL = 200;

interface HandleRule {
  kind: 'handle';
  /** Hosts a pasted profile URL may come from (compared without "www."/"m."). */
  hosts: string[];
  /** The handle inside a pasted URL's path, or null when it is not a profile URL. */
  fromPath: (segments: string[]) => string | null;
  /** What a stored value may look like. */
  valid: RegExp;
  /** Case-insensitive platforms store lowercase. */
  lowercase?: boolean;
}

interface UrlRule {
  kind: 'url';
  /** When set, the URL's host must be one of these or a subdomain of one. */
  domains?: string[];
}

interface PlainRule {
  kind: 'plain';
  valid: RegExp;
  lowercase?: boolean;
}

const first = (s: string[]) => s[0] ?? null;

const RULES: Record<SocialPlatform, HandleRule | UrlRule | PlainRule> = {
  github: {
    kind: 'handle',
    hosts: ['github.com'],
    fromPath: first,
    valid: /^[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38}$/,
  },
  linkedin: {
    kind: 'handle',
    hosts: ['linkedin.com'],
    fromPath: (s) => (s[0] === 'in' ? s[1] ?? null : null),
    valid: /^[A-Za-z0-9_%-]{3,100}$/,
  },
  x: {
    kind: 'handle',
    hosts: ['x.com', 'twitter.com'],
    fromPath: first,
    valid: /^[A-Za-z0-9_]{1,15}$/,
  },
  tryhackme: {
    kind: 'handle',
    hosts: ['tryhackme.com'],
    // Profiles live at /p/<name>, sometimes behind a route prefix (/r/p/<name>).
    fromPath: (s) => {
      const i = s.indexOf('p');
      return i >= 0 ? s[i + 1] ?? null : null;
    },
    valid: /^[A-Za-z0-9._-]{1,50}$/,
  },
  hackthebox: { kind: 'url', domains: ['hackthebox.com'] },
  youtube: {
    kind: 'handle',
    hosts: ['youtube.com'],
    // Stored with its prefix: "@handle", or "channel/<id>" for older channels.
    fromPath: (s) =>
      s[0]?.startsWith('@') ? s[0] : s[0] === 'channel' && s[1] ? `channel/${s[1]}` : null,
    valid: /^(?:@[A-Za-z0-9._-]{3,30}|channel\/UC[A-Za-z0-9_-]{22})$/,
  },
  instagram: {
    kind: 'handle',
    hosts: ['instagram.com'],
    fromPath: first,
    valid: /^[A-Za-z0-9._]{1,30}$/,
  },
  telegram: {
    kind: 'handle',
    hosts: ['t.me', 'telegram.me'],
    fromPath: first,
    valid: /^[A-Za-z][A-Za-z0-9_]{4,31}$/,
  },
  // Discord has no public profile address for a username: it is shown, not linked.
  discord: { kind: 'plain', valid: /^(?!.*\.\.)[a-z0-9_.]{2,32}$/, lowercase: true },
  website: { kind: 'url' },
};

type Result = { ok: true; value: string } | { ok: false; reason: string };

const bareHost = (host: string) => host.toLowerCase().replace(/^(?:www\.|m\.|mobile\.)/, '');

/** Parse something a person typed as a URL, adding https:// when the scheme
 *  is missing. Only http(s), no credentials, no explicit port, and a real
 *  domain name: an IP address or "localhost" would let a profile point other
 *  members at the router on their own network. */
function parseUrl(input: string): URL | null {
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(input) ? input : `https://${input}`;
  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  if (url.username || url.password || url.port) return null;
  if (!/\.(?:[a-z]{2,}|xn--[a-z0-9-]+)$/i.test(url.hostname)) return null;
  return url;
}

/** One social field, as typed, to the value that gets stored. '' clears it. */
export function normalizeSocial(platform: SocialPlatform, raw: string): Result {
  const input = raw.trim();
  if (!input) return { ok: true, value: '' };
  if (input.length > MAX_INPUT) return { ok: false, reason: 'That is too long.' };

  const rule = RULES[platform];

  if (rule.kind === 'plain') {
    const value = rule.lowercase ? input.replace(/^@/, '').toLowerCase() : input;
    return rule.valid.test(value) ? { ok: true, value } : { ok: false, reason: 'That is not a valid username.' };
  }

  if (rule.kind === 'url') {
    const url = parseUrl(input);
    if (!url) return { ok: false, reason: 'Enter a full web address.' };
    const host = url.hostname.toLowerCase();
    if (rule.domains && !rule.domains.some((d) => host === d || host.endsWith(`.${d}`))) {
      return { ok: false, reason: `Use a link on ${rule.domains[0]}.` };
    }
    // A platform we pin to is always reached over https.
    const scheme = rule.domains ? 'https:' : url.protocol;
    const value = `${scheme}//${url.host}${url.pathname}`.replace(/\/+$/, '');
    if (value.length > MAX_URL) return { ok: false, reason: 'That address is too long.' };
    return { ok: true, value };
  }

  // A handle, or a profile URL to take the handle from.
  let handle: string | null;
  const looksLikeUrl = /^[a-z][a-z0-9+.-]*:\/\//i.test(input) || rule.hosts.some((h) => bareHost(input).startsWith(`${h}/`));
  if (looksLikeUrl) {
    const url = parseUrl(input);
    if (!url || !rule.hosts.includes(bareHost(url.hostname))) {
      return { ok: false, reason: `Use a ${rule.hosts[0]} profile link or just the username.` };
    }
    const segments = url.pathname.split('/').filter(Boolean).map((s) => {
      try {
        return decodeURIComponent(s);
      } catch {
        return s;
      }
    });
    handle = rule.fromPath(segments);
  } else {
    handle = platform === 'youtube' ? (input.startsWith('@') ? input : `@${input}`) : input.replace(/^@/, '');
  }

  if (handle && platform === 'linkedin') handle = encodeURIComponent(handle).replace(/%25/g, '%');
  if (!handle || !rule.valid.test(handle)) return { ok: false, reason: 'That is not a valid username.' };
  return { ok: true, value: rule.lowercase ? handle.toLowerCase() : handle };
}

/** The stored links as they may leave the server: known platforms, strings,
 *  and still valid (anything that fails today's rules is dropped rather than
 *  shown). */
export function publicSocials(stored: unknown): SocialLinks {
  const out: SocialLinks = {};
  if (!stored || typeof stored !== 'object') return out;
  for (const platform of SOCIAL_PLATFORMS) {
    const value = (stored as Record<string, unknown>)[platform];
    if (typeof value !== 'string' || !value) continue;
    const check = normalizeSocial(platform, value);
    if (check.ok && check.value === value) out[platform] = value;
  }
  return out;
}
