import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Wifi, Check, PlayCircle } from 'lucide-react';
import EmptyState from '../../components/ui/EmptyState';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/EnhancedButton';
import ModuleCard from '../../components/fundamentals/ModuleCard';
import NetworkingLessonCard from '../../components/fundamentals/NetworkingLessonCard';
import AuthorChip, { CreditGroup } from '../../components/ui/AuthorChip';
import { useLang } from '../../contexts/LangContext';
import { getNetworkingPath, type NetworkingUnitStop } from '../../data/networking';
import { getFundamentalsByCategory } from '../../data/fundamentalsData';
import { useNetworkingDone } from '../../hooks/useCourseProgress';
import { creditOf } from '../../services/creatorTypes';
import type { NetworkingLesson } from '../../components/network-sim/types';

/* ── The lesson grid ──
 * One set of classes for every grid on the page. The dashed trail between
 * lessons is only drawn between neighbours in the same row, which index.css
 * (NETWORKING PATH TRAIL) works out from these same breakpoints: keep the two
 * in step (xs is 400px in tailwind.config.js; md and xl are Tailwind's own). */
const GRID = 'grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5';

const TRAIL_DONE = '#00a859';
const TRAIL_TODO = '#33415e';

/** A title short enough to sit in a button beside the summary. */
const shortTitle = (s: string, max = 42) => (s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s);

/** "3 units" in either language; Arabic has its own forms for one and two. */
const unitsLabel = (n: number, ar: boolean) =>
  ar ? (n === 1 ? 'مرحلة واحدة' : n === 2 ? 'مرحلتان' : `${n} مراحل`) : `${n} ${n === 1 ? 'unit' : 'units'}`;

const NetworkingPage: React.FC = () => {
  const { lang, t } = useLang();
  const navigate = useNavigate();
  const ar = lang === 'ar';
  const done = useNetworkingDone();

  // Static + published creator-authored lessons, arranged into the published units.
  const path = useMemo(() => getNetworkingPath(), []);
  // Standalone modules a creator filed under the Networking category.
  const categoryModules = getFundamentalsByCategory('networking');

  const total = path.ordered.length;
  const doneCount = path.ordered.filter((l) => done.has(l.id)).length;
  const next = path.ordered.find((l) => !done.has(l.id)) ?? null;

  const lessonsLabel = (n: number) => `${n} ${t(n === 1 ? 'card.lesson' : 'card.lessons')}`;
  const minutesLabel = (lessons: NetworkingLesson[]) =>
    `${lessons.reduce((sum, l) => sum + (Number(l.estimatedMinutes) || 0), 0)} ${ar ? 'دقيقة' : 'min'}`;

  /** A grid of lesson cards. Given a unit number, each card carries its place
   *  on the path in its corner and a trail leads on to the next one. */
  const lessonGrid = (lessons: NetworkingLesson[], unitNumber?: number) => (
    <div className={GRID}>
      {lessons.map((lesson, i) => (
        <div key={lesson.id} className="path-cell relative">
          <NetworkingLessonCard
            lesson={lesson}
            index={Math.min(i, 8)}
            position={unitNumber ? `${unitNumber}.${i + 1}` : undefined}
            done={done.has(lesson.id)}
            isNext={next?.id === lesson.id}
          />
          {unitNumber && (
            <span
              aria-hidden
              className="path-trail pointer-events-none absolute top-1/2 start-full w-4 sm:w-5 border-t-2 border-dashed"
              style={{ borderColor: done.has(lesson.id) ? TRAIL_DONE : TRAIL_TODO }}
            />
          )}
        </div>
      ))}
    </div>
  );

  const unitHeader = (stop: NetworkingUnitStop, number: number) => {
    const { unit, lessons } = stop;
    const finished = lessons.filter((l) => done.has(l.id)).length;
    const pct = Math.round((finished / lessons.length) * 100);
    const lessonCredits = lessons.map(creditOf);
    const arranger = creditOf(unit);
    // The unit's own author is credited separately only when they wrote none
    // of its lessons; otherwise they are already in the list.
    const arrangerWroteNone = !lessonCredits.some((c) =>
      c.id && arranger.id ? c.id === arranger.id : c.displayName === arranger.displayName
    );

    return (
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#60a5fa]">
            {ar ? `المرحلة ${number}` : `Unit ${number}`}
          </p>
          <h2 className="mt-0.5 text-lg font-bold leading-snug text-[#f3f6ff]">
            {unit.title[lang] || unit.title.en}
          </h2>
          {(unit.description[lang] || unit.description.en) && (
            <p className="mt-1 max-w-2xl text-sm text-[#9aa5bf]">
              {unit.description[lang] || unit.description.en}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-xs text-[#8592ad]">
            <span>{lessonsLabel(lessons.length)}</span>
            <span aria-hidden>·</span>
            <span>{minutesLabel(lessons)}</span>
            <span aria-hidden>·</span>
            <span className="inline-flex min-w-0 items-center gap-1.5">
              {ar ? 'بقلم' : 'by'}
              <CreditGroup credits={lessonCredits} lang={lang} linked className="text-[#aab3c7]" />
            </span>
            {arrangerWroteNone && (
              <>
                <span aria-hidden>·</span>
                <span className="inline-flex min-w-0 items-center gap-1.5">
                  {ar ? 'ترتيب' : 'arranged by'}
                  <AuthorChip credit={arranger} linked className="text-[#aab3c7]" />
                </span>
              </>
            )}
          </div>
        </div>

        <div className="w-full flex-shrink-0 sm:w-44">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className={finished === lessons.length ? 'font-bold text-[#00a859]' : 'text-[#8592ad]'}>
              {finished === lessons.length ? (ar ? 'مكتملة' : 'Complete') : ar ? 'التقدم' : 'Progress'}
            </span>
            <span className="font-semibold text-[#d2d7e3]" dir="ltr">
              {finished}/{lessons.length}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[#0a0f18]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#00a859] to-[#9fef00] transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <PageHeader
        backTo="/fundamentals"
        backLabel={t('sidebar.fundamentals')}
        icon={Wifi}
        iconColor="#60a5fa"
        title={ar ? 'الشبكات' : 'Networking'}
        subtitle={
          ar
            ? 'تعلم أساسيات الشبكات من خلال شروحات تفاعلية ومحاكاة مرئية.'
            : 'Learn networking fundamentals through interactive explanations and visual simulations.'
        }
      />

      {total === 0 ? (
        <EmptyState
          icon={Activity}
          title={ar ? 'قريبا' : 'Coming Soon'}
          description={
            ar ? 'دروس الشبكات قيد التطوير. عد قريبا!' : 'Networking lessons are being developed. Check back soon!'
          }
        />
      ) : (
        <>
          {/* ── Where you are, and the way on ── */}
          <div className="flex flex-col gap-3 rounded-2xl border border-[#263248] bg-[#121a2a] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[#9aa5bf]">
              {path.units.length > 0 && (
                <>
                  <span className="font-semibold text-[#f3f6ff]">{unitsLabel(path.units.length, ar)}</span>
                  <span className="mx-2 text-[#4d5a73]" aria-hidden>·</span>
                </>
              )}
              <span className="font-semibold text-[#f3f6ff]">{lessonsLabel(total)}</span>
              <span className="mx-2 text-[#4d5a73]" aria-hidden>·</span>
              <span className={doneCount > 0 ? 'text-[#00a859]' : ''}>
                {ar ? `أكملت ${doneCount}` : `${doneCount} done`}
              </span>
            </p>
            {next ? (
              <Button
                size="sm"
                onClick={() => navigate(`/fundamentals/networking/lesson/${next.slug}`)}
                leftIcon={<PlayCircle size={15} />}
              >
                {doneCount === 0 ? (ar ? 'ابدأ: ' : 'Start: ') : ar ? 'تابع: ' : 'Continue: '}
                {shortTitle(next.title[lang] || next.title.en)}
              </Button>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[#00a859]">
                <Check size={16} /> {ar ? 'أكملت كل دروس الشبكات' : 'Every networking lesson is done'}
              </span>
            )}
          </div>

          {/* ── The path: units down a dashed line, lessons along each ── */}
          {path.units.length > 0 && (
            <ol className="space-y-12">
              {path.units.map((stop, u) => {
                const complete = stop.lessons.every((l) => done.has(l.id));
                const holdsNext = !!next && stop.lessons.some((l) => l.id === next.id);
                const lastUnit = u === path.units.length - 1;
                return (
                  <li key={stop.unit.id} className="relative ps-12 sm:ps-14">
                    {/* The stretch of road down to the next unit */}
                    {!lastUnit && (
                      <span
                        aria-hidden
                        className="absolute start-[17px] top-10 -bottom-12 border-s-2 border-dashed"
                        style={{ borderColor: complete ? TRAIL_DONE : TRAIL_TODO }}
                      />
                    )}
                    <span
                      className={`absolute start-0 top-0 flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-black ${
                        complete
                          ? 'border-[#00a859] bg-[#00a859] text-[#0d1117]'
                          : holdsNext
                            ? 'border-[#00a859] bg-[#0d1117] text-[#00a859]'
                            : 'border-[#263248] bg-[#0d1117] text-[#8592ad]'
                      }`}
                    >
                      {/* No dir="ltr" here: on a positioned element it would turn
                          its own `start` into the left edge in Arabic too. */}
                      {complete ? <Check size={16} strokeWidth={3} /> : u + 1}
                    </span>

                    {unitHeader(stop, u + 1)}
                    {lessonGrid(stop.lessons, u + 1)}
                  </li>
                );
              })}
            </ol>
          )}

          {/* ── Lessons no unit lists yet. With no units at all this is simply
               the lesson list, exactly as it was before units existed. ── */}
          {path.loose.length > 0 && (
            <section>
              {path.units.length > 0 && (
                <div className="mb-4">
                  <h2 className="text-lg font-bold text-[#f3f6ff]">{ar ? 'دروس أخرى' : 'More lessons'}</h2>
                  <p className="mt-0.5 text-xs text-[#8592ad]">
                    {ar ? 'لم تُضف إلى مرحلة بعد.' : 'Not in a unit yet.'}
                  </p>
                </div>
              )}
              {lessonGrid(path.loose)}
            </section>
          )}
        </>
      )}

      {/* Standalone modules filed under Networking */}
      {categoryModules.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-[#f3f6ff] mb-4">{t('sidebar.modules')}</h2>
          <div className={GRID}>
            {categoryModules.map((mod, i) => (
              <ModuleCard key={mod.id} module={mod} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default NetworkingPage;
