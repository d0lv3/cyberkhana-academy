import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BadgeCheck, Check, Copy, Linkedin, Printer, ShieldX } from 'lucide-react';
import CertificateTemplate from '../../components/certificates/CertificateTemplate';
import BrandLogo from '../../components/ui/BrandLogo';
import { useLang } from '../../contexts/LangContext';
import { useAuth } from '../../contexts/AuthContext';
import { ApiError } from '../../services/api';
import { certificateLink, linkedInAddUrl, verifyCertificate, type CertificateData } from '../../services/certificateService';

/* ─── A certificate, and its verification ───
 *
 * The link is what a learner puts on a CV or a profile. Anyone can open it,
 * signed in or not, and see who the certificate was issued to, for what, and
 * whether it still stands. It is the one page of the Academy that shows
 * something to the public, so it shows only what the server's allowlist
 * sends (backend/src/routes/certificates.ts publicCertificate).
 *
 * The sheet itself is in English for everyone. The page around it follows the
 * reader's language.
 */

const actionCls =
  'inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-semibold transition-colors';

const CertificatePage: React.FC = () => {
  const { code = '' } = useParams<{ code: string }>();
  const { isArabic } = useLang();
  const say = (en: string, ar: string) => (isArabic ? ar : en);
  const { user } = useAuth();

  const [certificate, setCertificate] = useState<CertificateData | null>(null);
  const [state, setState] = useState<'loading' | 'found' | 'missing' | 'failed'>('loading');
  const [copied, setCopied] = useState(false);
  const link = certificateLink(code);

  useEffect(() => {
    const before = document.title;
    let live = true;
    setState('loading');
    verifyCertificate(code)
      .then(({ certificate: found }) => {
        if (!live) return;
        setCertificate(found);
        setState('found');
        document.title = `${found.name} · ${found.pathTitle} · CyberKhana Academy`;
      })
      .catch((err) => {
        if (live) setState(err instanceof ApiError && err.status === 404 ? 'missing' : 'failed');
      });
    return () => {
      live = false;
      document.title = before;
    };
  }, [code]);

  /* Its holder, signed in: the one person "add to my profile" is for. */
  const mine =
    !!user && !!certificate && ((!!user.username && user.username === certificate.username) || user.certificateName === certificate.name);

  const longDate = (iso: string) =>
    new Date(iso).toLocaleDateString(isArabic ? 'ar' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-[#0a0e14] text-[#d2d7e3]">
      <header className="border-b border-[#263248] bg-[#0d1117] print:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" aria-label="CyberKhana Academy" className="flex items-center gap-3">
            <BrandLogo className="h-7 w-auto" />
          </Link>
          <p className="text-xs font-semibold text-[#8592ad]">{say('Certificate verification', 'التحقق من الشهادة')}</p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        {state === 'loading' && (
          <div className="aspect-[297/210] w-full animate-pulse rounded-lg bg-[#121a2a]" aria-busy="true" aria-label={say('Loading certificate', 'جارٍ تحميل الشهادة')} />
        )}

        {(state === 'missing' || state === 'failed') && (
          <div className="mx-auto max-w-md py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#263248] bg-[#121a2a]">
              <ShieldX size={24} className="text-[#8592ad]" />
            </div>
            <h1 className="text-lg font-bold text-[#f3f6ff]">
              {state === 'missing' ? say('No certificate with this code', 'لا توجد شهادة بهذا الرمز') : say('Could not check this certificate', 'تعذّر التحقق من هذه الشهادة')}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[#8592ad]">
              {state === 'missing'
                ? say(
                    'Check that the link is complete. CyberKhana Academy certificate codes are 32 characters long. A certificate also stops verifying if its holder deletes their account.',
                    'تأكد من اكتمال الرابط. رموز شهادات أكاديمية سايبرخانة مكوّنة من 32 حرفًا. تتوقف الشهادة عن التحقق أيضًا إذا حذف حاملها حسابه.'
                  )
                : say('Check your connection and open the link again.', 'تحقق من اتصالك وافتح الرابط مجددًا.')}
            </p>
          </div>
        )}

        {state === 'found' && certificate && (
          <>
            {certificate.revoked ? (
              <div role="alert" className="flex gap-3 rounded-xl border border-red-500/40 bg-red-500/10 px-5 py-4">
                <ShieldX size={20} className="mt-0.5 flex-shrink-0 text-red-400" />
                <p className="text-sm text-[#d2d7e3]">
                  <span className="font-semibold text-red-300">{say('This certificate has been revoked', 'سُحبت هذه الشهادة')}</span>{' '}
                  {say('by CyberKhana Academy. It is no longer valid.', 'من قِبل أكاديمية سايبرخانة، ولم تعد صالحة.')}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4 rounded-xl border border-[#00a859]/30 bg-[#00a859]/[0.06] px-5 py-4 lg:flex-row lg:items-center print:hidden">
                <BadgeCheck size={22} className="flex-shrink-0 text-[#00a859]" />
                <p className="flex-1 text-sm leading-relaxed text-[#d2d7e3]">
                  <span className="font-semibold text-[#f3f6ff]">{say('Verified.', 'شهادة موثَّقة.')}</span>{' '}
                  {say('Issued to', 'صادرة باسم')} <span dir="auto" className="font-semibold text-[#f3f6ff]">{certificate.name}</span>{' '}
                  {say('for', 'عن')} <span dir="auto" className="font-semibold text-[#f3f6ff]">{certificate.pathTitle}</span>{' '}
                  {say('by CyberKhana Academy on', 'من أكاديمية سايبرخانة بتاريخ')} {longDate(certificate.issuedAt)}.
                </p>
                <div className="flex flex-shrink-0 flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(link);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 1500);
                      } catch {
                        /* the address bar has it */
                      }
                    }}
                    className={`${actionCls} border-[#263248] text-[#d2d7e3] hover:border-[#354562]`}
                  >
                    {copied ? <Check size={14} className="text-[#00a859]" /> : <Copy size={14} />}
                    {copied ? say('Copied', 'تم النسخ') : say('Copy link', 'نسخ الرابط')}
                  </button>
                  {mine && (
                    <a
                      href={linkedInAddUrl(certificate)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${actionCls} border-[#263248] text-[#d2d7e3] hover:border-[#354562]`}
                    >
                      <Linkedin size={14} /> {say('Add to LinkedIn', 'إضافة إلى لينكدإن')}
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className={`${actionCls} border-[#00a859]/50 bg-[#00a859]/15 text-[#00a859] hover:bg-[#00a859]/25`}
                  >
                    <Printer size={14} /> {say('Print or save as PDF', 'طباعة أو حفظ PDF')}
                  </button>
                </div>
              </div>
            )}

            {!certificate.revoked && (
              <>
                <CertificateTemplate certificate={certificate} verifyUrl={link} />

                <section className="grid grid-cols-1 gap-6 rounded-2xl border border-[#263248] bg-[#121a2a] p-5 sm:p-6 lg:grid-cols-[1fr_18rem] print:hidden">
                  <div>
                    <h2 className="text-sm font-bold text-[#f3f6ff]">{say('What this certificate covers', 'ما تغطيه هذه الشهادة')}</h2>
                    <p className="mt-1.5 text-xs leading-relaxed text-[#8592ad]">
                      {say(
                        'Its holder finished every step of this learning path, as it stood then, and passed its final exam.',
                        'أنهى حاملها كل خطوات هذا المسار التعليمي كما كان حينها، ونجح في اختباره النهائي.'
                      )}
                    </p>
                    {certificate.syllabus.length > 0 && (
                      <ol className="mt-4 grid grid-cols-1 gap-x-6 gap-y-1.5 text-sm text-[#d2d7e3] sm:grid-cols-2">
                        {certificate.syllabus.map((title, i) => (
                          <li key={i} className="flex min-w-0 items-baseline gap-2">
                            <span className="w-5 flex-shrink-0 text-[11px] font-bold text-[#00a859]" dir="ltr">
                              {i + 1}
                            </span>
                            <span className="min-w-0 truncate" dir="auto">
                              {title}
                            </span>
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                  <dl className="space-y-3 text-sm">
                    {[
                      [say('Path completed', 'إكمال المسار'), longDate(certificate.pathCompletedAt)],
                      [say('Issued', 'تاريخ الإصدار'), longDate(certificate.issuedAt)],
                      [
                        say('Final exam', 'الاختبار النهائي'),
                        `${certificate.practical ? say('Practical', 'عملي') : say('Theory', 'نظري')}${
                          certificate.distinction ? ` · ${say('with distinction', 'بامتياز')}` : ''
                        }`,
                      ],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <dt className="text-[11px] font-semibold uppercase tracking-wider text-[#8592ad]">{label}</dt>
                        <dd className="mt-0.5 text-[#f3f6ff]">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </section>

                <p className="text-center text-[11px] leading-relaxed text-[#6e7a94] print:hidden">
                  {say(
                    'A CyberKhana Academy certificate records that its holder completed this content. It is not an accredited qualification and does not license anyone to do professional security work.',
                    'شهادة أكاديمية سايبرخانة تثبت أن حاملها أكمل هذا المحتوى. ليست مؤهلًا معتمدًا، ولا تمنح ترخيصًا لمزاولة العمل الأمني المهني.'
                  )}
                </p>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default CertificatePage;
