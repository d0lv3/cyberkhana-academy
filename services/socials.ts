/* ─── Social links (client mirror) ───
 *
 * Mirrors backend/src/utils/socials.ts so the profile form can say what is
 * wrong with a link before the round trip. The server still decides: it runs
 * the same rules on every save. Keep the two in step.
 *
 * What a member types is never used as a link as-is. Platforms with a fixed
 * profile address store a handle and the address is built here from a
 * template; Hack The Box and a personal website store a checked URL. Every
 * link is checked again here before it is rendered, so a value that would not
 * pass today's rules is simply not shown.
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

export const SOCIAL_META: Record<
  SocialPlatform,
  { label: string; placeholder: string; color: string }
> = {
  github: { label: 'GitHub', placeholder: 'github.com/username', color: '#e5e9f0' },
  linkedin: { label: 'LinkedIn', placeholder: 'linkedin.com/in/username', color: '#4d9be6' },
  x: { label: 'X', placeholder: '@username', color: '#e5e9f0' },
  tryhackme: { label: 'TryHackMe', placeholder: 'tryhackme.com/p/username', color: '#ff5c5c' },
  hackthebox: { label: 'Hack The Box', placeholder: 'app.hackthebox.com/profile/…', color: '#9fef00' },
  youtube: { label: 'YouTube', placeholder: '@channel', color: '#ff4d4d' },
  instagram: { label: 'Instagram', placeholder: '@username', color: '#e1306c' },
  telegram: { label: 'Telegram', placeholder: 't.me/username', color: '#26a5e4' },
  discord: { label: 'Discord', placeholder: 'username', color: '#8b93ff' },
  website: { label: 'Website', placeholder: 'yoursite.com', color: '#9aa5bf' },
};

const MAX_INPUT = 300;
const MAX_URL = 200;

interface HandleRule {
  kind: 'handle';
  hosts: string[];
  fromPath: (segments: string[]) => string | null;
  valid: RegExp;
  lowercase?: boolean;
}
interface UrlRule {
  kind: 'url';
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
  x: { kind: 'handle', hosts: ['x.com', 'twitter.com'], fromPath: first, valid: /^[A-Za-z0-9_]{1,15}$/ },
  tryhackme: {
    kind: 'handle',
    hosts: ['tryhackme.com'],
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
    fromPath: (s) =>
      s[0]?.startsWith('@') ? s[0] : s[0] === 'channel' && s[1] ? `channel/${s[1]}` : null,
    valid: /^(?:@[A-Za-z0-9._-]{3,30}|channel\/UC[A-Za-z0-9_-]{22})$/,
  },
  instagram: { kind: 'handle', hosts: ['instagram.com'], fromPath: first, valid: /^[A-Za-z0-9._]{1,30}$/ },
  telegram: {
    kind: 'handle',
    hosts: ['t.me', 'telegram.me'],
    fromPath: first,
    valid: /^[A-Za-z][A-Za-z0-9_]{4,31}$/,
  },
  discord: { kind: 'plain', valid: /^(?!.*\.\.)[a-z0-9_.]{2,32}$/, lowercase: true },
  website: { kind: 'url' },
};

export type SocialCheck = { ok: true; value: string } | { ok: false; reason: { en: string; ar: string } };

const bad = (en: string, ar: string): SocialCheck => ({ ok: false, reason: { en, ar } });

const bareHost = (host: string) => host.toLowerCase().replace(/^(?:www\.|m\.|mobile\.)/, '');

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

/** One field as typed, to the value the server will store. '' clears it. */
export function normalizeSocial(platform: SocialPlatform, raw: string): SocialCheck {
  const input = raw.trim();
  if (!input) return { ok: true, value: '' };
  if (input.length > MAX_INPUT) return bad('That is too long.', 'النص طويل جدا.');

  const rule = RULES[platform];

  if (rule.kind === 'plain') {
    const value = rule.lowercase ? input.replace(/^@/, '').toLowerCase() : input;
    return rule.valid.test(value)
      ? { ok: true, value }
      : bad('That is not a valid username.', 'اسم المستخدم غير صالح.');
  }

  if (rule.kind === 'url') {
    const url = parseUrl(input);
    if (!url) return bad('Enter a full web address.', 'أدخل عنوان موقع كاملا.');
    const host = url.hostname.toLowerCase();
    if (rule.domains && !rule.domains.some((d) => host === d || host.endsWith(`.${d}`))) {
      return bad(`Use a link on ${rule.domains[0]}.`, `استخدم رابطا على ${rule.domains[0]}.`);
    }
    const scheme = rule.domains ? 'https:' : url.protocol;
    const value = `${scheme}//${url.host}${url.pathname}`.replace(/\/+$/, '');
    if (value.length > MAX_URL) return bad('That address is too long.', 'العنوان طويل جدا.');
    return { ok: true, value };
  }

  let handle: string | null;
  const looksLikeUrl =
    /^[a-z][a-z0-9+.-]*:\/\//i.test(input) || rule.hosts.some((h) => bareHost(input).startsWith(`${h}/`));
  if (looksLikeUrl) {
    const url = parseUrl(input);
    if (!url || !rule.hosts.includes(bareHost(url.hostname))) {
      return bad(
        `Use a ${rule.hosts[0]} profile link or just the username.`,
        `استخدم رابط ملف على ${rule.hosts[0]} أو اسم المستخدم فقط.`
      );
    }
    const segments = url.pathname
      .split('/')
      .filter(Boolean)
      .map((s) => {
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
  if (!handle || !rule.valid.test(handle)) return bad('That is not a valid username.', 'اسم المستخدم غير صالح.');
  return { ok: true, value: rule.lowercase ? handle.toLowerCase() : handle };
}

const TEMPLATES: Partial<Record<SocialPlatform, (v: string) => string>> = {
  github: (v) => `https://github.com/${v}`,
  linkedin: (v) => `https://www.linkedin.com/in/${v}`,
  x: (v) => `https://x.com/${v}`,
  tryhackme: (v) => `https://tryhackme.com/p/${v}`,
  youtube: (v) => `https://www.youtube.com/${v}`,
  instagram: (v) => `https://www.instagram.com/${v}`,
  telegram: (v) => `https://t.me/${v}`,
};

/**
 * Where a stored link goes, or null when it should not be shown as a link at
 * all: Discord (a username, not an address), or any value that no longer
 * passes the rules above.
 */
export function socialHref(platform: SocialPlatform, value: string | undefined): string | null {
  if (!value) return null;
  const check = normalizeSocial(platform, value);
  if (!check.ok || check.value !== value) return null;
  if (platform === 'discord') return null;
  if (RULES[platform].kind === 'url') return value;
  return TEMPLATES[platform]?.(value) ?? null;
}

/** The links worth drawing, in the fixed platform order. */
export function visibleSocials(links: SocialLinks | undefined | null): Array<[SocialPlatform, string]> {
  if (!links) return [];
  return SOCIAL_PLATFORMS.filter((p) => {
    const v = links[p];
    if (!v) return false;
    const check = normalizeSocial(p, v);
    return check.ok && check.value === v;
  }).map((p) => [p, links[p] as string]);
}
