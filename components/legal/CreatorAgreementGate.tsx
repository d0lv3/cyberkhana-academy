import React from 'react';
import { useNavigate } from 'react-router-dom';
import AcceptanceDialog from './AcceptanceDialog';
import { useAuth } from '../../contexts/AuthContext';
import { useLang } from '../../contexts/LangContext';
import { api } from '../../services/api';
import {
  CREATOR_KEY_POINTS,
  CREATOR_AGREEMENT_UPDATED,
} from '../../data/creatorAgreementContent';

/**
 * Locks the Content Studio until a creator accepts the Creator Agreement.
 *
 * Students never see this. The Terms are agreed by signing in — the login
 * screen says so and links them — but the Creator Agreement puts a perpetual
 * licence over someone's work and personal responsibility on them, and a login
 * notice cannot carry that. It needs a deliberate act.
 *
 * Admins are exempt: they operate the Academy rather than volunteer as
 * creators, and gating them could lock out the only people able to unlock
 * anyone else.
 *
 * Enforced independently on the server inside `requireRole`, which every
 * content, collab, upload and feedback-reading endpoint already passes through.
 */

const COPY = {
  en: {
    title: 'Accept the Creator Agreement',
    intro:
      'Before you can author content, you need to accept the Agreement that governs the role. Your student account is unaffected — you can keep learning either way.',
    docLabel: 'Read the full Creator Agreement',
    acceptLabel: 'Accept and open the Studio',
    secondaryLabel: 'Back to dashboard',
    footnote:
      'Until you accept, the Content Studio stays locked and you cannot publish, edit or upload. Your progress, points and rank are not affected.',
    confirmBefore: 'By continuing you confirm you have read and agree to the ',
    confirmLink: 'Creator Agreement',
    confirmAfter:
      ', including that everything you publish is yours to publish, and that the licence you give CyberKhana is perpetual and continues if you later delete your account.',
  },
  ar: {
    title: 'الموافقة على اتفاقية المُنشِئ',
    intro:
      'قبل أن تتمكن من تأليف المحتوى، عليك الموافقة على الاتفاقية التي تحكم هذا الدور. ولن يتأثر حسابك كطالب — يمكنك مواصلة التعلّم في الحالتين.',
    docLabel: 'اقرأ اتفاقية المُنشِئ كاملة',
    acceptLabel: 'أوافق وافتح الاستوديو',
    secondaryLabel: 'العودة إلى لوحة التحكم',
    footnote:
      'إلى أن توافق، يبقى استوديو المحتوى مقفلًا ولن تتمكن من النشر أو التعديل أو الرفع. ولن يتأثر تقدّمك ولا نقاطك ولا مرتبتك.',
    confirmBefore: 'بالمتابعة فإنك تُقرّ بأنك قرأت ووافقت على ',
    confirmLink: 'اتفاقية المُنشِئ',
    confirmAfter:
      '، بما في ذلك أن كل ما تنشره لك حق نشره، وأن الترخيص الذي تمنحه لسايبر خانة دائم ويستمر إذا حذفت حسابك لاحقًا.',
  },
};

const CreatorAgreementGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, updateUser } = useAuth();
  const { lang } = useLang();
  const navigate = useNavigate();

  const needsAcceptance = user?.role === 'creator' && user.creatorAgreementAccepted !== true;
  if (!needsAcceptance) return <>{children}</>;

  const t = COPY[lang];

  const handleAccept = async () => {
    await api.post('/auth/accept-creator-agreement', {});
    updateUser({ creatorAgreementAccepted: true });
  };

  return (
    <AcceptanceDialog
      title={t.title}
      intro={t.intro}
      points={CREATOR_KEY_POINTS[lang]}
      docHref="#/creator-agreement"
      docLabel={t.docLabel}
      updated={CREATOR_AGREEMENT_UPDATED[lang]}
      acceptLabel={t.acceptLabel}
      onAccept={handleAccept}
      secondaryLabel={t.secondaryLabel}
      onSecondary={() => navigate('/dashboard')}
      footnote={t.footnote}
      confirmation={
        <>
          {t.confirmBefore}
          <a
            href="#/creator-agreement"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#00a859] underline underline-offset-4 hover:text-[#9fef00]"
          >
            {t.confirmLink}
          </a>
          {t.confirmAfter}
        </>
      }
    />
  );
};

export default CreatorAgreementGate;
