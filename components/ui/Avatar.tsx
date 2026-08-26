import React, { useState } from 'react';
import CyberAvatar, { presetFor } from './CyberAvatar';

interface AvatarProps {
  /** Google photo URL, `avatar:<id>`, or nothing. */
  avatarUrl?: string | null;
  /** Falls back to this name's first letter when there is no picture. */
  name?: string | null;
  /** Tailwind sizing/rounding for the frame, e.g. "w-10 h-10 rounded-lg". */
  className?: string;
  /** Font size for the initial fallback, e.g. "text-3xl". */
  initialClassName?: string;
}

/**
 * The one place that decides what a member's picture is. Three sources, in
 * order: a built-in preset, a photo URL, then the first letter of their name.
 *
 * A remote photo that fails to load falls through to the initial rather than
 * leaving a broken-image frame — Google photo URLs do rot once an account is
 * closed, and a leaderboard full of broken icons is worse than plain letters.
 */
const Avatar: React.FC<AvatarProps> = ({
  avatarUrl,
  name,
  className = 'w-10 h-10 rounded-lg',
  initialClassName = 'text-base',
}) => {
  const [failed, setFailed] = useState(false);
  const preset = presetFor(avatarUrl);
  const frame = `${className} overflow-hidden border border-[#263248] flex-shrink-0`;

  if (preset) {
    return (
      <div className={frame}>
        <CyberAvatar preset={preset} className="w-full h-full" title={name ?? undefined} />
      </div>
    );
  }

  if (avatarUrl && !failed) {
    return (
      <img
        src={avatarUrl}
        alt={name ?? ''}
        onError={() => setFailed(true)}
        className={`${frame} object-cover`}
      />
    );
  }

  return (
    <div className={`${frame} bg-[#0e1522] flex items-center justify-center`}>
      <span className={`${initialClassName} font-black text-[#9fef00]`}>
        {(name || 'U').charAt(0).toUpperCase()}
      </span>
    </div>
  );
};

export default Avatar;
