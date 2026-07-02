import React, { useMemo, useState } from 'react';
import { Search, GraduationCap, Check, Ban } from 'lucide-react';
import { searchUniversities, NOT_ENROLLED } from '../../data/iraqUniversities';

interface UniversityPickerProps {
  /** Currently selected value (a university name or NOT_ENROLLED). */
  value?: string;
  /** Fired when the student picks a university or "not enrolled". */
  onSelect: (value: string) => void;
  lang: 'en' | 'ar';
  autoFocus?: boolean;
}

/**
 * Searchable list of Iraqi universities. Students choose from the list rather
 * than typing their own; a pinned "not enrolled" option is always available.
 */
const UniversityPicker: React.FC<UniversityPickerProps> = ({ value, onSelect, lang, autoFocus }) => {
  const [q, setQ] = useState('');
  const ar = lang === 'ar';
  const results = useMemo(() => searchUniversities(q, 60), [q]);

  return (
    <div className="flex flex-col min-h-0">
      {/* Search */}
      <div className="relative mb-3">
        <Search size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-[#6e7a94]" />
        <input
          autoFocus={autoFocus}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={ar ? 'ابحث عن جامعتك...' : 'Search your university...'}
          className="w-full bg-[#0e1522] border border-[#263248] rounded-lg ps-9 pe-3 py-2.5 text-sm text-[#f3f6ff] placeholder-[#6e7a94] focus:outline-none focus:border-[#00a859]/50 transition-colors"
        />
      </div>

      {/* Options */}
      <div className="min-h-0 overflow-y-auto custom-scrollbar rounded-lg border border-[#263248] bg-[#0b1019] divide-y divide-[#263248]/60 max-h-[46vh]">
        {/* Not enrolled — always available */}
        <button
          type="button"
          onClick={() => onSelect(NOT_ENROLLED)}
          className={`w-full flex items-center gap-3 px-4 py-3 text-start transition-colors ${
            value === NOT_ENROLLED ? 'bg-[#00a859]/10' : 'hover:bg-[#182235]'
          }`}
        >
          <Ban size={15} className="flex-shrink-0 text-[#6e7a94]" />
          <span className="flex-1 text-sm font-medium text-[#d2d7e3]">
            {ar ? 'لست مسجّلاً في جامعة' : "I'm not enrolled in a university"}
          </span>
          {value === NOT_ENROLLED && <Check size={15} className="text-[#00a859]" />}
        </button>

        {results.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-[#6e7a94]">
            {ar ? 'لا توجد نتائج مطابقة' : 'No matching universities'}
          </p>
        ) : (
          results.map((u) => {
            const selected = value === u.name;
            const label = ar && u.ar ? u.ar : u.name;
            const sub = ar && u.ar ? u.name : u.ar;
            return (
              <button
                key={u.name}
                type="button"
                onClick={() => onSelect(u.name)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-start transition-colors ${
                  selected ? 'bg-[#00a859]/10' : 'hover:bg-[#182235]'
                }`}
              >
                <GraduationCap
                  size={15}
                  className={`flex-shrink-0 ${selected ? 'text-[#00a859]' : 'text-[#6e7a94]'}`}
                />
                <span className="flex-1 min-w-0">
                  <span className={`block text-sm font-medium truncate ${selected ? 'text-[#00a859]' : 'text-[#f3f6ff]'}`}>
                    {label}
                  </span>
                  {sub && <span className="block text-[11px] text-[#6e7a94] truncate">{sub}</span>}
                </span>
                <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wide text-[#6e7a94]">
                  {u.type === 'public'
                    ? ar ? 'حكومية' : 'Public'
                    : ar ? 'أهلية' : 'Private'}
                </span>
                {selected && <Check size={15} className="flex-shrink-0 text-[#00a859]" />}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default UniversityPicker;
