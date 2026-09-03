import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Send, Linkedin, Globe, ExternalLink } from 'lucide-react';
import { useLang } from '../../contexts/LangContext';
import BrandLogo from '../ui/BrandLogo';

interface Social {
  label: string;
  icon: typeof Send;
  href: string;
  /** Only where the visible label cannot stand on its own. */
  aria?: string;
}

/**
 * Two Telegram destinations now, and they sit next to each other so the pair
 * reads as one platform. The channel keeps the plain "Telegram" it has always
 * had and the group takes "Group", which is only unambiguous beside it — a chip
 * is too narrow for "Telegram Group" at a phone's width, so what the label
 * cannot say the accessible name does.
 */
const SOCIALS: Social[] = [
  { label: 'Telegram', icon: Send, href: 'https://t.me/cyberkhana' },
  {
    label: 'Group',
    icon: Send,
    href: 'https://t.me/cyberkhana_chat',
    aria: 'CyberKhana Telegram group',
  },
  { label: 'Instagram', icon: Instagram, href: 'https://www.instagram.com/cyberkhana' },
  { label: 'LinkedIn', icon: Linkedin, href: 'https://www.linkedin.com/company/cyberkhana/' },
];

const socialBtn =
  'inline-flex items-center justify-center gap-1.5 px-3.5 py-2 touch:min-h-tap rounded-lg border border-[#263248] bg-white/[0.02] text-xs font-bold text-[#d2d7e3] hover:border-[#9fef00]/40 hover:bg-[#9fef00]/10 hover:text-[#9fef00] transition-all';

const LandingFooter: React.FC = () => {
  const { t, lang } = useLang();

  const links = [
    t('features.fundamentals.title'),
    t('features.modules.title'),
    t('features.paths.title'),
  ];

  return (
    <footer className="border-t border-[#1e293b] bg-[#0a0f18] px-6 pt-14 pb-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10">
          {/* Brand */}
          <div className="flex flex-col items-center md:items-start gap-3 max-w-xs mx-auto md:mx-0 text-center md:text-start">
            <p className="text-sm text-[#8592ad] leading-relaxed">
              {t('footer.tagline')}
            </p>
          </div>

          {/* Quick links */}
          <div className="flex flex-col items-center md:items-start gap-3">
            <p className="text-[11px] font-bold tracking-[0.15em] text-[#7c8aa6] uppercase">
              {t('footer.product')}
            </p>
            <ul className="flex flex-col items-center md:items-start gap-2">
              {links.map((label) => (
                <li key={label}>
                  <span className="text-sm text-[#9aa5bf] hover:text-[#9fef00] transition-colors cursor-default">
                    {label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Connect bar — brand | motto · platform + socials ── */}
        <div className="mt-12 rounded-2xl border border-[#263248] bg-[#121a2a] px-5 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3 sm:gap-4 min-w-0">
            <BrandLogo variant="full" loading="lazy" className="h-9 w-auto max-w-[160px] object-contain flex-shrink-0" />
            <span className="hidden sm:block w-px h-9 bg-[#263248] flex-shrink-0" />
            <p className="text-sm text-[#9aa5bf] leading-snug max-w-[340px] text-center md:text-start">
              {lang === 'ar'
                ? 'نُحدث ثورة في مشهد تعليم الأمن السيبراني في العراق.'
                : 'Revolutionizing the Iraqi Cybersecurity Education Landscape.'}
            </p>
          </div>

          {/* The product button and the social set stack as two rows that each
              wrap as a unit, which is the shape the other two sites use. The
              set used to rejoin the button's row at sm+ with `contents`; a
              fourth chip is what tips that row over, and a stranded chip on a
              line of its own reads as a mistake rather than as a layout. */}
          <div className="flex flex-col items-stretch gap-2 w-full md:w-auto">
            {/* Main platform */}
            <a
              // app, not the apex: this button says "CyberKhana Platform", and the
              // apex is the umbrella page introducing both products rather than the
              // platform itself.
              href="https://app.cyberkhana.tech"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 touch:min-h-tap rounded-lg border border-[#00a859]/40 bg-[#00a859]/10 text-xs font-bold text-[#00a859] hover:bg-[#00a859]/20 hover:shadow-[0_0_16px_rgba(0,168,89,0.25)] transition-all"
            >
              <Globe size={13} />
              {lang === 'ar' ? 'منصة CyberKhana' : 'CyberKhana Platform'}
              <ExternalLink size={11} />
            </a>

            {/* An even two-up on phones, four-up from sm */}
            <div className="grid grid-cols-2 gap-2 w-full sm:grid-cols-4">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.aria}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={socialBtn}
                >
                  <s.icon size={13} />
                  {s.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-6 border-t border-[#1a2332] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-[#8592ad] text-center sm:text-start">{t('footer.copyright')}</p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <Link to="/privacy" className="inline-flex items-center touch:min-h-tap touch:px-2 text-xs text-[#8592ad] hover:text-[#9fef00] transition-colors">
              {t('footer.privacy')}
            </Link>
            <Link to="/terms" className="inline-flex items-center touch:min-h-tap touch:px-2 text-xs text-[#8592ad] hover:text-[#9fef00] transition-colors">
              {t('footer.terms')}
            </Link>
            <span className="text-xs text-[#8592ad] flex items-center gap-1.5">
              {t('footer.builtIn')} <span>🇮🇶</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;
