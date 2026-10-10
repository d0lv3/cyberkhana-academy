import React from 'react';
import { Languages } from 'lucide-react';
import { useLang } from '../../contexts/LangContext';
import { moduleLanguages, type Lang } from '../../services/contentLang';

const SHORT: Record<Lang, string> = { en: 'EN', ar: 'ع' };
const FULL: Record<Lang, { en: string; ar: string }> = {
  en: { en: 'English', ar: 'الإنجليزية' },
  ar: { en: 'Arabic', ar: 'العربية' },
};

/** The languages a creator's module says it is written in, in the reader's
 *  order: their own language first when the module has it. Nothing for a
 *  built-in course, which is not asked. */
function languagesToShow(module: unknown, reader: Lang): Lang[] | null {
  const mod = module as { isCreatorContent?: boolean; languages?: unknown } | null;
  if (!mod || (mod.isCreatorContent !== true && !mod.languages)) return null;
  const languages = moduleLanguages(module);
  return languages.includes(reader) ? [reader, ...languages.filter((l) => l !== reader)] : languages;
}

/**
 * Which languages a module can be read in.
 *
 * `compact` is the mark on a card, where there is room for two letters. The
 * full form spells the languages out for the module's own page. Either way the
 * point is the same: nobody should have to open a module to find out it is not
 * in their language.
 */
const ModuleLanguageBadge: React.FC<{ module: unknown; compact?: boolean; className?: string }> = ({
  module,
  compact = false,
  className = '',
}) => {
  const { lang } = useLang();
  const languages = languagesToShow(module, lang);
  if (!languages) return null;
  const names = languages.map((l) => FULL[l][lang]);
  const spoken =
    languages.length === 2
      ? lang === 'ar' ? `متوفرة بـ${names[0]} و${names[1]}` : `Available in ${names[0]} and ${names[1]}`
      : lang === 'ar' ? `متوفرة بـ${names[0]} فقط` : `Available in ${names[0]} only`;

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 ${className}`} title={spoken} role="img" aria-label={spoken}>
        <Languages size={11} aria-hidden="true" />
        <span dir="ltr" aria-hidden="true">{languages.map((l) => SHORT[l]).join(' · ')}</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <Languages size={12} aria-hidden="true" />
      {languages.length === 2
        ? lang === 'ar' ? `${names[0]} و${names[1]}` : `${names[0]} and ${names[1]}`
        : lang === 'ar' ? `${names[0]} فقط` : `${names[0]} only`}
    </span>
  );
};

export default ModuleLanguageBadge;
