import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DAILY_ACTIVITY_GOAL, dayKeyOf, type StudyDays } from '../../backend/src/shared/streak';

/* ─── The month in squares ───
 *
 * A calendar month at a time, big enough to read the date in the square and
 * to tap one on a phone. A year of them at once was a wall of specks: the
 * shape of it was pretty and nothing in it was legible.
 *
 * It opens on this month and steps back through the record. Forward stops at
 * the current month, because there is nothing to show in a month that has not
 * happened, and back stops at what the server keeps, which is 400 days.
 *
 * Unlike a contribution graph, a calendar is a layout Arabic has its own
 * version of, so this one follows the page: in Arabic the week starts on the
 * right and the arrows swap over with it.
 */

const MONTHS: Record<'en' | 'ar', string[]> = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
};

/** Monday-first, matching the week pips above it. */
const WEEKDAYS: Record<'en' | 'ar', string[]> = {
  en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  ar: ['ن', 'ث', 'ر', 'خ', 'ج', 'س', 'ح'],
};

/** Four filled steps plus the empty one. The first is deliberately faint: a
 *  day with one activity is progress, but it is not a day that counted. */
const LEVELS = ['#0d1420', '#124a30', '#11703f', '#00a859', '#9fef00'];

/** Which shade a count earns. The daily goal is where it becomes
 *  unmistakably "done", so that is where the bright greens start. */
function levelFor(count: number): number {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count < DAILY_ACTIVITY_GOAL) return 2;
  if (count <= 5) return 3;
  return 4;
}

/** How far back the record goes, as a count of whole months. */
const MONTHS_BACK = 13;

/** "13 active days", agreeing with Arabic's number rules: one, two, a few
 *  (3 to 10) and eleven upward each take a different form. */
function activeDaysLabel(ar: boolean, n: number): string {
  if (!ar) return `${n} active ${n === 1 ? 'day' : 'days'}`;
  if (n === 1) return 'يوم نشط واحد';
  if (n === 2) return 'يومان نشطان';
  if (n <= 10) return `${n} أيام نشطة`;
  return `${n} يوما نشطا`;
}

interface StreakHeatmapProps {
  days: StudyDays;
  lang: 'en' | 'ar';
}

const StreakHeatmap: React.FC<StreakHeatmapProps> = ({ days, lang }) => {
  const ar = lang === 'ar';
  /** Months back from the current one; 0 is this month. */
  const [back, setBack] = useState(0);

  const view = useMemo(() => {
    const now = new Date();
    const anchor = new Date(now.getFullYear(), now.getMonth() - back, 1);
    const year = anchor.getFullYear();
    const month = anchor.getMonth();
    const todayKey = dayKeyOf(now);

    /* Blanks before the 1st so the month starts on its real weekday. */
    const leading = (anchor.getDay() + 6) % 7;
    /* Day 0 of the next month is the last day of this one. */
    const length = new Date(year, month + 1, 0).getDate();

    const cells: { key: string; day: number; count: number; isToday: boolean; isFuture: boolean }[] = [];
    for (let d = 1; d <= length; d++) {
      const key = dayKeyOf(new Date(year, month, d));
      cells.push({
        key,
        day: d,
        count: days[key] ?? 0,
        isToday: key === todayKey,
        isFuture: key > todayKey,
      });
    }

    const active = cells.filter((c) => c.count >= DAILY_ACTIVITY_GOAL).length;
    return { year, month, leading, cells, active };
  }, [days, back]);

  const PrevIcon = ar ? ChevronRight : ChevronLeft;
  const NextIcon = ar ? ChevronLeft : ChevronRight;

  const navButton =
    'flex h-7 w-7 items-center justify-center rounded-lg border border-[#263248] bg-[#0d1420] text-[#9aa5bf] transition-colors hover:border-[#00a859]/40 hover:text-[#00a859] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-[#263248] disabled:hover:text-[#9aa5bf]';

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-[#f3f6ff]">
            {MONTHS[lang][view.month]} <span dir="ltr">{view.year}</span>
          </p>
          <p className="mt-0.5 text-[11px] text-[#7c8aa6]">
            {activeDaysLabel(ar, view.active)}
          </p>
        </div>

        <div className="flex flex-shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => setBack((b) => Math.min(MONTHS_BACK, b + 1))}
            disabled={back >= MONTHS_BACK}
            aria-label={ar ? 'الشهر السابق' : 'Previous month'}
            className={navButton}
          >
            <PrevIcon size={15} />
          </button>
          <button
            type="button"
            onClick={() => setBack((b) => Math.max(0, b - 1))}
            disabled={back === 0}
            aria-label={ar ? 'الشهر التالي' : 'Next month'}
            className={navButton}
          >
            <NextIcon size={15} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
        {WEEKDAYS[lang].map((d, i) => (
          <div
            key={i}
            className="pb-0.5 text-center text-[9px] font-bold uppercase tracking-wider text-[#4a5773]"
          >
            {d}
          </div>
        ))}

        {Array.from({ length: view.leading }, (_, i) => (
          <div key={`blank-${i}`} />
        ))}

        {view.cells.map((cell) => (
          <div
            key={cell.key}
            title={
              ar
                ? `${cell.key}: ${cell.count} نشاط`
                : `${cell.key}: ${cell.count} ${cell.count === 1 ? 'activity' : 'activities'}`
            }
            className="flex aspect-square items-center justify-center rounded-md text-[11px] font-bold tabular-nums transition-colors sm:rounded-lg sm:text-xs"
            style={{
              backgroundColor: cell.isFuture ? 'transparent' : LEVELS[levelFor(cell.count)],
              border: cell.isToday
                ? '1.5px solid #f3a43a'
                : cell.isFuture
                ? '1px solid #161f31'
                : '1px solid rgba(255,255,255,0.05)',
              /* A dark number on the two brightest greens, a light one on the
                 rest, so the date stays readable at every shade. */
              color: cell.isFuture
                ? '#2b364d'
                : levelFor(cell.count) >= 3
                ? '#07230f'
                : cell.count > 0
                ? '#d6ffe6'
                : '#3f4c67',
            }}
          >
            <span dir="ltr">{cell.day}</span>
          </div>
        ))}
      </div>

      {/* Legend, so the shading means something without hovering. */}
      <div className="mt-3 flex items-center justify-end gap-1.5" dir="ltr">
        <span className="text-[9px] text-[#4a5773]">{ar ? 'أقل' : 'Less'}</span>
        {LEVELS.map((c) => (
          <span
            key={c}
            className="h-2.5 w-2.5 rounded-[3px]"
            style={{ backgroundColor: c, border: '1px solid rgba(255,255,255,0.05)' }}
          />
        ))}
        <span className="text-[9px] text-[#4a5773]">{ar ? 'أكثر' : 'More'}</span>
      </div>
    </div>
  );
};

export default StreakHeatmap;
