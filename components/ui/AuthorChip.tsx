import React from 'react';
import { Link } from 'react-router-dom';
import Avatar from './Avatar';
import type { ContentCredit } from '../../services/creatorTypes';
import { profilePath } from '../../services/profiles';

/* ── Author credit, as it sits beside content ──
 *
 * One component for every place a lesson, module or unit says who made it, so
 * a creator looks the same on a card, in a unit header and on the lesson page.
 * The credit comes from creditOf(), which prefers the owning account the
 * server attached over any name saved on the item.
 */

interface AuthorChipProps {
  credit: ContentCredit;
  /** 'xs' sits on a card's bottom line; 'sm' belongs in headers. */
  size?: 'xs' | 'sm';
  /** Also show the @handle, where there is room for it. */
  showHandle?: boolean;
  /** Link to the author's public profile. Leave off inside something that is
   *  itself clickable, such as a card: a link inside a link cannot be used. */
  linked?: boolean;
  className?: string;
}

const AVATAR = {
  xs: { frame: 'w-4 h-4 rounded-full', initial: 'text-[8px]' },
  sm: { frame: 'w-6 h-6 rounded-full', initial: 'text-[10px]' },
} as const;

const AuthorChip: React.FC<AuthorChipProps> = ({
  credit,
  size = 'xs',
  showHandle = false,
  linked = false,
  className = '',
}) => {
  const body = (
    <>
      <Avatar
        avatarUrl={credit.avatarUrl}
        name={credit.displayName}
        className={AVATAR[size].frame}
        initialClassName={AVATAR[size].initial}
      />
      <span className="truncate">{credit.displayName}</span>
      {showHandle && credit.username && (
        <span className="truncate font-mono text-[#8592ad]" dir="ltr">
          @{credit.username}
        </span>
      )}
    </>
  );

  // Only a real account has a profile; built-in content credits CyberKhana.
  const to = linked && credit.id ? profilePath(credit) : null;
  return to ? (
    <Link
      to={to}
      className={`inline-flex min-w-0 items-center gap-1.5 rounded-md transition-colors hover:text-[#00a859] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00a859]/50 ${className}`}
    >
      {body}
    </Link>
  ) : (
    <span className={`inline-flex min-w-0 items-center gap-1.5 ${className}`}>{body}</span>
  );
};

/** The same credit for several people at once: overlapping pictures, then the
 *  names ("Sara and Omar", "Sara, Omar and 2 more"). Duplicates are expected
 *  in the input and collapse to one person. */
export const CreditGroup: React.FC<{
  credits: ContentCredit[];
  lang: 'en' | 'ar';
  /** Each name links to that person's profile (see AuthorChip's `linked`). */
  linked?: boolean;
  className?: string;
}> = ({ credits, lang, linked = false, className = '' }) => {
  const seen = new Set<string>();
  const people = credits.filter((c) => {
    const key = c.id ?? `name:${c.displayName}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  if (people.length === 0) return null;

  const name = (p: ContentCredit) => {
    const to = linked && p.id ? profilePath(p) : null;
    return to ? (
      <Link
        key={p.id}
        to={to}
        className="rounded transition-colors hover:text-[#00a859] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00a859]/50"
      >
        {p.displayName}
      </Link>
    ) : (
      <span key={p.id ?? p.displayName}>{p.displayName}</span>
    );
  };

  const and = lang === 'ar' ? 'و' : 'and';
  const names =
    people.length === 1 ? (
      name(people[0])
    ) : people.length === 2 ? (
      <>
        {name(people[0])} {and} {name(people[1])}
      </>
    ) : (
      <>
        {name(people[0])}
        {lang === 'ar' ? '، ' : ', '}
        {name(people[1])}{' '}
        {lang === 'ar' ? `و${people.length - 2} آخرين` : `and ${people.length - 2} more`}
      </>
    );

  return (
    <span className={`inline-flex min-w-0 items-center gap-1.5 ${className}`}>
      <span className="flex flex-shrink-0 -space-x-1.5 rtl:space-x-reverse">
        {people.slice(0, 3).map((p) => (
          <Avatar
            key={p.id ?? p.displayName}
            avatarUrl={p.avatarUrl}
            name={p.displayName}
            className="w-5 h-5 rounded-full ring-2 ring-[#0d1117]"
            initialClassName="text-[9px]"
          />
        ))}
      </span>
      <span className="truncate">{names}</span>
    </span>
  );
};

export default AuthorChip;
