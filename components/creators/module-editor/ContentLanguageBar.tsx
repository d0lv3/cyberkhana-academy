import React, { useState } from 'react';
import { CheckCircle2, ChevronDown, Columns2, Languages } from 'lucide-react';
import { LANGUAGE_NAME, otherLang, type Lang } from '../../../services/contentLang';
import type { Gap, GapPart, TranslationReport } from '../../../services/moduleLocalize';
import { nativeName, useTr, type EditingLanguage } from './fields';

interface ContentLanguageBarProps {
  editing: EditingLanguage;
  onLang: (lang: Lang) => void;
  onCompare: (compare: boolean) => void;
  /** What the second language still lacks. Absent on a one-language module. */
  report: TranslationReport | null;
  /** Take the creator to a gap, in the language it is missing in. */
  onOpenGap: (gap: Gap, lang: Lang) => void;
  /** Open the setting that says which languages the module is written in. */
  onChangeLanguages: () => void;
}

const PART_LABEL: Record<GapPart, [string, string]> = {
  title: ['title', 'العنوان'],
  description: ['description', 'الوصف'],
  name: ['chapter name', 'اسم الفصل'],
  subtitle: ['subtitle', 'العنوان الفرعي'],
  body: ['lesson text', 'نص الدرس'],
  quiz: ['quiz', 'الاختبار'],
  brief: ['brief', 'وصف المهمة'],
  details: ['objectives and labels', 'الأهداف والتسميات'],
};

/**
 * The one language switch of the module editor, and the state of the
 * translation beside it.
 *
 * It sits above every tab because it governs every tab: the module's title,
 * its chapters and lessons, its quizzes and its labs are all written in the
 * language chosen here. A module written in one language has nothing to
 * switch, and is told so in a line.
 */
const ContentLanguageBar: React.FC<ContentLanguageBarProps> = ({
  editing,
  onLang,
  onCompare,
  report,
  onOpenGap,
  onChangeLanguages,
}) => {
  const tr = useTr();
  const [open, setOpen] = useState(false);
  const { lang, languages, compare } = editing;
  const nameOf = (l: Lang) => tr(LANGUAGE_NAME[l].en, LANGUAGE_NAME[l].ar);

  if (languages.length < 2) {
    const only = languages[0] ?? 'en';
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#263248] bg-[#101827] px-4 py-3">
        <p className="flex items-center gap-2.5 text-xs text-[#9aa5bf]">
          <Languages size={15} className="flex-shrink-0 text-[#8592ad]" aria-hidden="true" />
          <span>
            {only === 'ar'
              ? tr('This module is written in Arabic only.', 'هذه الوحدة مكتوبة بالعربية فقط.')
              : tr('This module is written in English only.', 'هذه الوحدة مكتوبة بالإنجليزية فقط.')}
          </span>
        </p>
        <button
          type="button"
          onClick={onChangeLanguages}
          className="rounded-lg border border-[#263248] px-3 py-1.5 text-xs font-semibold text-[#c4cad6] transition-colors hover:border-[#00a859]/40 hover:text-[#00a859]"
        >
          {only === 'ar' ? tr('Add English', 'أضف الإنجليزية') : tr('Add Arabic', 'أضف العربية')}
        </button>
      </div>
    );
  }

  const second = report?.language ?? languages[1];
  const total = report?.lessons.total ?? 0;
  const done = report?.lessons.done ?? 0;
  const gaps = report?.gaps ?? [];
  const complete = gaps.length === 0;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="rounded-xl border border-[#263248] bg-[#101827]">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 px-4 py-3">
        {/* Which language is being written */}
        <div className="flex items-center gap-2.5">
          <Languages size={15} className="flex-shrink-0 text-[#8592ad]" aria-hidden="true" />
          <span className="text-xs font-semibold text-[#9aa5bf]">{tr('Writing in', 'لغة الكتابة')}</span>
          <div
            role="group"
            aria-label={tr('Language being written', 'لغة الكتابة')}
            className="flex gap-1 rounded-lg bg-[#0b1019] p-1"
            dir="ltr"
          >
            {languages.map((l) => (
              <button
                key={l}
                type="button"
                lang={l}
                aria-pressed={lang === l}
                onClick={() => onLang(l)}
                className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00a859] ${
                  lang === l ? 'bg-[#00a859]/15 text-[#74dfac]' : 'text-[#9aa5bf] hover:text-white'
                }`}
              >
                {nativeName(l)}
              </button>
            ))}
          </div>
        </div>

        {/* The other language beside each field */}
        <button
          type="button"
          role="switch"
          aria-checked={compare}
          onClick={() => onCompare(!compare)}
          className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00a859] ${
            compare
              ? 'border-[#00a859]/40 bg-[#00a859]/10 text-[#74dfac]'
              : 'border-[#263248] text-[#9aa5bf] hover:border-[#354562] hover:text-[#d2d7e3]'
          }`}
        >
          <Columns2 size={14} aria-hidden="true" />
          {otherLang(lang) === 'ar'
            ? tr('Show the Arabic alongside', 'أظهر العربية بجانبها')
            : tr('Show the English alongside', 'أظهر الإنجليزية بجانبها')}
        </button>

        {/* How far the second language has come */}
        <div className="ms-auto flex min-w-[220px] flex-1 items-center justify-end gap-3 sm:flex-none">
          {complete ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#74dfac]">
              <CheckCircle2 size={14} aria-hidden="true" />
              {second === 'ar' ? tr('The Arabic is complete', 'العربية مكتملة') : tr('The English is complete', 'الإنجليزية مكتملة')}
            </span>
          ) : (
            <button
              type="button"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className="group flex min-w-0 flex-1 items-center gap-3 rounded-lg px-2 py-1 text-start transition-colors hover:bg-[#182235] sm:flex-none"
            >
              <span className="min-w-0">
                <span className="flex items-baseline justify-between gap-4 text-xs">
                  <span className="font-semibold text-[#d2d7e3]">{nameOf(second)}</span>
                  <span className="text-[#8592ad]">
                    {tr(`${done} of ${total} ${total === 1 ? 'lesson' : 'lessons'}`, `الدروس: ${done} من ${total}`)}
                  </span>
                </span>
                <span className="mt-1.5 block h-1 w-44 overflow-hidden rounded-full bg-[#1a2332]" aria-hidden="true">
                  <span className="block h-full rounded-full bg-[#00a859]" style={{ width: `${pct}%` }} />
                </span>
              </span>
              <span className="inline-flex flex-shrink-0 items-center gap-1 rounded-full border border-[#f3a43a]/30 bg-[#f3a43a]/10 px-2 py-0.5 text-[10px] font-semibold text-[#f3a43a]">
                <span dir="ltr">{gaps.length}</span> {tr('to translate', 'بانتظار الترجمة')}
                <ChevronDown size={11} className={`transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
              </span>
            </button>
          )}
        </div>
      </div>

      {/* What is left, each one a way straight to it */}
      {open && !complete && (
        <ul className="max-h-64 space-y-1 overflow-y-auto border-t border-[#263248] p-2 custom-scrollbar">
          {gaps.map((gap, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => {
                  onOpenGap(gap, second);
                  setOpen(false);
                }}
                className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 rounded-lg px-3 py-2 text-start transition-colors hover:bg-[#182235]"
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8592ad]">
                  {gap.target.tab === 'details'
                    ? tr('Details', 'التفاصيل')
                    : gap.target.tab === 'lab'
                    ? tr('Lab', 'مختبر')
                    : gap.target.si === undefined
                    ? tr('Chapter', 'فصل')
                    : tr('Lesson', 'درس')}
                </span>
                <span className="min-w-0 flex-1 truncate text-xs font-semibold text-[#d2d7e3]">
                  <bdi>{gap.name || tr('Untitled', 'بلا عنوان')}</bdi>
                </span>
                <span className="text-[11px] text-[#8592ad]">
                  {gap.parts.map((part) => tr(PART_LABEL[part][0], PART_LABEL[part][1])).join(tr(', ', '، '))}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ContentLanguageBar;
