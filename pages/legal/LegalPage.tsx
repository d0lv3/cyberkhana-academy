import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Globe, ArrowLeft, AlertTriangle } from 'lucide-react';
import { useLang } from '../../contexts/LangContext';
import BrandLogo from '../../components/ui/BrandLogo';
import LandingFooter from '../../components/landing/LandingFooter';
import { displayStyle } from '../../components/ui/displayFont';
import { TERMS } from '../../data/termsContent';
import { PRIVACY } from '../../data/privacyContent';
import { CREATOR_AGREEMENT } from '../../data/creatorAgreementContent';
import type { BilingualDoc, LegalSection } from '../../data/legalTypes';

export type LegalKind = 'privacy' | 'terms' | 'creator-agreement';

const DOCS: Record<LegalKind, BilingualDoc> = {
  privacy: PRIVACY,
  terms: TERMS,
  'creator-agreement': CREATOR_AGREEMENT,
};

const Section: React.FC<{ s: LegalSection; index: number }> = ({ s, index }) => (
  <section
    className={
      s.emphasis
        ? 'rounded-xl border border-[#f3a43a]/30 bg-[#f3a43a]/[0.06] p-5 sm:p-6'
        : undefined
    }
  >
    <h2 className="text-lg font-bold text-[#f3f6ff] mb-3 flex items-start gap-2">
      {s.emphasis && (
        <AlertTriangle size={17} className="mt-1 shrink-0 text-[#f3a43a]" aria-hidden="true" />
      )}
      <span>
        <span className="text-[#00a859] font-mono text-sm me-2">
          {String(index + 1).padStart(2, '0')}
        </span>
        {s.h}
      </span>
    </h2>

    <div className="space-y-2.5">
      {s.body?.map((p, j) => (
        <p key={`b${j}`} className="text-[#9aa5bf] text-[15px] leading-relaxed">
          {p}
        </p>
      ))}

      {s.list && (
        <ul className="space-y-2 pt-1">
          {s.list.map((li, j) => (
            <li key={`l${j}`} className="flex gap-3 text-[#9aa5bf] text-[15px] leading-relaxed">
              <span
                aria-hidden="true"
                className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#00a859]"
              />
              <span>{li}</span>
            </li>
          ))}
        </ul>
      )}

      {s.after?.map((p, j) => (
        <p key={`a${j}`} className="text-[#9aa5bf] text-[15px] leading-relaxed pt-1">
          {p}
        </p>
      ))}
    </div>
  </section>
);

const LegalPage: React.FC<{ kind: LegalKind }> = ({ kind }) => {
  const { lang, setLang, isArabic } = useLang();
  /* Both languages are now written. The English still governs — each document
     says so in its own Language section — but an Arabic reader gets the Arabic
     text rather than the English plus an apology. */
  const doc = DOCS[kind][lang];

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = `${doc.title} · CyberKhana Academy`;
  }, [kind, doc.title]);

  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col">
      <header className="sticky top-0 z-30 border-b border-[#1e293b] bg-[#0d1117]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <BrandLogo variant="full" loading="eager" className="h-8 w-auto max-w-[170px] object-contain" />
          </Link>
          <button
            onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
            className="flex items-center gap-1.5 px-3 py-1.5 touch:min-h-tap touch:px-4 rounded-lg text-xs font-semibold text-[#9aa5bf] hover:text-[#9fef00] hover:bg-[#182235] transition-all"
          >
            <Globe size={14} />
            <span>{lang === 'en' ? 'العربية' : 'English'}</span>
          </button>
        </div>
      </header>

      <main className="flex-1 px-6 py-14 md:py-20">
        <article className="max-w-3xl mx-auto" dir={isArabic ? 'rtl' : 'ltr'}>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 touch:min-h-tap text-sm text-[#8592ad] hover:text-[#9fef00] transition-colors mb-6 sm:mb-8"
          >
            <ArrowLeft size={15} className="rtl:rotate-180" />
            {lang === 'ar' ? 'العودة إلى الرئيسية' : 'Back to home'}
          </Link>

          <h1
            style={displayStyle(isArabic)}
            className="text-3xl md:text-4xl font-black tracking-tight text-[#f3f6ff]"
          >
            {doc.title}
          </h1>
          <p className="mt-2 text-sm text-[#8592ad]">
            {isArabic ? 'آخر تحديث' : 'Last updated'} {doc.updated}{' '}
            <span className="text-[#7c8aa6]">
              ({isArabic ? 'الإصدار' : 'version'} {doc.version})
            </span>
          </p>

          <p className="mt-6 text-[#9aa5bf] leading-relaxed">{doc.intro}</p>

          {doc.callout && (
            <div className="mt-8 rounded-xl border border-[#f3a43a]/30 bg-[#f3a43a]/[0.06] p-5 sm:p-6">
              <h2 className="flex items-center gap-2 text-base font-bold text-[#f3a43a]">
                <AlertTriangle size={18} aria-hidden="true" />
                {doc.callout.heading}
              </h2>
              {doc.callout.body.map((p, i) => (
                <p key={i} className="mt-3 text-[15px] leading-relaxed text-[#9aa5bf]">
                  {p}
                </p>
              ))}
            </div>
          )}

          <div className="mt-10 space-y-9">
            {doc.sections.map((s, i) => (
              <Section key={i} s={s} index={i} />
            ))}
          </div>

          <div className="mt-14 border-t border-[#1e293b] pt-6 text-sm text-[#8592ad]">
            <p>
              {isArabic ? 'أسئلة؟' : 'Questions?'}{' '}
              <a
                href="mailto:support@cyberkhana.tech"
                className="text-[#00a859] underline underline-offset-4 hover:text-[#9fef00]"
              >
                support@cyberkhana.tech
              </a>
            </p>
            <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#7c8aa6]">
              {kind !== 'terms' && (
                <Link to="/terms" className="hover:text-[#9fef00] transition-colors">
                  {isArabic ? 'شروط الخدمة' : 'Terms of Service'}
                </Link>
              )}
              {kind !== 'privacy' && (
                <Link to="/privacy" className="hover:text-[#9fef00] transition-colors">
                  {isArabic ? 'سياسة الخصوصية' : 'Privacy Policy'}
                </Link>
              )}
              {kind !== 'creator-agreement' && (
                <Link to="/creator-agreement" className="hover:text-[#9fef00] transition-colors">
                  {isArabic ? 'اتفاقية المُنشِئ' : 'Creator Agreement'}
                </Link>
              )}
            </p>
          </div>
        </article>
      </main>

      <LandingFooter />
    </div>
  );
};

export default LegalPage;
