import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Medal, GraduationCap } from 'lucide-react';
import { useLang } from '../../contexts/LangContext';
import { universityLabel } from '../../data/iraqUniversities';

export interface PodiumEntry {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  university: string | null;
  points: number;
}

interface TierMeta {
  label: { en: string; ar: string };
  /** Solid accent (frame, badge, glow). */
  accent: string;
  /** Diamond gradient for the tier pill. */
  grad: string;
}

/* Academy podium tiers — gold / silver / bronze (warmer than the main
 * platform's purple "Holo", to match the trophy theme used here). */
const TIERS: Record<1 | 2 | 3, TierMeta> = {
  1: { label: { en: 'Gold', ar: 'ذهبي' }, accent: '#f3c84b', grad: 'from-[#fde68a] to-[#f3c84b]' },
  2: { label: { en: 'Silver', ar: 'فضي' }, accent: '#c0cadf', grad: 'from-[#e2e8f0] to-[#c0cadf]' },
  3: { label: { en: 'Bronze', ar: 'برونزي' }, accent: '#d6a55a', grad: 'from-[#e5b970] to-[#a46b28]' },
};

/* Shield/pentagon silhouette borrowed from the main platform's podium. */
const SHIELD = 'polygon(4% 0%,96% 0%,100% 8%,100% 84%,50% 100%,0% 84%,0% 8%)';

/* Warm rising particles for the #1 card (gold → neon green, on-brand). */
const fireParticles = [
  { left: '16%', bottom: 24, delay: 0.0, duration: 1.2, size: 'w-1.5 h-1.5', color: 'from-[#f59e0b] via-[#fde68a] to-[#9fef00]' },
  { left: '30%', bottom: 18, delay: 0.18, duration: 1.35, size: 'w-2 h-2', color: 'from-[#9fef00] via-[#fde68a] to-[#f59e0b]' },
  { left: '46%', bottom: 22, delay: 0.32, duration: 1.15, size: 'w-1 h-1', color: 'from-[#f59e0b] via-[#facc15] to-[#9fef00]' },
  { left: '60%', bottom: 20, delay: 0.46, duration: 1.25, size: 'w-2 h-2', color: 'from-[#facc15] via-[#9fef00] to-[#f59e0b]' },
  { left: '74%', bottom: 26, delay: 0.6, duration: 1.4, size: 'w-1.5 h-1.5', color: 'from-[#fbbf24] via-[#f59e0b] to-[#9fef00]' },
  { left: '84%', bottom: 18, delay: 0.74, duration: 1.1, size: 'w-1 h-1', color: 'from-[#9fef00] via-[#fde68a] to-[#f59e0b]' },
];

const PodiumCard: React.FC<{ entry: PodiumEntry; highlight?: boolean; isMe?: boolean }> = ({
  entry,
  highlight,
  isMe,
}) => {
  const { lang } = useLang();
  const rank = entry.rank as 1 | 2 | 3;
  const tier = TIERS[rank] ?? TIERS[3];
  const height = highlight ? 'h-[18rem] md:h-[20rem]' : 'h-[15.5rem] md:h-[17rem]';

  return (
    <div className="relative pt-6">
      {/* Crown floats above the #1 card */}
      {rank === 1 && (
        <Crown
          size={26}
          className="absolute left-1/2 -translate-x-1/2 top-0 z-30"
          style={{ color: tier.accent }}
          fill={tier.accent}
        />
      )}

      {/* Rising particles for #1 */}
      {rank === 1 && (
        <div className="pointer-events-none absolute inset-x-0 top-8 bottom-0 z-20 overflow-hidden">
          {fireParticles.map((p, i) => (
            <motion.span
              key={i}
              className={`absolute ${p.size} rounded-full bg-gradient-to-t ${p.color}`}
              style={{ left: p.left, bottom: p.bottom }}
              animate={{ opacity: [0, 0.95, 0], y: [0, -22, -40], x: [0, i % 2 === 0 ? 6 : -6, 0], scale: [0.7, 1.15, 0.5] }}
              transition={{ duration: p.duration, repeat: Infinity, ease: 'easeOut', delay: p.delay }}
            />
          ))}
        </div>
      )}

      {/* Rank badge */}
      <div
        className="absolute left-1/2 -translate-x-1/2 top-3 z-30 w-7 h-7 rounded-lg flex items-center justify-center text-sm font-black shadow-sm"
        style={{ backgroundColor: tier.accent, color: '#11161f' }}
      >
        {rank}
      </div>

      {/* Soft glow behind the card in the tier color */}
      <div
        className="pointer-events-none absolute inset-x-6 top-10 bottom-2 rounded-full blur-2xl opacity-25"
        style={{ backgroundColor: tier.accent }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: highlight ? 0 : 0.1 }}
        className={`relative w-full ${height} drop-shadow-[0_10px_28px_rgba(0,0,0,0.4)]`}
      >
        {/* Frame (tier color) */}
        <div className="absolute inset-0" style={{ clipPath: SHIELD, backgroundColor: tier.accent, opacity: 0.85 }} />
        {/* "You" ring sits just inside the frame */}
        {isMe && (
          <div className="absolute inset-[1px]" style={{ clipPath: SHIELD, backgroundColor: '#00a859' }} />
        )}

        {/* Inner panel */}
        <div
          className="absolute inset-[2px] overflow-hidden bg-[#121a2a]"
          style={{ clipPath: SHIELD }}
        >
          <div className="relative z-10 h-full flex flex-col items-center justify-center px-4 text-center">
            <div
              className="rounded-full bg-[#0e1522] flex items-center justify-center overflow-hidden"
              style={{
                width: highlight ? 84 : 64,
                height: highlight ? 84 : 64,
                border: `2px solid ${tier.accent}`,
              }}
            >
              {entry.avatarUrl ? (
                <img src={entry.avatarUrl} alt={entry.displayName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-black text-[#9fef00]">
                  {(entry.displayName || 'U').charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            <p
              className="mt-3 font-bold text-[#eef2fb] truncate max-w-[170px]"
              title={entry.displayName}
            >
              {entry.displayName}
              {isMe && <span className="ms-1.5 text-[10px] font-black text-[#00a859] uppercase">•</span>}
            </p>

            <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-[#9aa5bf] max-w-[170px]">
              <GraduationCap size={11} className="flex-shrink-0" />
              <span className="truncate">
                {(() => {
                  const u = universityLabel(entry.university, lang);
                  return u.isSet && !u.isNotEnrolled ? u.text : '—';
                })()}
              </span>
            </p>

            <p className="mt-2 text-lg font-black" style={{ color: tier.accent }} dir="ltr">
              {entry.points.toLocaleString('en-US')}
              <span className="text-[11px] font-semibold text-[#9aa5bf] ms-1">
                {lang === 'ar' ? 'نقطة' : 'pts'}
              </span>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

/** Top-3 podium. `top` should be the leaderboard's first 1–3 entries, in order. */
const LeaderboardPodium: React.FC<{ top: PodiumEntry[]; currentUserId?: string }> = ({
  top,
  currentUserId,
}) => {
  if (top.length === 0) return null;
  const [first, second, third] = top;
  const isMe = (e?: PodiumEntry) => !!e && !!currentUserId && e.userId === currentUserId;

  return (
    <section className="overflow-visible">
      {/* Mobile shows 1 → 2 → 3; desktop reorders to 2 · 1 · 3 with #1 raised. */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-3 items-end max-w-3xl mx-auto">
        <div className="order-2 sm:order-1">
          {second && <PodiumCard entry={second} isMe={isMe(second)} />}
        </div>
        <div className="order-1 sm:order-2">
          {first && <PodiumCard entry={first} highlight isMe={isMe(first)} />}
        </div>
        <div className="order-3 sm:order-3">
          {third && <PodiumCard entry={third} isMe={isMe(third)} />}
        </div>
      </div>
    </section>
  );
};

export default LeaderboardPodium;
