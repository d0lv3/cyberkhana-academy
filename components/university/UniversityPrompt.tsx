import React from 'react';
import { GraduationCap } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLang } from '../../contexts/LangContext';
import UniversityPicker from './UniversityPicker';

/**
 * First-run prompt asking the student which Iraqi university they're enrolled
 * in. Renders whenever the signed-in user hasn't made a choice yet (empty
 * `university`), so it reappears each login until answered. Picking a
 * university OR "not enrolled" records the choice and dismisses it — there is
 * no skip, because "not enrolled" IS the opt-out.
 */
const UniversityPrompt: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { lang } = useLang();
  const ar = lang === 'ar';

  // Only when signed in and no choice recorded yet. Claiming a username comes
  // first, so wait our turn rather than stacking two blocking modals.
  if (!user || !user.username || user.university) return null;

  const choose = (value: string) => {
    updateUser({ university: value });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" dir={ar ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-lg rounded-2xl border border-[#263248] bg-[#121a2a] shadow-2xl shadow-black/50 flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-[#263248]">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#00a859]/10 border border-[#00a859]/25 flex items-center justify-center flex-shrink-0">
              <GraduationCap size={18} className="text-[#00a859]" />
            </div>
            <h2 className="text-lg font-black text-[#f3f6ff]">
              {ar ? 'ما هي جامعتك؟' : 'Which university are you in?'}
            </h2>
          </div>
          <p className="text-sm text-[#9aa5bf]">
            {ar
              ? 'اختر جامعتك من القائمة لنعرض ترتيبك بين طلاب جامعتك. يمكنك تغيير ذلك لاحقاً من ملفك الشخصي.'
              : 'Pick your university so we can rank you alongside your peers. You can change this later from your profile.'}
          </p>
        </div>

        {/* Picker */}
        <div className="p-6 pt-4 min-h-0 flex flex-col">
          <UniversityPicker value={user.university} onSelect={choose} lang={lang} autoFocus />
        </div>
      </div>
    </div>
  );
};

export default UniversityPrompt;
