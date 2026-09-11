import React, { useState } from 'react';
import { Github, Linkedin, Youtube, Instagram, Send, Globe, MessageCircle, Check } from 'lucide-react';
import {
  SOCIAL_META,
  socialHref,
  visibleSocials,
  type SocialLinks,
  type SocialPlatform,
} from '../../services/socials';

/* ── A platform's mark ──
 * Lucide still carries most of these. X gets its own path (Lucide's bird is
 * the old logo), and the two security platforms, which have no icon in any
 * set we ship, get the short names their users call them by. */
const XMark: React.FC<{ size: number }> = ({ size }) => (
  <svg viewBox="0 0 24 24" width={size - 2} height={size - 2} fill="currentColor" aria-hidden>
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
  </svg>
);

const Monogram: React.FC<{ text: string; size: number }> = ({ text, size }) => (
  <span className="font-black leading-none tracking-tight" style={{ fontSize: Math.round(size * 0.48) }} aria-hidden>
    {text}
  </span>
);

export const SocialIcon: React.FC<{ platform: SocialPlatform; size?: number }> = ({ platform, size = 16 }) => {
  switch (platform) {
    case 'github':
      return <Github size={size} aria-hidden />;
    case 'linkedin':
      return <Linkedin size={size} aria-hidden />;
    case 'x':
      return <XMark size={size} />;
    case 'tryhackme':
      return <Monogram text="THM" size={size} />;
    case 'hackthebox':
      return <Monogram text="HTB" size={size} />;
    case 'youtube':
      return <Youtube size={size} aria-hidden />;
    case 'instagram':
      return <Instagram size={size} aria-hidden />;
    case 'telegram':
      return <Send size={size} aria-hidden />;
    case 'discord':
      return <MessageCircle size={size} aria-hidden />;
    case 'website':
      return <Globe size={size} aria-hidden />;
  }
};

/** How a stored value reads in a tooltip: "@name" for handles, the address
 *  without its scheme for links. */
function readable(platform: SocialPlatform, value: string): string {
  if (platform === 'website' || platform === 'hackthebox') return value.replace(/^https?:\/\//, '');
  if (platform === 'youtube' || platform === 'linkedin' || platform === 'tryhackme') return value;
  return `@${value}`;
}

/* Bare white marks, no circle behind them: the row sits in the text beside
   the picture and should read as part of it. The hit area stays a comfortable
   square even though nothing is drawn around the mark. */
const BTN =
  'flex h-8 w-8 items-center justify-center rounded-md text-white/80 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40';

/**
 * A member's links as a row of white icons. Links open in a new tab with no
 * referrer and are marked as user-supplied; Discord, which has no profile
 * address for a username, copies the name instead. The caller places and
 * aligns the row.
 */
const SocialLinksRow: React.FC<{
  links: SocialLinks | undefined | null;
  lang: 'en' | 'ar';
  className?: string;
}> = ({ links, lang, className = '' }) => {
  const [copied, setCopied] = useState<SocialPlatform | null>(null);
  const items = visibleSocials(links);
  if (items.length === 0) return null;

  const copy = async (platform: SocialPlatform, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(platform);
      setTimeout(() => setCopied((p) => (p === platform ? null : p)), 1600);
    } catch {
      /* clipboard refused: the name is still in the tooltip */
    }
  };

  return (
    <ul className={`flex flex-wrap items-center gap-1 ${className}`}>
      {items.map(([platform, value]) => {
        const meta = SOCIAL_META[platform];
        const href = socialHref(platform, value);
        const title = `${meta.label}: ${readable(platform, value)}`;
        return (
          <li key={platform}>
            {href ? (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer nofollow ugc"
                title={title}
                aria-label={`${title} (${lang === 'ar' ? 'يفتح في علامة تبويب جديدة' : 'opens in a new tab'})`}
                className={BTN}
              >
                <SocialIcon platform={platform} />
              </a>
            ) : (
              <button
                type="button"
                onClick={() => copy(platform, value)}
                title={copied === platform ? (lang === 'ar' ? 'نُسخ' : 'Copied') : title}
                aria-label={`${title}. ${lang === 'ar' ? 'انسخ اسم المستخدم' : 'Copy the username'}`}
                className={BTN}
              >
                {copied === platform ? <Check size={16} aria-hidden /> : <SocialIcon platform={platform} />}
              </button>
            )}
          </li>
        );
      })}
      <li className="sr-only" aria-live="polite">
        {copied ? (lang === 'ar' ? 'نُسخ اسم المستخدم' : 'Username copied') : ''}
      </li>
    </ul>
  );
};

export default SocialLinksRow;
