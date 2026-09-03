import React from 'react';
import { RATING_META } from './ratingScale';
import type { Rating } from '../../services/feedbackService';

interface RatingDistributionProps {
  /** Counts for ratings 1 to 5, in that order. */
  distribution: number[];
  /** Highlighted row, when the chart doubles as the filter. */
  active?: Rating | null;
  /** Makes the rows selectable. Clicking the active row clears the filter. */
  onSelect?: (rating: Rating | null) => void;
  /** Drops the row labels down a size for card-sized use. */
  compact?: boolean;
}

const ROWS: Rating[] = [5, 4, 3, 2, 1];

/**
 * The shape of the answers, five to one, top to bottom.
 *
 * Bars are measured against the busiest row rather than the total, so a track
 * where every score is a 4 still shows a readable spread instead of one full
 * bar and four empty ones.
 */
const RatingDistribution: React.FC<RatingDistributionProps> = ({
  distribution,
  active = null,
  onSelect,
  compact = false,
}) => {
  const peak = Math.max(1, ...distribution);
  const selectable = typeof onSelect === 'function';

  return (
    <div className={compact ? 'space-y-1.5' : 'space-y-2'} dir="ltr">
      {ROWS.map((rating) => {
        const count = distribution[rating - 1] ?? 0;
        const tone = RATING_META[rating].color;
        const isActive = active === rating;
        const dimmed = active !== null && !isActive;

        const row = (
          <>
            <span
              className={`w-3 flex-shrink-0 text-center font-mono font-bold ${
                compact ? 'text-[10px]' : 'text-[11px]'
              }`}
              style={{ color: count > 0 ? tone : '#4d5871' }}
            >
              {rating}
            </span>
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#1a2332]">
              <span
                className="block h-full rounded-full transition-all duration-300"
                style={{
                  width: `${(count / peak) * 100}%`,
                  backgroundColor: tone,
                  opacity: dimmed ? 0.35 : 1,
                }}
              />
            </span>
            <span
              className={`w-6 flex-shrink-0 text-right font-mono tabular-nums ${
                compact ? 'text-[10px]' : 'text-[11px]'
              } ${count > 0 ? 'text-[#9aa5bf]' : 'text-[#4d5871]'}`}
            >
              {count}
            </span>
          </>
        );

        return selectable ? (
          <button
            key={rating}
            type="button"
            onClick={() => onSelect!(isActive ? null : rating)}
            aria-pressed={isActive}
            className={`flex w-full items-center gap-2.5 rounded-md px-1.5 py-1 transition-colors ${
              isActive ? 'bg-[#1a2332]' : 'hover:bg-[#161f30]'
            }`}
          >
            {row}
          </button>
        ) : (
          <div key={rating} className="flex items-center gap-2.5 px-1.5">
            {row}
          </div>
        );
      })}
    </div>
  );
};

export default RatingDistribution;
