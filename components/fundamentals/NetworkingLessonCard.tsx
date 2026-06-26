import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Activity } from 'lucide-react';
import CardArt from './CardArt';
import { useLang } from '../../contexts/LangContext';
import type { NetworkingLesson } from '../network-sim/types';

const ACCENT = '#60a5fa';

/**
 * Square Networking-lesson tile — mirrors ModuleCard, but the cover is a
 * generated node-mesh SVG (or the creator's uploaded SVG) instead of a photo.
 */
const NetworkingLessonCard: React.FC<{ lesson: NetworkingLesson; index?: number }> = ({
  lesson,
  index = 0,
}) => {
  const { lang } = useLang();
  const navigate = useNavigate();
  const open = () => navigate(`/fundamentals/networking/lesson/${lesson.slug}`);

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
      className="group relative aspect-square w-full cursor-pointer overflow-hidden rounded-2xl border border-[#263248] bg-[#121a2a] transition-all duration-200 hover:-translate-y-1 hover:border-[#60a5fa]/50 hover:shadow-lg hover:shadow-black/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#60a5fa]/50"
    >
      <CardArt
        kind="network"
        color={ACCENT}
        svg={lesson.coverSvg}
        className="transition-transform duration-500 group-hover:scale-[1.04]"
      />

      {/* Readability scrims */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#080c14] via-[#080c14]/55 to-transparent" />
      <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-[#080c14]/70 to-transparent" />

      {/* Top badges */}
      <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
        <span className="inline-flex items-center rounded-md border border-[#60a5fa]/30 bg-[#60a5fa]/15 px-2 py-0.5 text-xs font-semibold text-[#bcd6ff] backdrop-blur-sm">
          {lang === 'ar' ? 'تفاعلي' : 'Interactive'}
        </span>
        <span className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-black/45 px-2 py-0.5 text-xs font-semibold text-[#e5e9f0] backdrop-blur-sm" dir="ltr">
          <Activity size={12} /> {lesson.simulation.steps.length}
        </span>
      </div>

      {/* Bottom: title + stats */}
      <div className="absolute inset-x-0 bottom-0 p-4">
        <h3 className="mb-2 line-clamp-2 text-base font-bold leading-snug text-[#f3f6ff] transition-colors group-hover:text-[#60a5fa]">
          {lesson.title[lang]}
        </h3>
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium text-[#aab3c7]" dir="ltr">
          <span className="inline-flex items-center gap-1">
            <Clock size={11} /> {lesson.estimatedMinutes} min
          </span>
          <span className="inline-flex items-center gap-1">
            <Activity size={11} /> {lesson.simulation.steps.length} steps
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default NetworkingLessonCard;
