import React from 'react';
import { Users, Edit3, Trash2, Eye, EyeOff, LogOut } from 'lucide-react';
import EnhancedCard from '../ui/EnhancedCard';
import StatusBadge from './StatusBadge';
import { confirmDialog } from '../ui/ConfirmHost';
import { useLang } from '../../contexts/LangContext';
import { statusOf, type CreatorMeta } from '../../services/creatorTypes';
import { revokeGrant, type CollabPerson } from '../../services/collabService';

export interface SharedGroup<T> {
  grantId: string;
  owner: CollabPerson | null;
  items: T[];
}

interface SharedWithMeProps<T> {
  groups: SharedGroup<T>[];
  /** Tab name, for the heading and the leave-share confirmation. */
  label: string;
  title: (item: T) => string;
  subtitle: (item: T) => string;
  /** Extra chips between the byline and the actions (difficulty, duration...). */
  meta?: (item: T) => React.ReactNode;
  accent?: (item: T) => string | undefined;
  onEdit: (ownerId: string, item: T) => void;
  onTogglePublish: (ownerId: string, item: T) => void;
  onDelete: (ownerId: string, item: T) => void;
  /** Refresh after leaving a share. */
  onChange: () => void;
}

/**
 * Content another creator has handed you, grouped by who owns it.
 *
 * It is kept visually distinct from your own work (blue, and always bylined)
 * because the rights are the same but the responsibility is not: editing here
 * changes someone else's live content under their name.
 */
function SharedWithMe<T extends { id: string } & Partial<CreatorMeta>>({
  groups,
  label,
  title,
  subtitle,
  meta,
  accent,
  onEdit,
  onTogglePublish,
  onDelete,
  onChange,
}: SharedWithMeProps<T>) {
  const { lang } = useLang();
  const ar = lang === 'ar';

  const populated = groups.filter((g) => g.items.length > 0);
  if (populated.length === 0) return null;

  const leave = async (group: SharedGroup<T>) => {
    const who = group.owner?.displayName ?? (ar ? 'هذا المستخدم' : 'this user');
    const ok = await confirmDialog({
      title: ar ? 'مغادرة المشاركة؟' : 'Leave this share?',
      message: ar
        ? `لن يعود بإمكانك فتح ${label} الخاصة بـ ${who}. لن يُحذف أي محتوى، ويمكنه مشاركتها معك مجددًا.`
        : `You will no longer see ${who}'s ${label}. Nothing is deleted, and they can share it with you again.`,
      confirmLabel: ar ? 'مغادرة' : 'Leave',
    });
    if (!ok) return;
    try {
      await revokeGrant(group.grantId);
      onChange();
    } catch {
      /* the list refresh below will show the truth either way */
      onChange();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Users size={14} className="text-[#60a5fa]" />
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#8592ad]">
          {ar ? 'مشارَك معك' : 'Shared with you'}
        </h2>
      </div>
      <p className="-mt-1 text-xs text-[#8592ad]">
        {ar
          ? 'لديك نفس صلاحيات المالك هنا: التعديل والنشر والحذف. يبقى اسم المؤلف الأصلي على المحتوى.'
          : 'You have the owner’s rights here: edit, publish and delete. The original author stays on the content.'}
      </p>

      {populated.map((group) => (
        <div key={group.grantId} className="space-y-2">
          <div className="flex items-center justify-between gap-2 px-1">
            <p className="text-xs font-semibold text-[#9aa5bf]">
              {ar ? 'من' : 'From'}{' '}
              <span className="text-[#f3f6ff]">
                {group.owner?.displayName ?? (ar ? 'مستخدم محذوف' : 'Removed user')}
              </span>
              {group.owner?.username && (
                <span className="ms-1.5 font-mono text-[10px] text-[#7c8aa6]" dir="ltr">
                  @{group.owner.username}
                </span>
              )}
            </p>
            <button
              onClick={() => leave(group)}
              title={ar ? 'مغادرة المشاركة' : 'Leave this share'}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold text-[#8592ad] transition-all hover:bg-[#263248]/60 hover:text-[#d2d7e3]"
            >
              <LogOut size={11} className="rtl-flip" />
              {ar ? 'مغادرة' : 'Leave'}
            </button>
          </div>

          {group.items.map((item) => (
            <EnhancedCard
              key={`${group.grantId}-${item.id}`}
              padding="none"
              hoverable
              className="group overflow-hidden"
            >
              {accent?.(item) && <div className="h-1" style={{ backgroundColor: accent(item) }} />}
              <div className="flex items-center gap-4 px-5 py-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-[#60a5fa]/20 bg-[#60a5fa]/10">
                  <Users size={16} className="text-[#60a5fa]" />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-bold text-[#f3f6ff]">{title(item)}</h3>
                  <p className="mt-0.5 truncate text-xs text-[#8592ad]">{subtitle(item)}</p>
                </div>

                <div className="flex flex-shrink-0 items-center gap-2" dir="ltr">
                  {meta?.(item)}
                  <StatusBadge status={statusOf(item)} />

                  <button
                    onClick={() => onTogglePublish(group.owner?.id ?? '', item)}
                    title={statusOf(item) === 'published' ? (ar ? 'إلغاء النشر' : 'Unpublish') : (ar ? 'نشر' : 'Publish')}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-[#8592ad] transition-all hover:bg-[#00a859]/10 hover:text-[#00a859]"
                  >
                    {statusOf(item) === 'published' ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>

                  <button
                    onClick={() => onEdit(group.owner?.id ?? '', item)}
                    title={ar ? 'تعديل' : 'Edit'}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-[#8592ad] transition-all hover:bg-[#60a5fa]/10 hover:text-[#60a5fa]"
                  >
                    <Edit3 size={13} />
                  </button>

                  <button
                    onClick={() => onDelete(group.owner?.id ?? '', item)}
                    title={ar ? 'حذف' : 'Delete'}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-[#8592ad] transition-all hover:bg-red-500/10 hover:text-red-400"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </EnhancedCard>
          ))}
        </div>
      ))}
    </div>
  );
}

export default SharedWithMe;
