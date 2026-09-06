import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, ListChecks } from 'lucide-react';
import CardArt from '../fundamentals/CardArt';
import DifficultyBadge from '../ui/DifficultyBadge';
import { useLang } from '../../contexts/LangContext';
import { coverImageSrc } from '../../data/fundamentalsData';
import { getPathProgress, isPathEnrolled } from '../../services/progressService';
import type { CreatorPath } from '../../services/creatorTypes';

/**
 * Learning-path tile. Shares the full-bleed cover-image look of the canonical
 * ModuleCard (cover / scrims / bottom title + meta) so paths sit consistently
 * beside modules — but sized for the wider 2-up paths grid and carrying path
 * specifics: step count and an enrolment progress bar. Falls back to the
 * generated roadmap art when no cover is uploaded.
 */
const PathCard: React.FC<{ path: CreatorPath; index?: number }> = ({ path: p, index = 0 }) => {
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const enrolled = isPathEnrolled(p.id);
  const progress = getPathProgress(p.steps);

  const open = () => navigate(`/paths/${p.slug}`);

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.06 + index * 0.05, duration: 0.4 }}
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open();
        }
      }}
      className="group relative min-h-[200px] w-full cursor-pointer overflow-hidden rounded-2xl border border-[#263248] bg-[#121a2a] transition-all duration-200 hover:-translate-y-1 hover:border-[#00a859]/50 hover:shadow-lg hover:shadow-black/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00a859]/50"
    >
      {/* Cover image, or the generated roadmap art as a fallback */}
      {p.coverImage ? (
        <img
          src={coverImageSrc(p.coverImage)}
          alt={p.title[lang] || p.title.en}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
      ) : (
        <CardArt kind="path" color={p.color} className="transition-transform duration-500 group-hover:scale-[1.04]" />
      )}

      {/* Readability scrims — darken top (badges) and bottom (title) over any image */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#080c14] via-[#080c14]/55 to-transparent" />
      <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-[#080c14]/70 to-transparent" />

      {/* Top: enrolled pill */}
      <div className="absolute inset-x-0 top-0 flex items-start justify-end gap-2 p-3">
        {enrolled && (
          <span className="inline-flex items-center rounded-md border border-[#00a859]/30 bg-[#00a859]/15 px-2 py-0.5 text-xs font-semibold text-[#7ef0b0] backdrop-blur-sm">
            {t('paths.enrolled')}
          </span>
        )}
      </div>

      {/* Bottom: title + progress + meta */}
      <div className="absolute inset-x-0 bottom-0 p-4">
        <h3 className="mb-2 line-clamp-1 text-base font-bold text-[#f3f6ff] transition-colors group-hover:text-[#00a859]">
          {p.title[lang] || p.title.en}
        </h3>

        {enrolled && progress.total > 0 && (
          <div className="mb-2.5" dir="ltr">
            <div className="h-1.5 overflow-hidden rounded-full bg-[#0a0f18]/80">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#00a859] to-[#9fef00] transition-all duration-700"
                style={{ width: `${progress.pct}%` }}
              />
            </div>
            <p className="mt-1 text-[10px] font-medium text-[#9aa5bf]">
              {progress.completed}/{progress.total} · {progress.pct}%
            </p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-[#aab3c7]" dir="ltr">
          <DifficultyBadge difficulty={p.difficulty} className="backdrop-blur-sm" />
          <span className="inline-flex items-center gap-1">
            <ListChecks size={11} /> {progress.total} {t('paths.stepsLabel')}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock size={11} /> {p.estimatedHours}h
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default PathCard;
