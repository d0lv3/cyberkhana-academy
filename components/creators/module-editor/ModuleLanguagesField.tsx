import React from 'react';
import { Languages } from 'lucide-react';
import type { Lang } from '../../../services/contentLang';
import { nativeName, useTr } from './fields';

interface ModuleLanguagesFieldProps {
  /** The module's languages, the main one first. */
  value: Lang[];
  onChange: (languages: Lang[]) => void;
}

type Choice = 'en' | 'ar' | 'both';

/**
 * Which languages the module is written in.
 *
 * Asked outright, because nothing else can be worked out without it: which
 * title has to be there before the module can be saved, whether a lesson with
 * no Arabic is unfinished or simply not offered in Arabic, and what a learner
 * is told on the module's card. A module in both also says which one it was
 * written in first, since that is the one that has to be complete.
 */
const ModuleLanguagesField: React.FC<ModuleLanguagesFieldProps> = ({ value, onChange }) => {
  const tr = useTr();
  const choice: Choice = value.length === 2 ? 'both' : value[0] === 'ar' ? 'ar' : 'en';
  const main: Lang = value[0] ?? 'en';

  const choose = (next: Choice) => {
    if (next === 'both') onChange([main, main === 'en' ? 'ar' : 'en']);
    else onChange([next]);
  };

  const options: { id: Choice; title: string; body: string }[] = [
    {
      id: 'en',
      title: tr('English only', 'الإنجليزية فقط'),
      body: tr('Learners reading in Arabic are shown the English.', 'من يقرأ بالعربية يرى النص الإنجليزي.'),
    },
    {
      id: 'ar',
      title: tr('Arabic only', 'العربية فقط'),
      body: tr('Learners reading in English are shown the Arabic.', 'من يقرأ بالإنجليزية يرى النص العربي.'),
    },
    {
      id: 'both',
      title: tr('English and Arabic', 'الإنجليزية والعربية'),
      body: tr('Each learner reads it in their own language.', 'يقرأها كل متعلّم بلغته.'),
    },
  ];

  return (
    <fieldset>
      <legend className="mb-2 flex items-center gap-2 text-xs font-semibold text-[#9aa5bf]">
        <Languages size={14} aria-hidden="true" />
        {tr('Languages', 'اللغات')}
      </legend>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {options.map((option) => {
          const on = choice === option.id;
          return (
            <label
              key={option.id}
              className={`cursor-pointer rounded-lg border px-3 py-2.5 transition-colors focus-within:ring-2 focus-within:ring-[#00a859]/60 ${
                on ? 'border-[#00a859]/40 bg-[#00a859]/10' : 'border-[#263248] bg-[#0a0f18] hover:border-[#354562]'
              }`}
            >
              <input
                type="radio"
                name="module-languages"
                className="sr-only"
                checked={on}
                onChange={() => choose(option.id)}
              />
              <span className={`block text-xs font-bold ${on ? 'text-[#00a859]' : 'text-[#d2d7e3]'}`}>{option.title}</span>
              <span className="mt-0.5 block text-[11px] leading-relaxed text-[#8592ad]">{option.body}</span>
            </label>
          );
        })}
      </div>

      {choice === 'both' ? (
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="text-xs text-[#9aa5bf]">{tr('Written first in', 'كُتبت أولًا بـ')}</span>
          <div role="group" aria-label={tr('Main language', 'اللغة الأساسية')} className="flex gap-1 rounded-lg bg-[#0b1019] p-1" dir="ltr">
            {(['en', 'ar'] as const).map((l) => (
              <button
                key={l}
                type="button"
                lang={l}
                aria-pressed={main === l}
                onClick={() => onChange([l, l === 'en' ? 'ar' : 'en'])}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00a859] ${
                  main === l ? 'bg-[#00a859]/15 text-[#74dfac]' : 'text-[#9aa5bf] hover:text-white'
                }`}
              >
                {nativeName(l)}
              </button>
            ))}
          </div>
          <span className="text-[11px] text-[#8592ad]">
            {tr(
              'This one has to be complete. Wherever the other is missing, learners are shown this one.',
              'هذه يجب أن تكتمل. وحيثما نقصت الأخرى يرى المتعلّمون هذه.'
            )}
          </span>
        </div>
      ) : (
        <p className="mt-2 text-[11px] leading-relaxed text-[#8592ad]">
          {tr(
            'Anything already written in the other language stays in the Studio, and comes back if you add that language again. It is not shown to learners.',
            'ما كُتب باللغة الأخرى يبقى في الاستوديو ويعود إن أضفت تلك اللغة من جديد، ولا يظهر للمتعلّمين.'
          )}
        </p>
      )}
    </fieldset>
  );
};

export default ModuleLanguagesField;
