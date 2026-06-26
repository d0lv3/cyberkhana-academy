import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Layers, FileText, Video } from 'lucide-react';
import DifficultyBadge from '../ui/DifficultyBadge';
import { useLang } from '../../contexts/LangContext';
import { MODULE_DOMAIN_META, moduleDomain, type FundamentalModule } from '../../data/fundamentalsData';

const contentTypeIcons = {
  video: Video,
  text: FileText,
  mixed: Layers,
} as const;

const contentTypeLabels = {
  video: { en: 'Video', ar: 'فيديو' },
  text: { en: 'Text', ar: 'نصي' },
  mixed: { en: 'Mixed', ar: 'مختلط' },
} as const;

interface ModuleCardProps {
  module: FundamentalModule;
  index?: number;
}

/**
 * Canonical fundamental-module tile — a square cover-image card shared by every
 * Fundamentals pillar page and the Modules hub. Creators upload the cover image;
 * when absent it falls back to an accent-tinted gradient.
 */
const ModuleCard: React.FC<ModuleCardProps> = ({ module: mod, index = 0 }) => {
  const { lang } = useLang();
  const navigate = useNavigate();
  const ContentIcon = contentTypeIcons[mod.contentType];
  const domain = MODULE_DOMAIN_META[moduleDomain(mod)];

  const open = () => navigate(`/fundamentals/module/${mod.slug}`);

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
      className="group relative aspect-square w-full cursor-pointer overflow-hidden rounded-2xl border border-[#263248] bg-[#121a2a] transition-all duration-200 hover:-translate-y-1 hover:border-[#00a859]/50 hover:shadow-lg hover:shadow-black/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00a859]/50"
    >
      {/* Cover image / accent fallback */}
      {mod.coverImage ? (
        <img
          src={mod.coverImage}
          alt={mod.title[lang]}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(150deg, ${mod.iconColor}33 0%, #0d1117 62%)` }}
        >
          <Layers
            size={96}
            className="absolute -bottom-3 end-3 opacity-[0.08]"
            style={{ color: mod.iconColor }}
          />
        </div>
      )}

      {/* Readability scrims — darken top (badges) and bottom (title) over any image */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#080c14] via-[#080c14]/55 to-transparent" />
      <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-[#080c14]/70 to-transparent" />

      {/* Top: category (domain) tag + content-type badge */}
      <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
        <span
          className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold backdrop-blur-sm ${domain.badgeCls}`}
        >
          {domain.label[lang]}
        </span>
        <span className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-black/45 px-2 py-0.5 text-xs font-semibold text-[#e5e9f0] backdrop-blur-sm">
          <ContentIcon size={12} />
          {contentTypeLabels[mod.contentType][lang]}
        </span>
      </div>

      {/* Bottom: title + difficulty + compact stats */}
      <div className="absolute inset-x-0 bottom-0 p-4">
        <h3 className="mb-2 line-clamp-2 text-base font-bold leading-snug text-[#f3f6ff] transition-colors group-hover:text-[#00a859]">
          {mod.title[lang]}
        </h3>
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-[#aab3c7]" dir="ltr">
          <DifficultyBadge difficulty={mod.difficulty} className="backdrop-blur-sm" />
          <span className="inline-flex items-center gap-1">
            <Clock size={11} /> {mod.estimatedHours}h
          </span>
          <span className="inline-flex items-center gap-1">
            <Layers size={11} /> {mod.totalModules} {mod.totalModules === 1 ? 'section' : 'sections'}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default ModuleCard;
