import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowDown,
  ArrowUp,
  Check,
  Clock,
  Eye,
  ListOrdered,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import CreatorLayout from '../../components/creators/CreatorLayout';
import BilingualInput from '../../components/creators/BilingualInput';
import StatusBadge from '../../components/creators/StatusBadge';
import EnhancedCard from '../../components/ui/EnhancedCard';
import AuthorChip from '../../components/ui/AuthorChip';
import NetworkingLessonCard from '../../components/fundamentals/NetworkingLessonCard';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../contexts/AuthContext';
import { useLang } from '../../contexts/LangContext';
import { getNetworkingLessons } from '../../data/networking';
import {
  getCreatorNetworkingLessons,
  getCreatorNetworkingUnits,
  getNetworkingUnitById,
  getPublishedNetworkingUnits,
  saveItemAsAdmin,
  saveNetworkingUnit,
} from '../../services/creatorDataService';
import {
  creditOf,
  makeCreatorMeta,
  statusOf,
  type ContentStatus,
  type NetworkingUnit,
} from '../../services/creatorTypes';
import type { NetworkingLesson } from '../../components/network-sim/types';
import { ADMIN_UNIT_STASH, type AdminUnitStash } from './networkingUnitStash';

/* ─── Networking unit editor ───
 *
 * A unit is a title, a line of description, a place on the Networking page and
 * an ordered list of lessons. The lessons can be anyone's: arranging them is
 * the unit author's work, writing them stays credited to whoever wrote them.
 * Mirrors the path editor's builder (pick on the left, order on the right) so
 * a creator who has made a path already knows how this one works.
 */

const inputCls =
  'w-full bg-[#0a0f18] border border-[#263248] rounded-lg px-3 py-2 text-sm text-[#d2d7e3] focus:outline-none focus:border-[#00a859]/50 transition-colors placeholder:text-[#7c8aa6]';

function generateId(): string {
  return `unit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

interface PickableLesson {
  lesson: NetworkingLesson;
  /** Published lessons are live; my own drafts can be placed ahead of time. */
  status: ContentStatus;
}

const NetworkingUnitEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const viaAdmin = searchParams.get('admin') === '1';
  const navigate = useNavigate();
  const { toast, ToastContainer } = useToast();
  const { user } = useAuth();
  const { lang } = useLang();
  const ar = lang === 'ar';
  const isEditing = !!id;

  /* Anything already placed on the page decides where a new unit goes: after
     the last one, so a fresh unit never jumps the queue by accident. */
  const nextOrder = useMemo(() => {
    const orders = [...getPublishedNetworkingUnits(), ...getCreatorNetworkingUnits()].map(
      (u) => Number(u.order) || 0
    );
    return (orders.length ? Math.max(...orders) : 0) + 1;
  }, []);

  const [titleEn, setTitleEn] = useState('');
  const [titleAr, setTitleAr] = useState('');
  const [descEn, setDescEn] = useState('');
  const [descAr, setDescAr] = useState('');
  const [order, setOrder] = useState<number>(nextOrder);
  const [lessonIds, setLessonIds] = useState<string[]>([]);
  const [status, setStatus] = useState<ContentStatus>('draft');
  const [existing, setExisting] = useState<NetworkingUnit | null>(null);
  const [adminCtx, setAdminCtx] = useState<{ ownerId: string; ownerName: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!id) return;
    let unit: NetworkingUnit | undefined;
    if (viaAdmin) {
      try {
        const raw = sessionStorage.getItem(ADMIN_UNIT_STASH);
        const stash: AdminUnitStash | null = raw ? JSON.parse(raw) : null;
        if (stash && stash.id === id) {
          unit = stash.unit;
          setAdminCtx({ ownerId: stash.ownerId, ownerName: stash.ownerName });
        }
      } catch {
        /* falls through to the guard below */
      }
    } else {
      unit = getNetworkingUnitById(id);
    }
    if (!unit) {
      navigate('/creators/networking');
      return;
    }
    setExisting(unit);
    setTitleEn(unit.title.en);
    setTitleAr(unit.title.ar);
    setDescEn(unit.description.en);
    setDescAr(unit.description.ar);
    setOrder(Number(unit.order) || 1);
    setLessonIds(Array.isArray(unit.lessonIds) ? unit.lessonIds : []);
    setStatus(statusOf(unit));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, viaAdmin]);

  /* Every lesson this creator can place: everything live, plus their own
     lessons that are not published yet. A draft can sit in a unit ahead of
     time; students only ever see the lessons that are live. */
  const pickable = useMemo<PickableLesson[]>(() => {
    const byId = new Map<string, PickableLesson>();
    for (const lesson of getNetworkingLessons()) byId.set(lesson.id, { lesson, status: 'published' });
    for (const lesson of getCreatorNetworkingLessons()) {
      if (!byId.has(lesson.id)) byId.set(lesson.id, { lesson, status: statusOf(lesson) });
    }
    return [...byId.values()];
  }, []);
  const pickableById = useMemo(() => new Map(pickable.map((p) => [p.lesson.id, p])), [pickable]);

  /** Another live unit that already lists this lesson. The page gives a lesson
   *  to the first unit that lists it, so a second listing would not show. */
  const otherUnits = useMemo(
    () => getPublishedNetworkingUnits().filter((u) => u.id !== id),
    [id]
  );
  const listedIn = (lessonId: string) => otherUnits.find((u) => u.lessonIds.includes(lessonId));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return pickable;
    return pickable.filter(({ lesson }) =>
      `${lesson.title.en} ${lesson.title.ar}`.toLowerCase().includes(q)
    );
  }, [pickable, query]);

  const add = (lessonId: string) =>
    setLessonIds((prev) => (prev.includes(lessonId) ? prev : [...prev, lessonId]));
  const remove = (idx: number) => setLessonIds((prev) => prev.filter((_, i) => i !== idx));
  const move = (idx: number, dir: -1 | 1) =>
    setLessonIds((prev) => {
      const target = idx + dir;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });

  /* The number this unit would carry on the Networking page. */
  const previewNumber = otherUnits.filter((u) => (Number(u.order) || 0) < order).length + 1;
  const previewLessons = lessonIds
    .map((lessonId) => pickableById.get(lessonId)?.lesson)
    .filter((l): l is NetworkingLesson => !!l);

  const handleSave = async () => {
    if (!titleEn.trim()) {
      toast('error', ar ? 'العنوان بالإنجليزية مطلوب.' : 'An English title is required.');
      return;
    }
    if (lessonIds.length === 0) {
      toast('error', ar ? 'أضف درسا واحدا على الأقل.' : 'Add at least one lesson to the unit.');
      return;
    }

    setIsSaving(true);
    // An admin editing someone else's unit keeps that creator's name on it.
    const authorName = existing?.authorName || user?.displayName || 'CyberKhana';
    const unit: NetworkingUnit = {
      id: existing?.id || generateId(),
      title: { en: titleEn.trim(), ar: titleAr.trim() },
      description: { en: descEn.trim(), ar: descAr.trim() },
      order: Number.isFinite(order) && order > 0 ? Math.round(order) : 1,
      lessonIds,
      ...(existing
        ? {
            isCreatorContent: true as const,
            isPublished: status === 'published',
            status,
            authorName,
            createdAt: existing.createdAt,
            updatedAt: new Date().toISOString(),
          }
        : makeCreatorMeta(status, authorName)),
    };

    if (adminCtx) {
      try {
        await saveItemAsAdmin(adminCtx.ownerId, 'networking-units', unit);
        sessionStorage.removeItem(ADMIN_UNIT_STASH);
      } catch (err) {
        setIsSaving(false);
        toast('error', err instanceof Error ? err.message : 'Could not save this unit.');
        return;
      }
    } else {
      saveNetworkingUnit(unit);
    }

    toast(
      'success',
      status === 'published' ? (ar ? 'نُشرت المرحلة.' : 'Unit published.') : ar ? 'حُفظت المرحلة.' : 'Unit saved.'
    );
    setTimeout(() => {
      setIsSaving(false);
      navigate('/creators/networking');
    }, 500);
  };

  return (
    <CreatorLayout
      title={isEditing ? (ar ? 'تعديل المرحلة' : 'Edit unit') : ar ? 'مرحلة جديدة' : 'New unit'}
      subtitle={titleEn || undefined}
      backTo="/creators/networking"
      backLabel={ar ? 'دروس الشبكات' : 'Networking Lessons'}
      onSave={handleSave}
      isSaving={isSaving}
      status={status}
      onStatusChange={setStatus}
    >
      <ToastContainer />

      {adminCtx && (
        <div className="flex items-start gap-3 rounded-lg border border-[#f3a43a]/30 bg-[#f3a43a]/10 px-4 py-3">
          <ShieldCheck size={16} className="text-[#f3a43a] mt-0.5 flex-shrink-0" />
          <p className="text-xs text-[#d2d7e3]">
            {ar ? (
              <>
                أنت تعدّل مرحلة <span className="font-semibold text-[#f3f6ff]">{adminCtx.ownerName}</span> بصفتك
                مشرفا. تبقى المرحلة باسم صاحبها.
              </>
            ) : (
              <>
                You're editing <span className="font-semibold text-[#f3f6ff]">{adminCtx.ownerName}</span>'s unit as
                an admin. It stays credited to them.
              </>
            )}
          </p>
        </div>
      )}

      {/* ── Details ── */}
      <EnhancedCard padding="lg">
        <h3 className="text-sm font-bold text-[#f3f6ff] mb-1">{ar ? 'تفاصيل المرحلة' : 'Unit details'}</h3>
        <p className="text-xs text-[#8592ad] mb-4">
          {ar
            ? 'تجمع المرحلة دروسا مرتبة في المسار الذي يراه الطلاب في صفحة الشبكات.'
            : 'A unit groups lessons, in order, into the path students see on the Networking page.'}
        </p>
        <div className="space-y-4">
          <BilingualInput
            labelEn="Title (English)"
            labelAr="العنوان (العربية)"
            valueEn={titleEn}
            valueAr={titleAr}
            onChangeEn={setTitleEn}
            onChangeAr={setTitleAr}
            placeholder="How data moves"
            required
          />
          <BilingualInput
            labelEn="Description (English)"
            labelAr="الوصف (العربية)"
            valueEn={descEn}
            valueAr={descAr}
            onChangeEn={setDescEn}
            onChangeAr={setDescAr}
            placeholder="One line on what this unit covers."
            multiline
          />
          <div className="max-w-xs">
            <label className="block text-xs font-semibold text-[#9aa5bf] mb-1.5">
              {ar ? 'الترتيب في الصفحة' : 'Position on the page'}
            </label>
            <input
              type="number"
              min={1}
              step={1}
              value={order}
              onChange={(e) => setOrder(Number(e.target.value))}
              className={inputCls}
              dir="ltr"
            />
            <p className="mt-1.5 text-[11px] text-[#8592ad]">
              {ar
                ? 'الأصغر يظهر أولا. المراحل المنشورة تُرقّم بالتسلسل.'
                : 'Lowest shows first. Published units are numbered in this order.'}
            </p>
          </div>
        </div>
      </EnhancedCard>

      {/* ── Builder ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lessons to pick from */}
        <EnhancedCard padding="none" className="overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#263248] bg-[#0b1019] flex items-center justify-between gap-3">
            <span className="text-sm font-bold text-[#f3f6ff]">{ar ? 'الدروس' : 'Lessons'}</span>
            <div className="relative">
              <Search size={13} className="absolute start-2.5 top-1/2 -translate-y-1/2 text-[#7c8aa6]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={ar ? 'بحث...' : 'Search...'}
                className="w-40 bg-[#0a0f18] border border-[#263248] rounded-lg ps-8 pe-3 py-1.5 text-xs text-[#d2d7e3] focus:outline-none focus:border-[#00a859]/50 placeholder:text-[#7c8aa6]"
              />
            </div>
          </div>
          <div className="max-h-[460px] overflow-y-auto custom-scrollbar p-3 space-y-1.5">
            {filtered.length === 0 ? (
              <p className="text-sm text-[#8592ad] text-center py-8">
                {pickable.length === 0
                  ? ar
                    ? 'لا توجد دروس شبكات بعد. أنشئ درسا أولا.'
                    : 'There are no networking lessons yet. Write one first.'
                  : ar
                    ? 'لا نتائج.'
                    : 'No matching lessons.'}
              </p>
            ) : (
              filtered.map(({ lesson, status: lessonStatus }) => {
                const added = lessonIds.includes(lesson.id);
                const elsewhere = listedIn(lesson.id);
                return (
                  <button
                    key={lesson.id}
                    type="button"
                    onClick={() => add(lesson.id)}
                    disabled={added}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-start transition-all ${
                      added
                        ? 'border-[#263248] bg-[#0d1117] opacity-60 cursor-default'
                        : 'border-[#263248] bg-[#0d1117] hover:border-[#354562] hover:bg-[#121a2a]'
                    }`}
                  >
                    <span className="flex-1 min-w-0">
                      <span className="block text-xs font-semibold text-[#d2d7e3] truncate">
                        {lesson.title[lang] || lesson.title.en || (ar ? 'بلا عنوان' : 'Untitled')}
                      </span>
                      <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-[#8592ad]">
                        <span className="inline-flex items-center gap-1" dir="ltr">
                          <Clock size={10} /> {lesson.estimatedMinutes}m
                        </span>
                        <AuthorChip credit={creditOf(lesson)} className="max-w-[10rem]" />
                        {elsewhere && (
                          <span className="text-[#f3a43a]">
                            {ar ? 'في مرحلة: ' : 'In unit: '}
                            {elsewhere.title[lang] || elsewhere.title.en}
                          </span>
                        )}
                      </span>
                    </span>
                    {lessonStatus !== 'published' && <StatusBadge status={lessonStatus} />}
                    {added ? (
                      <Check size={14} className="text-[#00a859] flex-shrink-0" />
                    ) : (
                      <Plus size={14} className="text-[#8592ad] flex-shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </EnhancedCard>

        {/* The unit, in order */}
        <EnhancedCard padding="none" className="overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#263248] bg-[#0b1019] flex items-center justify-between">
            <span className="text-sm font-bold text-[#f3f6ff] flex items-center gap-2">
              <ListOrdered size={15} className="text-[#60a5fa]" /> {ar ? 'في هذه المرحلة' : 'In this unit'}
            </span>
            <span className="text-xs text-[#8592ad]" dir="ltr">
              {lessonIds.length}
            </span>
          </div>
          <div className="max-h-[460px] overflow-y-auto custom-scrollbar p-3">
            {lessonIds.length === 0 ? (
              <p className="text-sm text-[#8592ad] text-center py-12 px-4">
                {ar ? 'اختر الدروس من القائمة لتكوين المرحلة.' : 'Pick lessons from the list to build the unit.'}
              </p>
            ) : (
              <div className="space-y-2">
                {lessonIds.map((lessonId, idx) => {
                  const entry = pickableById.get(lessonId);
                  return (
                    <div
                      key={lessonId}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-[#263248] bg-[#0d1117]"
                    >
                      <span
                        className="w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold flex-shrink-0 bg-[#60a5fa]/10 text-[#60a5fa] border border-[#60a5fa]/25"
                        dir="ltr"
                      >
                        {idx + 1}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-xs font-semibold text-[#d2d7e3] truncate">
                          {entry
                            ? entry.lesson.title[lang] || entry.lesson.title.en
                            : ar
                              ? 'درس لم يعد متاحا'
                              : 'A lesson that is no longer available'}
                        </span>
                        {entry && entry.status !== 'published' && (
                          <span className="block text-[10px] text-[#f3a43a]">
                            {ar ? 'لن يراه الطلاب حتى يُنشر.' : "Students won't see it until it's published."}
                          </span>
                        )}
                      </span>
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => move(idx, -1)}
                          disabled={idx === 0}
                          aria-label={ar ? 'تحريك للأعلى' : 'Move up'}
                          className="w-6 h-6 touch:w-10 touch:h-10 flex items-center justify-center rounded text-[#8592ad] hover:text-[#d2d7e3] hover:bg-[#182235] transition-all disabled:opacity-20"
                        >
                          <ArrowUp size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => move(idx, 1)}
                          disabled={idx === lessonIds.length - 1}
                          aria-label={ar ? 'تحريك للأسفل' : 'Move down'}
                          className="w-6 h-6 touch:w-10 touch:h-10 flex items-center justify-center rounded text-[#8592ad] hover:text-[#d2d7e3] hover:bg-[#182235] transition-all disabled:opacity-20"
                        >
                          <ArrowDown size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(idx)}
                          aria-label={ar ? 'إزالة' : 'Remove'}
                          className="w-6 h-6 touch:w-10 touch:h-10 flex items-center justify-center rounded text-[#8592ad] hover:text-red-400 hover:bg-red-500/10 transition-all"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </EnhancedCard>
      </div>

      {/* ── What students will see ── */}
      <EnhancedCard padding="lg">
        <div className="flex items-center gap-2 mb-1">
          <Eye size={15} className="text-[#60a5fa]" />
          <h3 className="text-sm font-bold text-[#f3f6ff]">{ar ? 'معاينة الطالب' : 'Student preview'}</h3>
        </div>
        <p className="text-xs text-[#8592ad] mb-5">
          {ar
            ? 'هكذا تظهر المرحلة في صفحة الشبكات، بالبطاقات نفسها.'
            : 'How the unit sits on the Networking page, with the same cards.'}
        </p>
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#60a5fa]">
          {ar ? `المرحلة ${previewNumber}` : `Unit ${previewNumber}`}
        </p>
        <h4 className="mt-0.5 text-lg font-bold text-[#f3f6ff]">
          {(ar ? titleAr : titleEn) || titleEn || (ar ? 'مرحلة بلا عنوان' : 'Untitled unit')}
        </h4>
        {((ar ? descAr : descEn) || descEn) && (
          <p className="mt-1 mb-4 text-sm text-[#9aa5bf]">{(ar ? descAr : descEn) || descEn}</p>
        )}
        {previewLessons.length === 0 ? (
          <p className="mt-4 text-sm text-[#8592ad]">
            {ar ? 'أضف دروسا لمعاينة المرحلة.' : 'Add lessons to preview the unit.'}
          </p>
        ) : (
          /* A picture of the page, not a way into it: clicking a card here
             would leave the editor with unsaved work. */
          <div inert className="pointer-events-none mt-4 grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {previewLessons.map((lesson, i) => (
              <NetworkingLessonCard
                key={lesson.id}
                lesson={lesson}
                index={Math.min(i, 8)}
                position={`${previewNumber}.${i + 1}`}
              />
            ))}
          </div>
        )}
      </EnhancedCard>
    </CreatorLayout>
  );
};

export default NetworkingUnitEditor;
