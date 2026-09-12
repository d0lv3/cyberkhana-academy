import React, { useCallback, useState } from 'react';
import { Check, Globe } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLang } from '../../contexts/LangContext';
import { hasChosenLanguage, rememberLanguageChoice } from '../../services/languageChoice';

/**
 * The first thing a new member is asked: which language do you want the
 * Academy in.
 *
 * It comes before the handle and the university, because those questions and
 * the tour after them are all written in whichever language is picked here.
 * It is the one prompt that cannot be written in the member's language, since
 * that is what it is asking, so it says everything twice and each half is set
 * in its own script and direction.
 *
 * Only genuinely new accounts see it. Somebody who already has a handle has
 * been through this once, and is using the Academy in a language they chose
 * at the top of the page; asking again on every new device would be pestering
 * them about a decision they already made.
 */

type Lang = 'en' | 'ar';

export function useLanguageFirstRun() {
  const { user, updateUser } = useAuth();
  const { lang, setLang } = useLang();
  const [answered, setAnswered] = useState(hasChosenLanguage);

  const needed = !!user && !user.username && !answered;

  const choose = useCallback(
    (next: Lang) => {
      setLang(next);
      rememberLanguageChoice();
      setAnswered(true);
      // Carried on the account too, so it follows them to another device.
      if (user && user.preferredLang !== next) updateUser({ preferredLang: next });
    },
    [setLang, updateUser, user]
  );

  return { needed, choose, current: lang };
}

const OPTIONS: {
  value: Lang;
  name: string;
  under: string;
  dir: 'ltr' | 'rtl';
  font?: string;
}[] = [
  { value: 'en', name: 'English', under: 'Learn in English', dir: 'ltr' },
  { value: 'ar', name: 'العربية', under: 'تعلّم بالعربية', dir: 'rtl' },
];

const LanguagePrompt: React.FC<{ choose: (lang: Lang) => void; current: Lang }> = ({
  choose,
  current,
}) => (
  <div
    className="fixed inset-0 z-[65] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
    role="dialog"
    aria-modal="true"
    aria-labelledby="language-prompt-title"
    dir="ltr"
  >
    <div className="w-full max-w-lg rounded-2xl border border-[#263248] bg-[#121a2a] shadow-2xl shadow-black/50">
      <div className="border-b border-[#263248] p-6 pb-5">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-[#00a859]/25 bg-[#00a859]/10">
            <Globe size={18} className="text-[#00a859]" />
          </div>
          <div className="min-w-0">
            <h2 id="language-prompt-title" className="text-lg font-black leading-tight text-[#f3f6ff]">
              Choose your language
            </h2>
            <p className="text-lg font-black leading-tight text-[#9aa5bf]" dir="rtl">
              اختر لغتك
            </p>
          </div>
        </div>
        <p className="text-sm text-[#9aa5bf]">
          The Academy is written in both. Everything after this, including the guided tour, follows
          the one you pick.
        </p>
        <p className="mt-1 text-sm text-[#9aa5bf]" dir="rtl">
          الأكاديمية مكتوبة باللغتين. وكل ما يأتي بعد هذا، والجولة التعريفية معه، يتبع ما تختاره.
        </p>
      </div>

      <div className="grid gap-3 p-6 sm:grid-cols-2">
        {OPTIONS.map((option, i) => (
          <button
            key={option.value}
            autoFocus={i === 0}
            onClick={() => choose(option.value)}
            dir={option.dir}
            className="group relative rounded-xl border border-[#263248] bg-[#0a0f18] px-4 py-5 text-center transition-all hover:-translate-y-0.5 hover:border-[#00a859]/60 hover:bg-[#0e1626] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00a859]/60 touch:min-h-tap"
          >
            {/* Which one the interface is already using, so the choice is
                informed rather than a coin toss. */}
            {current === option.value && (
              <span className="absolute end-2.5 top-2.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#00a859]">
                <Check size={11} />
                {option.value === 'ar' ? 'الحالية' : 'Current'}
              </span>
            )}
            <span className="block text-xl font-black text-[#f3f6ff] transition-colors group-hover:text-[#9fef00]">
              {option.name}
            </span>
            <span className="mt-1 block text-xs text-[#8592ad]">{option.under}</span>
          </button>
        ))}
      </div>

      {/* Two sentences, two lines: run together they break mid-thought on a
          phone and the separator lands at the start of the Arabic. */}
      <div className="px-6 pb-6 text-center text-[11px] leading-relaxed text-[#7c8aa6]">
        <p>You can switch at any time from the top of the page.</p>
        <p dir="rtl">يمكنك التبديل في أي وقت من أعلى الصفحة.</p>
      </div>
    </div>
  </div>
);

export default LanguagePrompt;
