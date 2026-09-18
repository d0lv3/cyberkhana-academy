import React, { useState } from 'react';
import { Check, Minus, Plus, X } from 'lucide-react';
import MemberTags from '../ui/MemberTags';
import { api } from '../../services/api';
import {
  DEFAULT_TAG_COLOR,
  TAG_COLORS,
  TAG_COLOR_NAMES,
  TAG_LABEL_MAX,
  TAG_MAX,
  cleanTagLabel,
  type MemberTag,
  type TagColor,
} from '../../backend/src/shared/tags';

/* ─── Points and tags, for one member ───
 *
 * The two things an admin can give someone that the Academy cannot work out
 * for itself. They share a panel because they are the same act: saying
 * something about a member that their finished lessons do not.
 *
 * Points are an adjustment, not a total. The number shown as "standing" is
 * what the leaderboard reads, and the adjustment is the part of it an admin
 * put there; the rest is earned and changes on its own as the member studies.
 * Sending a negative is how an award is taken back, so there is no separate
 * undo to get wrong.
 *
 * Tags are saved as a set, not one at a time. What the panel shows is what the
 * profile will show, which makes the Save button mean something precise and
 * makes a half-finished edit costless to abandon.
 */

export interface AwardTarget {
  id: string;
  displayName: string;
  /** What the leaderboard reads. */
  points?: number;
  /** The part of that an admin put there, signed. */
  pointsAdjustment?: number;
  tags?: MemberTag[];
}

interface MemberAwardPanelProps {
  user: AwardTarget;
  ar: boolean;
  /** Hands back the member as the server restated them. */
  onUpdated: (user: AwardTarget) => void;
  onClose: () => void;
  toast: (kind: 'success' | 'error', message: string) => void;
}

const QUICK = [10, 25, 50, 100];

const MemberAwardPanel: React.FC<MemberAwardPanelProps> = ({ user, ar, onUpdated, onClose, toast }) => {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [awarding, setAwarding] = useState(false);

  const [tags, setTags] = useState<MemberTag[]>(user.tags ?? []);
  const [label, setLabel] = useState('');
  const [color, setColor] = useState<TagColor>(DEFAULT_TAG_COLOR);
  const [savingTags, setSavingTags] = useState(false);

  const parsed = Number.parseInt(amount, 10);
  const canAward = Number.isFinite(parsed) && parsed !== 0 && Math.abs(parsed) <= 100_000;

  /* Comparing as JSON is fine for a list this small, and it catches a reorder
     as a change, which it is: the chips render in this order. */
  const tagsDirty = JSON.stringify(tags) !== JSON.stringify(user.tags ?? []);
  const cleanedLabel = cleanTagLabel(label);
  const duplicate = tags.some((t) => t.label.toLowerCase() === cleanedLabel.toLowerCase());
  const canAddTag = !!cleanedLabel && !duplicate && tags.length < TAG_MAX;

  const award = async () => {
    if (!canAward) return;
    setAwarding(true);
    try {
      const { user: updated } = await api.post<{ user: AwardTarget }>(
        `/admin/users/${user.id}/points`,
        { amount: parsed, ...(reason.trim() ? { reason: reason.trim() } : {}) }
      );
      onUpdated(updated);
      setAmount('');
      setReason('');
      toast(
        'success',
        parsed > 0
          ? ar
            ? `أُضيفت ${parsed} نقطة إلى ${updated.displayName}.`
            : `Gave ${updated.displayName} ${parsed} points.`
          : ar
            ? `خُصمت ${Math.abs(parsed)} نقطة من ${updated.displayName}.`
            : `Took ${Math.abs(parsed)} points from ${updated.displayName}.`
      );
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Award failed');
    } finally {
      setAwarding(false);
    }
  };

  const saveTags = async () => {
    setSavingTags(true);
    try {
      const { user: updated } = await api.put<{ user: AwardTarget }>(
        `/admin/users/${user.id}/tags`,
        { tags }
      );
      onUpdated(updated);
      setTags(updated.tags ?? []);
      toast('success', ar ? `حُدّثت وسوم ${updated.displayName}.` : `${updated.displayName}'s tags updated.`);
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Could not save tags');
    } finally {
      setSavingTags(false);
    }
  };

  const addTag = () => {
    if (!canAddTag) return;
    setTags((prev) => [...prev, { label: cleanedLabel, color }]);
    setLabel('');
  };

  const field =
    'w-full rounded-lg border border-[#263248] bg-[#0a0f18] px-3 py-2 text-xs text-[#d2d7e3] placeholder:text-[#7c8aa6] focus:border-[#00a859]/50 focus:outline-none';

  return (
    <div className="space-y-5 bg-[#0b1019] px-5 pb-4 pt-3">
      {/* ── Points ── */}
      <div>
        <div className="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#8592ad]">
            {ar ? 'النقاط' : 'Points'}
          </p>
          <p className="text-[11px] text-[#8592ad]" dir="ltr">
            <span className="font-mono text-[#d2d7e3]">{(user.points ?? 0).toLocaleString('en-US')}</span>{' '}
            {ar ? 'على اللوحة' : 'on the board'}
            {!!user.pointsAdjustment && (
              <>
                {' · '}
                <span className="font-mono text-[#00a859]">
                  {user.pointsAdjustment > 0 ? '+' : ''}
                  {user.pointsAdjustment.toLocaleString('en-US')}
                </span>{' '}
                {ar ? 'يدويًا' : 'by hand'}
              </>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {QUICK.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setAmount(String((Number.parseInt(amount, 10) || 0) + n))}
              className="rounded-lg border border-[#263248] px-2.5 py-1.5 text-[11px] font-bold text-[#9aa5bf] transition-colors hover:border-[#00a859]/40 hover:text-[#00a859]"
              dir="ltr"
            >
              +{n}
            </button>
          ))}
          <span className="mx-1 h-5 w-px bg-[#263248]" aria-hidden />
          <button
            type="button"
            onClick={() => setAmount(String(-(Number.parseInt(amount, 10) || 0)))}
            title={ar ? 'اعكس الإشارة' : 'Flip the sign'}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#263248] text-[#9aa5bf] transition-colors hover:border-[#f87171]/40 hover:text-[#f87171]"
          >
            <Minus size={13} />
          </button>
          <input
            type="number"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={ar ? 'المقدار' : 'Amount'}
            dir="ltr"
            className={`${field} w-28 flex-shrink-0 font-mono`}
          />
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={200}
            placeholder={ar ? 'السبب (للسجل، اختياري)' : 'Reason (for the log, optional)'}
            className={`${field} min-w-[12rem] flex-1`}
          />
          <button
            type="button"
            onClick={() => void award()}
            disabled={!canAward || awarding}
            className="flex-shrink-0 rounded-lg bg-[#00a859] px-4 py-2 text-xs font-bold text-[#0d1117] transition-colors hover:bg-[#00934e] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {awarding ? (ar ? '...' : '...') : ar ? 'منح' : 'Give'}
          </button>
        </div>
        <p className="mt-1.5 text-[10px] leading-relaxed text-[#7c8aa6]">
          {ar
            ? 'يُضاف المقدار إلى ما كسبه العضو، ويبقى بعد كل مزامنة. أرسل قيمة سالبة للتراجع.'
            : 'Added on top of what they earned, and it survives every sync. Send a negative to take it back.'}
        </p>
      </div>

      {/* ── Tags ── */}
      <div className="border-t border-[#263248]/60 pt-4">
        <div className="mb-2 flex flex-wrap items-baseline gap-x-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#8592ad]">
            {ar ? 'الوسوم' : 'Tags'}
          </p>
          <p className="text-[10px] text-[#7c8aa6]" dir="ltr">
            {tags.length} / {TAG_MAX}
          </p>
        </div>

        {tags.length > 0 ? (
          <div className="mb-3 flex flex-wrap items-center gap-1.5">
            {tags.map((tag, i) => {
              const c = TAG_COLORS[tag.color] ?? TAG_COLORS.green;
              return (
                <span
                  key={`${tag.color}:${tag.label}`}
                  dir="auto"
                  className="inline-flex max-w-full items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold"
                  style={{ color: c.fg, backgroundColor: c.bg, borderColor: c.border }}
                >
                  <span className="truncate">{tag.label}</span>
                  <button
                    type="button"
                    onClick={() => setTags((prev) => prev.filter((_, j) => j !== i))}
                    aria-label={ar ? `احذف ${tag.label}` : `Remove ${tag.label}`}
                    className="opacity-60 transition-opacity hover:opacity-100"
                  >
                    <X size={11} />
                  </button>
                </span>
              );
            })}
          </div>
        ) : (
          <p className="mb-3 text-[11px] text-[#7c8aa6]">
            {ar ? 'لا وسوم على هذا الحساب.' : 'No tags on this account.'}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            {TAG_COLOR_NAMES.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setColor(name)}
                aria-label={name}
                title={name}
                className={`h-6 w-6 rounded-md border-2 transition-transform ${
                  color === name ? 'scale-110' : 'border-transparent opacity-60 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: TAG_COLORS[name].bg,
                  borderColor: color === name ? TAG_COLORS[name].fg : 'transparent',
                }}
              >
                <span
                  className="mx-auto block h-2 w-2 rounded-full"
                  style={{ backgroundColor: TAG_COLORS[name].fg }}
                />
              </button>
            ))}
          </div>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTag();
              }
            }}
            maxLength={TAG_LABEL_MAX}
            placeholder={ar ? 'وسم جديد' : 'New tag'}
            className={`${field} min-w-[10rem] flex-1`}
          />
          <button
            type="button"
            onClick={addTag}
            disabled={!canAddTag}
            title={
              duplicate
                ? ar
                  ? 'هذا الوسم موجود'
                  : 'Already on this account'
                : tags.length >= TAG_MAX
                  ? ar
                    ? 'بلغت الحد'
                    : 'At the limit'
                  : ar
                    ? 'أضف'
                    : 'Add'
            }
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-[#263248] text-[#9aa5bf] transition-colors hover:border-[#00a859]/40 hover:text-[#00a859] disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Plus size={14} />
          </button>
        </div>

        {tags.length > 0 && (
          <div className="mt-3">
            <p className="mb-1 text-[10px] uppercase tracking-wide text-[#7c8aa6]">
              {ar ? 'كما تظهر في الملف' : 'As the profile shows them'}
            </p>
            <MemberTags tags={tags} />
          </div>
        )}

        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => void saveTags()}
            disabled={!tagsDirty || savingTags}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#00a859] px-4 py-2 text-xs font-bold text-[#0d1117] transition-colors hover:bg-[#00934e] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Check size={13} />
            {savingTags ? (ar ? 'جارٍ الحفظ...' : 'Saving...') : ar ? 'حفظ الوسوم' : 'Save tags'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 text-xs font-semibold text-[#9aa5bf] transition-colors hover:text-[#d2d7e3]"
          >
            {ar ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MemberAwardPanel;
