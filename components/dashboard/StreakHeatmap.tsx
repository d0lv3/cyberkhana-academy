import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DAILY_ACTIVITY_GOAL, dayKeyOf, type StudyDays } from '../../backend/src/shared/streak';

/* ─── The month in squares ───
 *
 * A calendar month at a time, kept to the density a contribution grid reads
 * at while still leaving room for the date inside the square. A year of them
 * at once was a wall of specks: pretty from a distance, illegible up close.
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

/* ── The shades ──
 * An empty day is a solid tile, not a hole. A month is mostly empty when
 * somebody starts, and a grid that only exists where it is filled has no
 * shape to fill in: the squares you have not earned yet are the point.
 */

/** A day that happened and went unused. Light enough to read as a tile
 *  against the card behind it. */
const EMPTY = '#232d40';
/** A day that has not happened. Present, clearly not yet. */
const FUTURE = '#161d2a';

/** Four filled steps above empty. The first is deliberately dim: one
 *  activity is progress, but it is not a day that counted. */
const LEVELS = [EMPTY, '#1b6340', '#158a4e', '#00a859', '#9fef00'];

/** Which shade a count earns. The daily goal is where it becomes
 *  unmistakably "done", so that is where the bright greens start. */
function levelFor(count: number): number {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count < DAILY_ACTIVITY_GOAL) return 2;
  if (count <= 5) return 3;
  return 4;
}

/** A date that stays readable on its own tile: dark on the two brightest
 *  greens, light on the deep ones, and barely there on an unused day. */
function dateColor(level: number, isFuture: boolean): string {
  if (isFuture) return '#2b3549';
  if (level >= 3) return '#06210e';
  if (level >= 1) return '#dbffe9';
  return '#55637f';
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
    /* Capped, because the cells are square and a seven-column grid given a
       whole wide card turns into 90px tiles that swallow everything else on
       it. At this width they land near 31px, which is the density a
       contribution grid reads at while still leaving room for the date. */
    <div className="max-w-[15rem]">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="min-w-0 truncate text-sm font-bold text-[#f3f6ff]">
          {MONTHS[lang][view.month]} <span dir="ltr">{view.year}</span>
        </p>

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

      <div className="grid grid-cols-7 gap-1">
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
            className="flex aspect-square items-center justify-center rounded-[6px] text-[10px] font-semibold tabular-nums transition-colors"
            style={{
              backgroundColor: cell.isFuture ? FUTURE : LEVELS[levelFor(cell.count)],
              /* Drawn inside the tile rather than as a border, so marking
                 today cannot nudge the grid by a pixel. */
              boxShadow: cell.isToday ? 'inset 0 0 0 1.5px #f3a43a' : undefined,
              color: dateColor(levelFor(cell.count), cell.isFuture),
            }}
          >
            <span dir="ltr">{cell.day}</span>
          </div>
        ))}
      </div>

      {/* What the month came to, and what the shading means, under the grid
          where a caption belongs rather than competing with the month. */}
      <div className="mt-3.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="text-[11px] text-[#7c8aa6]">{activeDaysLabel(ar, view.active)}</p>
        <div className="flex items-center gap-1" dir="ltr">
          <span className="me-0.5 text-[9px] text-[#4a5773]">{ar ? 'أقل' : 'Less'}</span>
          {LEVELS.map((c) => (
            <span key={c} className="h-2.5 w-2.5 rounded-[3px]" style={{ backgroundColor: c }} />
          ))}
          <span className="ms-0.5 text-[9px] text-[#4a5773]">{ar ? 'أكثر' : 'More'}</span>
        </div>
      </div>
    </div>
  );
};

export default StreakHeatmap;
