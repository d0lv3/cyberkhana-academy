import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Award, BadgeCheck, ShieldX } from 'lucide-react';
import { useLang } from '../../contexts/LangContext';
import { useAuth } from '../../contexts/AuthContext';
import { fetchMyCertificates, type MyCertificates as Mine } from '../../services/certificateService';

/* ─── Certificates on a profile ───
 *
 * Each card opens the certificate's own page, which is the thing that proves
 * it. On someone else's profile only certificates still standing are listed,
 * and none at all if their holder took them off the profile; the holder's
 * own list also shows one that was withdrawn, and says why.
 */

export interface CertificateCardItem {
  code: string;
  pathTitle: string;
  issuedAt: string;
  distinction: boolean;
  revoked?: boolean;
  revokedReason?: string | null;
}

export const CertificateCards: React.FC<{ items: CertificateCardItem[] }> = ({ items }) => {
  const { isArabic } = useLang();
  const say = (en: string, ar: string) => (isArabic ? ar : en);
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {items.map((c) => {
        const accent = c.revoked ? '#f87171' : c.distinction ? '#9fef00' : '#00a859';
        return (
          <Link
            key={c.code}
            to={`/certificates/${c.code}`}
            className="group flex items-center gap-3.5 rounded-xl border border-[#263248] bg-[#0d1117] p-3.5 transition-colors hover:border-[#354562]"
          >
            <span
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg border"
              style={{ color: accent, borderColor: `${accent}55`, backgroundColor: `${accent}14` }}
            >
              {c.revoked ? <ShieldX size={20} /> : <Award size={20} />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold text-[#f3f6ff]" dir="auto">
                {c.pathTitle}
              </span>
              <span className="mt-0.5 block text-xs text-[#8592ad]">
                {c.revoked ? (
                  <span className="text-red-400">{say('Revoked', 'مسحوبة')}</span>
                ) : (
                  <>
                    {say('Certificate of achievement', 'شهادة إنجاز')}
                    {c.distinction && <> · {say('with distinction', 'بامتياز')}</>}
                  </>
                )}
                {' · '}
                {new Date(c.issuedAt).toLocaleDateString(isArabic ? 'ar' : 'en-GB', { month: 'short', year: 'numeric' })}
              </span>
              {c.revoked && c.revokedReason && (
                <span className="mt-0.5 block truncate text-[11px] text-[#8592ad]" dir="auto">
                  {c.revokedReason}
                </span>
              )}
            </span>
            <ArrowUpRight size={16} className="rtl-flip flex-shrink-0 text-[#7c8aa6] group-hover:text-[#f3f6ff]" />
          </Link>
        );
      })}
    </div>
  );
};

/** The signed-in member's own certificates, with the ones still to claim and
 *  the switch that takes them off the public profile. */
export const MyCertificates: React.FC = () => {
  const { isArabic } = useLang();
  const say = (en: string, ar: string) => (isArabic ? ar : en);
  const { user, updateProfile } = useAuth();
  const [mine, setMine] = useState<Mine | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let live = true;
    fetchMyCertificates()
      .then((m) => {
        if (live) setMine(m);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, []);

  // Nothing earned yet: the profile says nothing about certificates at all.
  if (!mine || (mine.certificates.length === 0 && mine.claimable.length === 0)) return null;
  const shown = user?.showCertificates !== false;

  return (
    <div className="rounded-2xl border border-[#263248] bg-[#121a2a] p-4 sm:p-6">
      <h3 className="mb-1 flex items-center gap-2 text-base font-bold text-[#f3f6ff]">
        <BadgeCheck size={17} className="text-[#00a859]" /> {say('Certificates', 'الشهادات')}
      </h3>
      <p className="mb-4 text-xs text-[#8592ad]">
        {say(
          'Each has a public page. Anyone you give the link to can check it, signed in or not.',
          'لكل شهادة صفحة عامة. كل من تعطيه الرابط يستطيع التحقق منها، سواء سجّل الدخول أم لا.'
        )}
      </p>

      {mine.claimable.length > 0 && (
        <div className="mb-4 space-y-2">
          {mine.claimable.map((c) => (
            <Link
              key={c.pathId}
              to={`/paths/${c.pathSlug}/exam`}
              className="flex items-center gap-3 rounded-xl border border-[#9fef00]/30 bg-[#9fef00]/[0.05] px-4 py-3 text-sm text-[#d2d7e3] transition-colors hover:border-[#9fef00]/50"
            >
              <Award size={17} className="flex-shrink-0 text-[#9fef00]" />
              <span className="min-w-0 flex-1">
                <span className="font-bold text-[#f3f6ff]">{say('Ready to claim:', 'جاهزة للطلب:')}</span>{' '}
                <span dir="auto">{c.pathTitle}</span>
              </span>
              <ArrowUpRight size={16} className="rtl-flip flex-shrink-0 text-[#9fef00]" />
            </Link>
          ))}
        </div>
      )}

      {mine.certificates.length > 0 && <CertificateCards items={mine.certificates} />}

      {mine.certificates.length > 0 && (
        <label className="mt-4 flex items-center gap-2.5 border-t border-[#1e293b] pt-4 text-sm text-[#d2d7e3]">
          <input
            type="checkbox"
            checked={shown}
            disabled={saving}
            onChange={async (e) => {
              setSaving(true);
              try {
                await updateProfile({ showCertificates: e.target.checked });
              } catch {
                /* the box goes back to what the server still holds */
              } finally {
                setSaving(false);
              }
            }}
            className="accent-[#00a859]"
          />
          {say('List my certificates on my public profile', 'عرض شهاداتي في ملفي العام')}
        </label>
      )}
    </div>
  );
};
