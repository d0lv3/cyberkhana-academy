import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, ListChecks, ChevronRight } from 'lucide-react';
import CardArt from '../fundamentals/CardArt';
import DifficultyBadge from '../ui/DifficultyBadge';
import { useLang } from '../../contexts/LangContext';
import { getPathProgress, isPathEnrolled } from '../../services/progressService';
import type { CreatorPath } from '../../services/creatorTypes';

/**
 * Learning-path tile — same cover-art + scrim + badge style as the Module /
 * Networking / Programming cards, but kept at the wider 2-up size paths use.
 * The cover is a generated "roadmap" scene tinted to the path's color.
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
      className="group relative overflow-hidden rounded-2xl border border-[#263248] bg-[#121a2a] text-start transition-all duration-200 hover:-translate-y-1 hover:border-[#354562] hover:shadow-lg hover:shadow-black/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
    >
      <CardArt
        kind="path"
        color={p.color}
        className="transition-transform duration-500 group-hover:scale-[1.04]"
      />

      {/* Readability scrims */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#080c14] via-[#080c14]/65 to-transparent" />
      <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-[#080c14]/70 to-transparent" />

      <div className="relative flex min-h-[190px] flex-col p-5">
        {/* Top badges */}
        <div className="flex items-start justify-between gap-2">
          <DifficultyBadge difficulty={p.difficulty} className="backdrop-blur-sm" />
          {enrolled && (
            <span className="inline-flex items-center rounded-md border border-[#00a859]/30 bg-[#00a859]/15 px-2 py-0.5 text-xs font-semibold text-[#7ef0b0] backdrop-blur-sm">
              {t('paths.enrolled')}
            </span>
          )}
        </div>

        {/* Bottom block */}
        <div className="mt-auto pt-8">
          <h3 className="line-clamp-1 text-lg font-bold text-[#f3f6ff] transition-colors group-hover:text-[var(--c)]">
            {p.title[lang] || p.title.en}
          </h3>
          <p className="mt-1.5 line-clamp-2 text-sm text-[#aab3c7]">
            {p.description[lang] || p.description.en}
          </p>

          {enrolled && (
            <div className="mt-3">
              <div className="h-1.5 overflow-hidden rounded-full bg-[#0a0f18]" dir="ltr">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#00a859] to-[#9fef00] transition-all duration-700"
                  style={{ width: `${progress.pct}%` }}
                />
              </div>
              <p className="mt-1 text-[10px] text-[#9aa5bf]" dir="ltr">
                {progress.completed}/{progress.total} · {progress.pct}%
              </p>
            </div>
          )}

          <div className="mt-4 flex items-center gap-4 text-[11px] font-medium text-[#aab3c7]" dir="ltr">
            <span className="inline-flex items-center gap-1">
              <ListChecks size={12} /> {p.steps.length}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock size={12} /> {p.estimatedHours}h
            </span>
            <ChevronRight
              size={16}
              className="rtl-flip ml-auto text-[#6e7a94] transition-colors group-hover:text-[#f3f6ff]"
            />
          </div>
        </div>
      </div>
    </motion.button>
  );
};

export default PathCard;
