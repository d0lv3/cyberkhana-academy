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
  children,
}) => {
  const navigate = useNavigate();
  const { t } = useLang();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0">
          <button
            onClick={() => navigate(backTo)}
            className="mt-1 flex items-center gap-2 text-sm text-[#6e7a94] hover:text-[#d2d7e3] transition-colors flex-shrink-0"
          >
            <ArrowLeft size={16} className="rtl-flip" />
            <span className="hidden sm:inline">{backLabel ?? t('studio.backDefault')}</span>
          </button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-[#f3f6ff] truncate">{title}</h1>
            {subtitle && <p className="text-sm text-[#6e7a94] mt-0.5 truncate">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {previewHref && (
            <a
              href={previewHref}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-[#6e7a94] bg-[#121a2a] border border-[#263248] hover:text-[#d2d7e3] hover:border-[#354562] transition-all"
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
