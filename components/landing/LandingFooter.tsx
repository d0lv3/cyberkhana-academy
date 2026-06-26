import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Send, Linkedin, Globe, ExternalLink } from 'lucide-react';
import { useLang } from '../../contexts/LangContext';
import BrandLogo from '../ui/BrandLogo';

const SOCIALS = [
  { label: 'Instagram', icon: Instagram, href: 'https://www.instagram.com/cyberkhana' },
  { label: 'Telegram', icon: Send, href: 'https://t.me/cyberkhana' },
  { label: 'LinkedIn', icon: Linkedin, href: 'https://www.linkedin.com/company/cyberkhana/' },
];

const socialBtn =
  'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#263248] bg-white/[0.02] text-xs font-bold text-[#d2d7e3] hover:border-[#9fef00]/40 hover:bg-[#9fef00]/10 hover:text-[#9fef00] transition-all';

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
          <div className="flex flex-col items-center md:items-start gap-3 max-w-xs text-center md:text-start">
            <p className="text-sm text-[#6e7a94] leading-relaxed">
              {t('footer.tagline')}
            </p>
          </div>

          {/* Quick links */}
          <div className="flex flex-col items-center md:items-start gap-3">
            <p className="text-[11px] font-bold tracking-[0.15em] text-[#4d5a73] uppercase">
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
          <div className="flex items-center justify-center md:justify-start gap-4 min-w-0">
            <BrandLogo variant="full" loading="lazy" className="h-9 w-auto max-w-[160px] object-contain flex-shrink-0" />
            <span className="hidden sm:block w-px h-9 bg-[#263248] flex-shrink-0" />
            <p className="text-sm text-[#9aa5bf] leading-snug max-w-[340px] text-center md:text-start">
              {lang === 'ar'
                ? 'نُحدث ثورة في مشهد تعليم الأمن السيبراني في العراق.'
                : 'Revolutionizing the Iraqi Cybersecurity Education Landscape.'}
            </p>
          </div>

          <div className="flex items-center justify-center md:justify-end gap-2 flex-wrap">
            {/* Main platform */}
            <a
              href="https://www.cyberkhana.tech"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#00a859]/40 bg-[#00a859]/10 text-xs font-bold text-[#00a859] hover:bg-[#00a859]/20 hover:shadow-[0_0_16px_rgba(0,168,89,0.25)] transition-all"
            >
              <Globe size={13} />
              {lang === 'ar' ? 'منصة CyberKhana' : 'CyberKhana Platform'}
              <ExternalLink size={11} />
            </a>

            {/* Socials */}
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.href}
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

        {/* Bottom bar */}
        <div className="mt-8 pt-6 border-t border-[#1a2332] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-[#6e7a94]">{t('footer.copyright')}</p>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="text-xs text-[#6e7a94] hover:text-[#9fef00] transition-colors">
              {t('footer.privacy')}
            </Link>
            <Link to="/terms" className="text-xs text-[#6e7a94] hover:text-[#9fef00] transition-colors">
              {t('footer.terms')}
            </Link>
            <span className="text-xs text-[#6e7a94] flex items-center gap-1.5">
              {t('footer.builtIn')} <span>🇮🇶</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;
