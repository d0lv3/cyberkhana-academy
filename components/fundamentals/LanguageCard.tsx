import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Code, Lock } from 'lucide-react';
import CardArt from './CardArt';
import { useLang } from '../../contexts/LangContext';
import type { ProgrammingLanguage } from '../../data/programming/types';

/** Short monospace glyph drawn large behind the code-window art. */
function glyphFor(language: ProgrammingLanguage): string {
  switch (language.slug) {
    case 'python':
      return 'Py';
    case 'c':
      return 'C';
    case 'bash':
      return '$_';
    default:
      return language.name.slice(0, 2);
  }
}

/**
 * Square programming-language tile — mirrors ModuleCard, with a generated
 * code-window SVG cover (or the language's uploaded SVG). Unavailable languages
 * render locked.
 */
const LanguageCard: React.FC<{ language: ProgrammingLanguage; index?: number }> = ({
  language,
  index = 0,
}) => {
  const { lang } = useLang();
  const navigate = useNavigate();

  const moduleCount = language.modules.length;
  const conceptCount = language.modules.reduce((sum, m) => sum + m.concepts.length, 0);
  const open = () => language.available && navigate(`/fundamentals/programming/${language.slug}`);

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.06 + index * 0.05, duration: 0.4 }}
      role="button"
      tabIndex={language.available ? 0 : -1}
      onClick={open}
      onKeyDown={(e) => {
        if (language.available && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          open();
        }
      }}
      className={`group relative aspect-square w-full overflow-hidden rounded-2xl border border-[#263248] bg-[#121a2a] transition-all duration-200 focus:outline-none focus-visible:ring-2 ${
        language.available
          ? 'cursor-pointer hover:-translate-y-1 hover:shadow-lg hover:shadow-black/40 focus-visible:ring-white/30'
          : 'cursor-not-allowed'
      }`}
      style={{ ['--c' as string]: language.color }}
    >
      <CardArt
        kind="code"
        color={language.color}
        glyph={glyphFor(language)}
        svg={language.coverSvg}
        className={language.available ? 'transition-transform duration-500 group-hover:scale-[1.04]' : 'opacity-60'}
      />

      {/* Readability scrims */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#080c14] via-[#080c14]/55 to-transparent" />
      <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-[#080c14]/70 to-transparent" />

      {/* hover ring in the language color (available only) */}
      {language.available && (
        <div className="pointer-events-none absolute inset-0 rounded-2xl border border-transparent transition-colors duration-200 group-hover:border-[var(--c)]/55" />
      )}

      {/* Top badges */}
      <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
        <span
          className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold backdrop-blur-sm"
          style={{
            color: language.color,
            backgroundColor: `${language.color}1f`,
            borderColor: `${language.color}55`,
          }}
        >
          <Code size={12} /> {lang === 'ar' ? 'لغة' : 'Language'}
        </span>
        {!language.available && (
          <span className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-black/55 px-2 py-0.5 text-xs font-semibold text-[#cbd3e1] backdrop-blur-sm">
            <Lock size={11} /> {lang === 'ar' ? 'قريباً' : 'Soon'}
          </span>
        )}
      </div>

      {/* Bottom: name + stats */}
      <div className="absolute inset-x-0 bottom-0 p-4">
        <h3
          className="mb-2 text-lg font-bold leading-snug text-[#f3f6ff] transition-colors"
          style={language.available ? undefined : { color: '#9aa5bf' }}
        >
          {language.name}
        </h3>
        {language.available && moduleCount > 0 ? (
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium text-[#aab3c7]" dir="ltr">
            <span className="inline-flex items-center gap-1">
              <Code size={11} /> {moduleCount} {moduleCount === 1 ? 'module' : 'modules'}
            </span>
            <span>{conceptCount} {conceptCount === 1 ? 'lesson' : 'lessons'}</span>
          </div>
        ) : (
          <p className="line-clamp-2 text-[11px] leading-snug text-[#8794ad]">
            {language.description[lang]}
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default LanguageCard;
