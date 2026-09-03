import React from 'react';
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
  onSave?: () => void;
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
  isSaving = false,
  status,
  onStatusChange,
  previewHref,
  onPreview,
  children,
}) => {
  const navigate = useNavigate();
  const { t } = useLang();

  return (
    <div className="space-y-6">
      {/* Header. Stacked below sm: the action cluster (preview + status +
          save) is close to a phone's full width on its own, so keeping it
          beside the title could only push something off-screen. */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
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
            <h1 className="text-lg sm:text-2xl font-bold text-[#f3f6ff] truncate">{title}</h1>
            {subtitle && <p className="text-sm text-[#8592ad] mt-0.5 truncate">{subtitle}</p>}
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
            <StatusSelect value={status} onChange={onStatusChange} />
          )}

          {onSave && (
            <Button size="sm" onClick={onSave} isLoading={isSaving} leftIcon={<Save size={14} />}>
              {t('studio.save')}
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      {children}
    </div>
  );
};

export default CreatorLayout;
