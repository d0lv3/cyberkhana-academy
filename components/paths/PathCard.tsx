import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, ListChecks, ChevronRight, Flag, Trophy, Route, User } from 'lucide-react';
import CardArt from '../fundamentals/CardArt';
import DifficultyBadge from '../ui/DifficultyBadge';
import { useLang } from '../../contexts/LangContext';
import { getPathProgress, isPathEnrolled } from '../../services/progressService';
import { authorOf, type CreatorPath } from '../../services/creatorTypes';

const MAX_DOTS = 7;

/**
 * Connected-waypoint trail. Draws the path's steps as a chain of milestones
 * between a start flag and a summit trophy — a compact "journey" graphic that,
 * once the student is enrolled, doubles as a progress bar (filled waypoints =
 * completed, the ringed one = up next). Long paths collapse to "+N".
 */
const WaypointTrail: React.FC<{
  total: number;
  completed: number;
  enrolled: boolean;
  color: string;
}> = ({ total, completed, enrolled, color }) => {
  const shown = Math.min(total, MAX_DOTS);
  const overflow = total - shown;
  const done = enrolled && completed >= total && total > 0;

  return (
    <div className="flex items-center" dir="ltr" aria-hidden>
      <Flag size={12} className="flex-shrink-0" style={{ color }} />
      {Array.from({ length: shown }).map((_, i) => {
        const isDone = i < completed;
        const isCurrent = enrolled && i === completed && i < total;
        const enterActive = i < completed || (enrolled && i === completed);
        return (
          <React.Fragment key={i}>
            <span
              className="h-px flex-1 min-w-[6px] transition-colors duration-500"
              style={{ background: enterActive ? color : '#26324a' }}
            />
            <span
              className="grid flex-shrink-0 place-items-center rounded-full transition-all duration-300"
              style={{
                width: isCurrent ? 12 : 9,
                height: isCurrent ? 12 : 9,
                background: isDone ? color : '#0a0f18',
                border: `2px solid ${isDone || isCurrent ? color : '#2a3650'}`,
                boxShadow: isCurrent ? `0 0 0 3px ${color}33` : undefined,
              }}
            />
          </React.Fragment>
        );
      })}
      <span
        className="h-px flex-1 min-w-[6px] transition-colors duration-500"
        style={{ background: completed >= shown && completed > 0 ? color : '#26324a' }}
      />
      {overflow > 0 ? (
        <span className="flex-shrink-0 pl-0.5 text-[10px] font-bold text-[#6e7a94]">+{overflow}</span>
      ) : (
        <Trophy size={12} className="flex-shrink-0" style={{ color: done ? color : '#4d5a73' }} />
      )}
    </div>
  );
};

/**
 * Learning-path tile — a "journey" card. A cover band up top (the creator's
 * uploaded image / SVG, or a generated roadmap tinted to the path's color),
 * then the step trail and meta below. Distinct from the square module tiles so
 * paths read as guided tracks rather than single lessons.
 */
const PathCard: React.FC<{ path: CreatorPath; index?: number }> = ({ path: p, index = 0 }) => {
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const enrolled = isPathEnrolled(p.id);
  const progress = getPathProgress(p.steps);

  return (
    <motion.button
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 + index * 0.07, duration: 0.4 }}
      onClick={() => navigate(`/paths/${p.slug}`)}
      style={{ ['--c' as string]: p.color }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-[#263248] bg-[#121a2a] text-start transition-all duration-200 hover:-translate-y-1 hover:border-[#354562] hover:shadow-lg hover:shadow-black/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
    >
      {/* ── Cover band ── */}
      <div className="relative h-40 overflow-hidden">
        <CardArt
          kind="path"
          color={p.color}
          svg={p.coverImage}
          className="transition-transform duration-500 group-hover:scale-[1.05]"
        />

        {/* Readability scrims — fade into the card body + darken the top for badges */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#121a2a] via-[#121a2a]/45 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-black/45 to-transparent" />

        {/* Top badges */}
        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-4">
          <span
            className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider backdrop-blur-sm"
            style={{ color: p.color, backgroundColor: `${p.color}1f`, borderColor: `${p.color}55` }}
          >
            <Route size={11} /> {t('sidebar.paths')}
          </span>
          <div className="flex items-center gap-2">
            {enrolled && (
              <span className="inline-flex items-center rounded-md border border-[#00a859]/30 bg-[#00a859]/15 px-2 py-0.5 text-[11px] font-semibold text-[#7ef0b0] backdrop-blur-sm">
                {t('paths.enrolled')}
              </span>
            )}
            <DifficultyBadge difficulty={p.difficulty} className="backdrop-blur-sm" />
          </div>
        </div>

        {/* Title over the cover */}
        <div className="absolute inset-x-0 bottom-0 p-4">
          <h3 className="line-clamp-1 text-lg font-bold text-[#f7f9ff] transition-colors group-hover:text-[var(--c)]">
            {p.title[lang] || p.title.en}
          </h3>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 flex-col gap-3 p-4 pt-3.5">
        <p className="line-clamp-2 min-h-[2.5rem] text-sm text-[#9aa5bf]">
          {p.description[lang] || p.description.en}
        </p>

        {/* Step trail */}
        <div>
          <WaypointTrail total={progress.total} completed={progress.completed} enrolled={enrolled} color={p.color} />
          {enrolled && progress.total > 0 && (
            <p className="mt-2 text-[10px] font-medium text-[#9aa5bf]" dir="ltr">
              {progress.completed}/{progress.total} · {progress.pct}%
            </p>
          )}
        </div>

        {/* Meta */}
        <div className="mt-auto flex items-center gap-3 pt-1 text-[11px] font-medium text-[#aab3c7]" dir="ltr">
          <span className="inline-flex items-center gap-1">
            <ListChecks size={12} /> {progress.total}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock size={12} /> {p.estimatedHours}h
          </span>
          <span className="inline-flex min-w-0 items-center gap-1 text-[#6e7a94]">
            <User size={11} className="flex-shrink-0" />
            <span className="truncate">{authorOf(p)}</span>
          </span>
          <ChevronRight
            size={16}
            className="rtl-flip ml-auto flex-shrink-0 text-[#6e7a94] transition-colors group-hover:text-[#f3f6ff]"
          />
        </div>
      </div>
    </motion.button>
  );
};

export default PathCard;
