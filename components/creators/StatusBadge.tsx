import React from 'react';
import { FileEdit, Clock4, CheckCircle2 } from 'lucide-react';
import { STATUS_META, type ContentStatus } from '../../services/creatorTypes';
import { useLang } from '../../contexts/LangContext';

const ICONS: Record<ContentStatus, React.ElementType> = {
  draft: FileEdit,
  in_review: Clock4,
  published: CheckCircle2,
};

interface StatusBadgeProps {
  status: ContentStatus;
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

/** Consistent lifecycle pill: Draft / In Review / Published. */
const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm', showIcon = true }) => {
  const { lang } = useLang();
  const meta = STATUS_META[status];
  const Icon = ICONS[status];
  const pad = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';
  const iconSize = size === 'sm' ? 10 : 12;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-bold whitespace-nowrap ${pad}`}
      style={{
        color: meta.color,
        backgroundColor: `${meta.color}15`,
        border: `1px solid ${meta.color}33`,
      }}
      dir="ltr"
    >
      {showIcon && <Icon size={iconSize} />}
      {lang === 'ar' ? meta.labelAr : meta.label}
    </span>
  );
};

export default StatusBadge;
