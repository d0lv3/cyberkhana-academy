import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useLang } from '../../contexts/LangContext';
import type { JourneyTarget } from '../../services/journeyService';
import { TARGET_META } from './targetMeta';

/* ─── What to take up next ───
 *
 * Deliberately not the same thing as the card above it. "Continue" is the
 * lesson left open; this is the next piece of the plan: the step a path is
 * waiting on, a module left half finished, or the next stop in Fundamentals.
 * It is a suggestion with a reason, not a shuffle.
 */

const NextStepCard: React.FC<{ target: JourneyTarget }> = ({ target }) => {
  const { lang } = useLang();
  const navigate = useNavigate();
  const ar = lang === 'ar';
  const meta = TARGET_META[target.kind];
  const Icon = meta.icon;

  return (
    <motion.section
      data-tour-id="dashboard-next"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.16, duration: 0.4 }}
    >
      <button
        onClick={() => navigate(target.route)}
        className="group flex w-full items-center gap-4 rounded-2xl border border-[#263248] bg-[#121a2a] p-4 text-start transition-all hover:border-[#00a859]/40 hover:bg-[#141d2e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00a859]/50 sm:p-5"
      >
        <span
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${meta.color}15`, border: `1px solid ${meta.color}30` }}
        >
          <Icon size={18} style={{ color: meta.color }} />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-[#8592ad]">
            {ar ? 'الخطوة المقترحة' : 'Recommended next'}
          </span>
          <span className="mt-0.5 block truncate text-base font-bold text-[#f3f6ff]">
            {target.title[lang] || target.title.en}
          </span>
          <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[#8592ad]">
            <span className="truncate">{target.context?.[lang] || meta.label[lang]}</span>
            {target.progress && target.progress.total > 0 && (
              <>
                <span aria-hidden className="text-[#4d5a73]">
                  ·
                </span>
                <span dir="ltr">
                  {target.progress.done}/{target.progress.total}
                </span>
              </>
            )}
          </span>
        </span>

        <span className="flex flex-shrink-0 items-center gap-1 text-xs font-bold text-[#00a859] opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 sm:inline-flex">
          {ar ? 'افتح' : 'Open'}
        </span>
        <ChevronRight size={18} className="rtl-flip flex-shrink-0 text-[#7c8aa6] transition-colors group-hover:text-[#00a859]" />
      </button>
    </motion.section>
  );
};

export default NextStepCard;
