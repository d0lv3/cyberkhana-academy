import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, ExternalLink } from 'lucide-react';
import Button from '../ui/EnhancedButton';
import StatusSelect from './StatusSelect';
import { useLang } from '../../contexts/LangContext';
import type { ContentStatus } from '../../services/creatorTypes';

interface CreatorLayoutProps {
  title: string;
  backTo: string;
  backLabel?: string;
  subtitle?: string;
  onSave?: (silent?: boolean) => void | Promise<void>;
  /** Serialized editable fields; UI-only state should be left out. */
  autoSaveSnapshot?: string;
  isSaving?: boolean;
  /** Lifecycle status control (preferred) */
  status?: ContentStatus;
  onStatusChange?: (status: ContentStatus) => void;
  /** Optional "preview as student" link (only meaningful once saved/published) */
  previewHref?: string;
  /** Live "preview as published" action — previews the current draft, unsaved. */
  onPreview?: () => void;
  children: React.ReactNode;
}

const CreatorLayout: React.FC<CreatorLayoutProps> = ({
  title,
  backTo,
  backLabel,
  subtitle,
  onSave,
  autoSaveSnapshot,
  isSaving = false,
  status,
  onStatusChange,
  previewHref,
  onPreview,
  children,
}) => {
  const navigate = useNavigate();
  const { t } = useLang();
  const [autoSave, setAutoSave] = useState(() => {
    try { return localStorage.getItem('creator-autosave') === 'true'; } catch { return false; }
  });
  const editedRef = useRef(false);
  const previousSnapshot = useRef(autoSaveSnapshot);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveRef = useRef(onSave);
  saveRef.current = onSave;
  const savingRef = useRef(isSaving);
  savingRef.current = isSaving;
  const autoSaveRef = useRef(autoSave);
  autoSaveRef.current = autoSave;

  const scheduleSave = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const run = () => {
      if (!autoSaveRef.current) return;
      if (savingRef.current) {
        timerRef.current = setTimeout(run, 500);
      } else {
        void saveRef.current?.(true);
      }
    };
    timerRef.current = setTimeout(run, 1800);
  };

  useEffect(() => {
    if (previousSnapshot.current === autoSaveSnapshot) return;
    previousSnapshot.current = autoSaveSnapshot;
    if (autoSave && editedRef.current && autoSaveSnapshot !== undefined) {
      scheduleSave();
    } else if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  }, [autoSave, autoSaveSnapshot]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const toggleAutoSave = () => {
    const next = !autoSave;
    setAutoSave(next);
    if (!next && timerRef.current) clearTimeout(timerRef.current);
    if (next && editedRef.current) scheduleSave();
    try { localStorage.setItem('creator-autosave', String(next)); } catch { /* preference is optional */ }
  };

  return (
    <div
      className="creator-layout min-w-0 space-y-6"
      onInputCapture={() => { editedRef.current = true; }}
      onChangeCapture={() => { editedRef.current = true; }}
      onClickCapture={(event) => {
        if (!(event.target as Element).closest('[data-creator-header]')) editedRef.current = true;
      }}
      onDropCapture={() => { editedRef.current = true; }}
    >
      {/* Header. Stacked below sm: the action cluster (preview + status +
          save) is close to a phone's full width on its own, so keeping it
          beside the title could only push something off-screen. */}
      <div data-creator-header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
        <div className="flex items-start gap-2 sm:gap-4 min-w-0">
          {/* Below sm the label is hidden and only a 16px chevron remains, so
              the button carries its own tap area rather than inheriting the
              icon's size. */}
          <button
            onClick={() => navigate(backTo)}
            aria-label={backLabel ?? t('studio.backDefault')}
            className="flex items-center justify-center sm:justify-start gap-2 text-sm text-[#8592ad] hover:text-[#d2d7e3] transition-colors flex-shrink-0 min-h-tap min-w-tap sm:min-w-0 sm:mt-1 -ms-2 sm:ms-0"
          >
            <ArrowLeft size={16} className="rtl-flip" />
            <span className="hidden sm:inline">{backLabel ?? t('studio.backDefault')}</span>
          </button>
          <div className="min-w-0 self-center sm:self-auto">
            <h1 className="text-lg sm:text-2xl font-bold text-[#f3f6ff] break-words">{title}</h1>
            {subtitle && <p className="text-sm text-[#8592ad] mt-0.5">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
          {onPreview && (
            <button
              type="button"
              onClick={onPreview}
              className="flex items-center gap-1.5 px-3 py-2 touch:min-h-tap rounded-lg text-xs font-semibold text-[#9fef00] bg-[#9fef00]/10 border border-[#9fef00]/25 hover:bg-[#9fef00]/15 transition-all select-none"
            >
              <ExternalLink size={13} /> {t('studio.preview')}
            </button>
          )}
          {!onPreview && previewHref && (
            <a
              href={previewHref}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-[#8592ad] bg-[#121a2a] border border-[#263248] hover:text-[#d2d7e3] hover:border-[#354562] transition-all"
            >
              <ExternalLink size={13} /> {t('studio.preview')}
            </a>
          )}

          {status && onStatusChange && (
            <StatusSelect value={status} onChange={(next) => { editedRef.current = true; onStatusChange(next); }} />
          )}

          {onSave && (
            <>
              {autoSaveSnapshot !== undefined && (
                <button
                  type="button"
                  role="switch"
                  aria-checked={autoSave}
                  onClick={toggleAutoSave}
                  className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${autoSave ? 'border-[#00c766]/50 bg-[#00c766]/10 text-[#6de9a4]' : 'border-[#263248] bg-[#121a2a] text-[#8592ad]'}`}
                >
                  {t(autoSave ? 'studio.autosaveOn' : 'studio.autosaveOff')}
                </button>
              )}
              <Button size="sm" onClick={() => { if (timerRef.current) clearTimeout(timerRef.current); void onSave(false); }} isLoading={isSaving} leftIcon={<Save size={14} />}>
                {t('studio.save')}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      {children}
    </div>
  );
};

export default CreatorLayout;
