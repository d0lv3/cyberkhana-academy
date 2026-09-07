import React from 'react';
import { useNavigate } from 'react-router-dom';
import AcceptanceDialog from './AcceptanceDialog';
import { useAuth } from '../../contexts/AuthContext';
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
const CreatorAgreementGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const needsAcceptance = user?.role === 'creator' && user.creatorAgreementAccepted !== true;
  if (!needsAcceptance) return <>{children}</>;

  const handleAccept = async () => {
    await api.post('/auth/accept-creator-agreement', {});
    updateUser({ creatorAgreementAccepted: true });
  };

  return (
    <AcceptanceDialog
      title="Accept the Creator Agreement"
      intro="Before you can author content, you need to accept the Agreement that governs the role. Your student account is unaffected — you can keep learning either way."
      points={CREATOR_KEY_POINTS}
      docHref="#/creator-agreement"
      docLabel="Read the full Creator Agreement"
      updated={CREATOR_AGREEMENT_UPDATED}
      acceptLabel="Accept and open the Studio"
      onAccept={handleAccept}
      secondaryLabel="Back to dashboard"
      onSecondary={() => navigate('/dashboard')}
      footnote="Until you accept, the Content Studio stays locked and you cannot publish, edit or upload. Your progress, points and rank are not affected."
      confirmation={
        <>
          By continuing you confirm you have read and agree to the{' '}
          <a
            href="#/creator-agreement"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#00a859] underline underline-offset-4 hover:text-[#9fef00]"
          >
            Creator Agreement
          </a>
          , including that everything you publish is yours to publish, and that the licence you
          give CyberKhana is perpetual and continues if you later delete your account.
        </>
      }
    />
  );
};

export default CreatorAgreementGate;
