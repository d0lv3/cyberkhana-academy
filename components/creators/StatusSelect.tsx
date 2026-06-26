import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, FileEdit, Clock4, CheckCircle2, Check } from 'lucide-react';
import { STATUS_META, type ContentStatus } from '../../services/creatorTypes';
import { useLang } from '../../contexts/LangContext';

const ICONS: Record<ContentStatus, React.ElementType> = {
  draft: FileEdit,
  in_review: Clock4,
  published: CheckCircle2,
};

const ORDER: ContentStatus[] = ['draft', 'in_review', 'published'];

const DESCRIPTION_KEYS: Record<ContentStatus, string> = {
  draft: 'studio.statusDraftDesc',
  in_review: 'studio.statusReviewDesc',
  published: 'studio.statusPublishedDesc',
};

interface StatusSelectProps {
  value: ContentStatus;
  onChange: (status: ContentStatus) => void;
}

/** Three-state lifecycle control used in editor headers. */
const StatusSelect: React.FC<StatusSelectProps> = ({ value, onChange }) => {
  const { t, lang } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const meta = STATUS_META[value];
  const Icon = ICONS[value];
  const labelOf = (s: ContentStatus) => (lang === 'ar' ? STATUS_META[s].labelAr : STATUS_META[s].label);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div className="relative" ref={ref} dir="ltr">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
        style={{
          color: meta.color,
          backgroundColor: `${meta.color}12`,
          border: `1px solid ${meta.color}33`,
        }}
      >
        <Icon size={13} />
        {labelOf(value)}
        <ChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-56 rounded-xl bg-[#0d1420] border border-[#263248] shadow-2xl shadow-black/40 overflow-hidden z-30">
          {ORDER.map((s) => {
            const m = STATUS_META[s];
            const SIcon = ICONS[s];
            const active = s === value;
            return (
              <button
                key={s}
                type="button"
                onClick={() => {
                  onChange(s);
                  setOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-[#182235] transition-colors"
              >
                <span
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${m.color}15`, border: `1px solid ${m.color}30` }}
                >
                  <SIcon size={13} style={{ color: m.color }} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-xs font-semibold text-[#f3f6ff]">{labelOf(s)}</span>
                  <span className="block text-[10px] text-[#6e7a94]">{t(DESCRIPTION_KEYS[s])}</span>
                </span>
                {active && <Check size={13} className="text-[#00a859] flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StatusSelect;
