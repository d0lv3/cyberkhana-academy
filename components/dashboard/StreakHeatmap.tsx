import React, { useMemo } from 'react';
import { dayKeyOf, shiftDay, type StudyDays } from '../../backend/src/shared/streak';

/* ─── The year in squares ───
 *
 * One cell a day, weeks running left to right, weekdays down. Shaded in five
 * steps by how many activities landed, so a heavy day reads darker than a bare
 * one and a gap in the wall is visible at a glance.
 *
 * It is drawn left to right in both languages. The grid is a calendar, not
 * prose: Arabic dates and charts run the same way round as English ones, and
 * mirroring it would put January on the right and confuse anyone who has ever
 * seen one of these before.
 */

const WEEKDAYS: Record<'en' | 'ar', string[]> = {
  en: ['Mon', 'Wed', 'Fri'],
  ar: ['ن', 'ر', 'ج'],
};

const MONTHS: Record<'en' | 'ar', string[]> = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  ar: ['ينا', 'فبر', 'مار', 'أبر', 'ماي', 'يون', 'يول', 'أغس', 'سبت', 'أكت', 'نوف', 'ديس'],
};

/** Four filled steps plus the empty one. The first is deliberately faint: a
 *  day with one activity is progress, but it is not a day that counted. */
const LEVELS = ['#0d1420', '#124a30', '#11703f', '#00a859', '#9fef00'];

/** Which shade a day's count earns. Three is the daily goal, so that is where
 *  the colour becomes unmistakably "done". */
function levelFor(count: number): number {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count <= 5) return 3;
  return 4;
}

interface StreakHeatmapProps {
  days: StudyDays;
  lang: 'en' | 'ar';
  /** How many weeks to draw. A year is 53; the card shows fewer on a phone. */
  weeks: number;
}

const StreakHeatmap: React.FC<StreakHeatmapProps> = ({ days, lang, weeks }) => {
  const columns = useMemo(() => {
    const today = dayKeyOf(new Date());
    /* Finish on the Sunday of this week so the last column is a whole one,
       then step back `weeks` Mondays to find the start. */
    const jsDay = new Date().getDay(); // 0 Sun … 6 Sat
    const toSunday = (7 - jsDay) % 7;
    const lastSunday = shiftDay(today, toSunday);
    const firstMonday = shiftDay(lastSunday, -(weeks * 7 - 1));

    const cols: { key: string; count: number; isToday: boolean; isFuture: boolean }[][] = [];
    for (let w = 0; w < weeks; w++) {
      const col: (typeof cols)[number] = [];
      for (let d = 0; d < 7; d++) {
        const key = shiftDay(firstMonday, w * 7 + d);
        col.push({
          key,
          count: days[key] ?? 0,
          isToday: key === today,
          isFuture: key > today,
        });
      }
      cols.push(col);
    }
    return cols;
  }, [days, weeks]);

  /* A month label sits above the first column that starts a new month. */
  const monthLabels = useMemo(
    () =>
      columns.map((col, i) => {
        const month = Number(col[0].key.slice(5, 7)) - 1;
        const prev = i > 0 ? Number(columns[i - 1][0].key.slice(5, 7)) - 1 : -1;
        return month !== prev ? MONTHS[lang][month] : '';
      }),
    [columns, lang]
  );

  return (
    <div dir="ltr" className="flex gap-1.5">
      {/* Weekday labels, on the rows GitHub labels: Mon, Wed, Fri. */}
      <div className="flex flex-col justify-between pb-[2px] pt-[15px] text-[8px] leading-none text-[#4a5773]">
        {WEEKDAYS[lang].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      <div className="min-w-0 flex-1 overflow-x-auto">
        <div className="inline-flex flex-col gap-1">
          <div className="flex gap-[3px]">
            {monthLabels.map((label, i) => (
              <span
                key={i}
                className="w-[11px] text-[8px] leading-none text-[#4a5773]"
                style={{ minWidth: 11 }}
              >
                {label}
              </span>
            ))}
          </div>

          <div className="flex gap-[3px]">
            {columns.map((col, w) => (
              <div key={w} className="flex flex-col gap-[3px]">
                {col.map((cell) => (
                  <span
                    key={cell.key}
                    title={`${cell.key}: ${cell.count}`}
                    className="h-[11px] w-[11px] rounded-[2px]"
                    style={{
                      backgroundColor: cell.isFuture ? 'transparent' : LEVELS[levelFor(cell.count)],
                      border: cell.isFuture
                        ? '1px solid transparent'
                        : cell.isToday
                        ? '1px solid #f3a43a'
                        : '1px solid rgba(255,255,255,0.04)',
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StreakHeatmap;
