import React from 'react';
import { TAG_COLORS, type MemberTag } from '../../backend/src/shared/tags';

/* ─── Member tags ───
 *
 * The labels an admin has put on an account, as they appear on a profile.
 *
 * A tag carries the name of a colour rather than a colour, so the palette
 * lives in one place and a tag cannot be given one that disappears against the
 * card behind it. See backend/src/shared/tags.ts, which both halves read.
 *
 * `dir="auto"` on every label: an admin writes these, in either language, and
 * an Arabic tag on an English profile should still read the way it was typed.
 */

interface MemberTagsProps {
  tags?: MemberTag[] | null;
  className?: string;
  /** Smaller chips, for a dense row like the members list. */
  size?: 'sm' | 'md';
}

const MemberTags: React.FC<MemberTagsProps> = ({ tags, className = '', size = 'md' }) => {
  if (!tags?.length) return null;
  const pad = size === 'sm' ? 'px-1.5 py-px text-[10px]' : 'px-2 py-0.5 text-[11px]';

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {tags.map((tag) => {
        const c = TAG_COLORS[tag.color] ?? TAG_COLORS.green;
        return (
          <span
            key={`${tag.color}:${tag.label}`}
            dir="auto"
            className={`inline-flex max-w-full items-center rounded-md border font-semibold ${pad}`}
            style={{ color: c.fg, backgroundColor: c.bg, borderColor: c.border }}
          >
            <span className="truncate">{tag.label}</span>
          </span>
        );
      })}
    </div>
  );
};

export default MemberTags;
