import React, { useEffect, useState } from 'react';
import { GraduationCap, Plus, Pencil, Trash2, Check, X, RefreshCw, Users } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import EnhancedCard from '../../components/ui/EnhancedCard';
import { confirmDialog } from '../../components/ui/ConfirmHost';
import { useToast } from '../../hooks/useToast';
import { useLang } from '../../contexts/LangContext';
import { api } from '../../services/api';
import { refreshUniversities, type ManagedUniversity } from '../../services/universities';
import {
  BUILTIN_UNIVERSITIES,
  UNIVERSITY_NAME_MAX,
  UNIVERSITY_NAME_MIN,
  cleanUniversityName,
  universityKey,
  universityNameProblem,
} from '../../backend/src/shared/universities';

type UniType = 'public' | 'private';

interface Draft {
  name: string;
  ar: string;
  type: UniType;
}

const EMPTY: Draft = { name: '', ar: '', type: 'public' };

const inputCls =
  'w-full bg-[#0e1522] border border-[#263248] rounded-lg px-3 py-2.5 text-sm text-[#f3f6ff] placeholder:text-[#7c8aa6] focus:outline-none focus:border-[#00a859]/50 transition-colors';

/**
 * Admin page for the universities members pick from. The Iraqi list ships
 * with the Academy; this is where the ones it misses are added, corrected and
 * taken off again, so a missing university is a form and not a code change.
 */
const UniversitiesPage: React.FC = () => {
  const { lang } = useLang();
  const { toast, ToastContainer } = useToast();
  const ar = lang === 'ar';

  const [list, setList] = useState<ManagedUniversity[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [addError, setAddError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  /** The row being corrected, and what has been typed into it. */
  const [editId, setEditId] = useState<string | null>(null);
  const [edit, setEdit] = useState<Draft>(EMPTY);
  const [editError, setEditError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const typeLabel = (type: UniType) =>
    type === 'public' ? (ar ? 'حكومية' : 'Public') : ar ? 'أهلية' : 'Private';

  const load = async () => {
    setLoading(true);
    try {
      const { universities } = await api.get<{ universities: ManagedUniversity[] }>('/universities/manage');
      setList(universities);
    } catch {
      toast('error', ar ? 'تعذر تحميل الجامعات.' : 'Could not load universities.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Why a name cannot be used, in words, or null when it can. `selfId` is the
     row being corrected, which may keep its own name. The server checks the
     same things; this only saves the admin a round trip. */
  const nameProblem = (name: string, selfId?: string): string | null => {
    const problem = universityNameProblem(name);
    if (problem === 'short') {
      return ar
        ? `الاسم يحتاج ${UNIVERSITY_NAME_MIN} أحرف على الأقل.`
        : `A name needs at least ${UNIVERSITY_NAME_MIN} characters.`;
    }
    if (problem === 'long') {
      return ar
        ? `الاسم لا يتجاوز ${UNIVERSITY_NAME_MAX} حرفًا.`
        : `A name can be at most ${UNIVERSITY_NAME_MAX} characters.`;
    }
    if (problem === 'reserved') return ar ? 'هذا الاسم محجوز.' : 'That name is reserved.';
    if (problem === 'builtin') {
      return ar
        ? 'هذه الجامعة موجودة في القائمة الأساسية، ويمكن للأعضاء اختيارها الآن.'
        : 'That university is already on the built-in list, so members can pick it now.';
    }
    const key = universityKey(name);
    if (list.some((u) => u.id !== selfId && universityKey(u.name) === key)) {
      return ar ? 'سبقت إضافة هذه الجامعة.' : 'That university has already been added.';
    }
    return null;
  };

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const problem = nameProblem(draft.name);
    if (problem) {
      setAddError(problem);
      return;
    }
    setAdding(true);
    setAddError(null);
    try {
      const { university } = await api.post<{ university: ManagedUniversity }>('/universities', {
        name: cleanUniversityName(draft.name),
        ar: cleanUniversityName(draft.ar),
        type: draft.type,
      });
      setList((prev) => [...prev, university].sort((a, b) => a.name.localeCompare(b.name)));
      setDraft(EMPTY);
      void refreshUniversities(true);
      toast('success', ar ? `أُضيفت ${university.name}.` : `${university.name} was added.`);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : ar ? 'تعذرت الإضافة.' : 'Could not add it.');
    } finally {
      setAdding(false);
    }
  };

  const startEdit = (u: ManagedUniversity) => {
    setEditId(u.id);
    setEdit({ name: u.name, ar: u.ar ?? '', type: u.type });
    setEditError(null);
  };

  const saveEdit = async (u: ManagedUniversity) => {
    const problem = nameProblem(edit.name, u.id);
    if (problem) {
      setEditError(problem);
      return;
    }
    setSavingId(u.id);
    setEditError(null);
    try {
      const { university, moved } = await api.patch<{ university: ManagedUniversity; moved: number }>(
        `/universities/${u.id}`,
        { name: cleanUniversityName(edit.name), ar: cleanUniversityName(edit.ar), type: edit.type }
      );
      setList((prev) =>
        prev.map((x) => (x.id === university.id ? university : x)).sort((a, b) => a.name.localeCompare(b.name))
      );
      setEditId(null);
      void refreshUniversities(true);
      toast(
        'success',
        moved > 0
          ? ar
            ? `تم الحفظ، وانتقل معها ${moved} من الأعضاء.`
            : `Saved, and ${moved} ${moved === 1 ? 'member' : 'members'} moved with it.`
          : ar
          ? 'تم الحفظ.'
          : 'Saved.'
      );
    } catch (err) {
      setEditError(err instanceof Error ? err.message : ar ? 'تعذر الحفظ.' : 'Could not save.');
    } finally {
      setSavingId(null);
    }
  };

  const remove = async (u: ManagedUniversity) => {
    const ok = await confirmDialog({
      title: ar ? `إزالة ${u.name}؟` : `Remove ${u.name}?`,
      message: ar
        ? 'لن تظهر بعد الآن في قائمة الاختيار. الأعضاء الذين اختاروها يحتفظون بها في ملفاتهم وعلى لوحة المتصدرين.'
        : 'It will no longer be offered in the list. Members who already chose it keep it on their profile and on the leaderboard.',
      confirmLabel: ar ? 'إزالة' : 'Remove',
      tone: 'danger',
    });
    if (!ok) return;
    setSavingId(u.id);
    try {
      await api.delete(`/universities/${u.id}`);
      setList((prev) => prev.filter((x) => x.id !== u.id));
      if (editId === u.id) setEditId(null);
      void refreshUniversities(true);
      toast('success', ar ? `أُزيلت ${u.name}.` : `${u.name} was removed.`);
    } catch (err) {
      toast('error', err instanceof Error ? err.message : ar ? 'تعذرت الإزالة.' : 'Could not remove it.');
    } finally {
      setSavingId(null);
    }
  };

  const typeSelect = (value: UniType, onChange: (type: UniType) => void, label: string) => (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value as UniType)}
      className="min-h-11 w-full bg-[#0e1522] border border-[#263248] rounded-lg px-3 py-2 text-sm font-semibold text-[#d2d7e3] focus:outline-none focus:border-[#00a859]/50 transition-colors cursor-pointer"
    >
      <option value="public">{typeLabel('public')}</option>
      <option value="private">{typeLabel('private')}</option>
    </select>
  );

  return (
    <div className="space-y-6">
      <ToastContainer />
      <PageHeader
        iconNode={<GraduationCap size={38} strokeWidth={1.7} className="flex-shrink-0 text-[#9fef00]" />}
        title={ar ? 'الجامعات' : 'Universities'}
        subtitle={
          ar
            ? 'أضف الجامعات التي يختار منها الأعضاء في ملفاتهم، إلى جانب القائمة الأساسية.'
            : 'Add universities members can pick on their profile, beside the built-in list.'
        }
      />

      {/* ── Add ── */}
      <EnhancedCard padding="lg">
        <form onSubmit={(e) => void add(e)} className="space-y-4">
          <p className="flex items-center gap-2 text-sm font-bold text-[#f3f6ff]">
            <Plus size={15} className="text-[#00a859]" />
            {ar ? 'إضافة جامعة' : 'Add a university'}
          </p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_9rem]">
            <label className="block min-w-0">
              <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#8592ad]">
                {ar ? 'الاسم بالإنجليزية' : 'Name in English'}
              </span>
              <input
                dir="ltr"
                value={draft.name}
                maxLength={UNIVERSITY_NAME_MAX}
                onChange={(e) => {
                  setDraft((d) => ({ ...d, name: e.target.value }));
                  setAddError(null);
                }}
                placeholder="University of Example"
                className={inputCls}
              />
            </label>
            <label className="block min-w-0">
              <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#8592ad]">
                {ar ? 'الاسم بالعربية (اختياري)' : 'Name in Arabic (optional)'}
              </span>
              <input
                dir="rtl"
                value={draft.ar}
                maxLength={UNIVERSITY_NAME_MAX}
                onChange={(e) => setDraft((d) => ({ ...d, ar: e.target.value }))}
                placeholder="جامعة المثال"
                className={inputCls}
              />
            </label>
            <label className="block min-w-0">
              <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#8592ad]">
                {ar ? 'النوع' : 'Type'}
              </span>
              {typeSelect(draft.type, (type) => setDraft((d) => ({ ...d, type })), ar ? 'النوع' : 'Type')}
            </label>
          </div>
          {addError && (
            <p role="alert" className="text-xs text-red-400">
              {addError}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={adding || !draft.name.trim()}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#00a859] px-4 py-2 text-xs font-bold text-[#0d1117] transition-colors hover:bg-[#00934e] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={14} />
              {adding ? (ar ? 'جارٍ الإضافة...' : 'Adding...') : ar ? 'إضافة' : 'Add'}
            </button>
            <p className="text-[11px] leading-relaxed text-[#8592ad]">
              {ar
                ? 'الاسم الإنجليزي هو ما يُحفظ في ملف العضو، ويظهر الاسم العربي لمن يتصفح بالعربية.'
                : "The English name is what a member's profile stores. The Arabic one is shown to members reading in Arabic."}
            </p>
          </div>
        </form>
      </EnhancedCard>

      {/* ── Added so far ── */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-[#f3f6ff]">
          {ar ? 'الجامعات المضافة' : 'Added universities'}{' '}
          <span className="font-normal text-[#8592ad]" dir="ltr">
            ({list.length})
          </span>
        </p>
        <button
          onClick={() => void load()}
          className="w-11 h-11 rounded-lg bg-[#121a2a] border border-[#263248] flex items-center justify-center text-[#8390ac] hover:text-[#00a859] hover:border-[#00a859]/40 transition-all flex-shrink-0"
          title={ar ? 'تحديث' : 'Refresh'}
          aria-label={ar ? 'تحديث' : 'Refresh'}
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading ? (
        <EnhancedCard padding="xl" className="text-center">
          <p className="text-sm text-[#8592ad]">{ar ? 'جارٍ التحميل...' : 'Loading universities...'}</p>
        </EnhancedCard>
      ) : list.length === 0 ? (
        <EnhancedCard padding="xl" className="text-center">
          <p className="text-sm text-[#8592ad]">
            {ar ? 'لم تُضف أي جامعة بعد.' : 'No universities added yet.'}
          </p>
        </EnhancedCard>
      ) : (
        <EnhancedCard padding="none" className="overflow-hidden">
          <div className="divide-y divide-[#263248]/60">
            {list.map((u) =>
              editId === u.id ? (
                <div key={u.id} className="space-y-3 bg-[#0b1019] px-4 py-4 sm:px-5">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_9rem]">
                    <input
                      dir="ltr"
                      aria-label={ar ? 'الاسم بالإنجليزية' : 'Name in English'}
                      value={edit.name}
                      maxLength={UNIVERSITY_NAME_MAX}
                      onChange={(e) => {
                        setEdit((d) => ({ ...d, name: e.target.value }));
                        setEditError(null);
                      }}
                      className={inputCls}
                    />
                    <input
                      dir="rtl"
                      aria-label={ar ? 'الاسم بالعربية' : 'Name in Arabic'}
                      value={edit.ar}
                      maxLength={UNIVERSITY_NAME_MAX}
                      onChange={(e) => setEdit((d) => ({ ...d, ar: e.target.value }))}
                      className={inputCls}
                    />
                    {typeSelect(edit.type, (type) => setEdit((d) => ({ ...d, type })), ar ? 'النوع' : 'Type')}
                  </div>
                  {u.members > 0 && cleanUniversityName(edit.name) !== u.name && (
                    <p className="text-[11px] leading-relaxed text-[#8592ad]">
                      {ar ? (
                        <>
                          تغيير الاسم ينقل معه الأعضاء الذين اختاروها، وعددهم <span dir="ltr">{u.members}</span>.
                        </>
                      ) : (
                        `Renaming it moves the ${u.members} ${u.members === 1 ? 'member' : 'members'} who chose it.`
                      )}
                    </p>
                  )}
                  {editError && (
                    <p role="alert" className="text-xs text-red-400">
                      {editError}
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => void saveEdit(u)}
                      disabled={savingId === u.id || !edit.name.trim()}
                      className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-[#00a859] px-4 py-2 text-xs font-bold text-[#0d1117] transition-colors hover:bg-[#00934e] disabled:opacity-50"
                    >
                      <Check size={13} />
                      {savingId === u.id ? (ar ? 'جارٍ الحفظ...' : 'Saving...') : ar ? 'حفظ' : 'Save'}
                    </button>
                    <button
                      onClick={() => setEditId(null)}
                      className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold text-[#9aa5bf] transition-colors hover:text-[#d2d7e3]"
                    >
                      <X size={13} />
                      {ar ? 'إلغاء' : 'Cancel'}
                    </button>
                  </div>
                </div>
              ) : (
                <div key={u.id} className="flex flex-wrap items-center gap-3 px-4 py-4 sm:px-5">
                  <GraduationCap size={17} className="flex-shrink-0 text-[#8592ad]" />
                  <div className="min-w-0 flex-1 basis-48">
                    {/* Each name keeps its own direction on an inner span, so the
                        lines still start at the page's edge in either language. */}
                    <p className="break-words text-sm font-semibold text-[#f3f6ff]">
                      <span dir="ltr">{u.name}</span>
                    </p>
                    {u.ar && (
                      <p className="break-words text-xs text-[#9aa5bf]">
                        <span dir="rtl">{u.ar}</span>
                      </p>
                    )}
                  </div>
                  <span className="flex-shrink-0 rounded-full border border-[#263248] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#8592ad]">
                    {typeLabel(u.type)}
                  </span>
                  <span
                    className="inline-flex flex-shrink-0 items-center gap-1.5 text-xs text-[#9aa5bf]"
                    title={ar ? 'أعضاء اختاروها' : 'Members who chose it'}
                  >
                    <Users size={13} className="text-[#8592ad]" />
                    <span dir="ltr">{u.members}</span>
                    <span className="sr-only">{ar ? 'أعضاء اختاروها' : 'members chose it'}</span>
                  </span>
                  <div className="flex flex-shrink-0 items-center gap-2">
                    <button
                      onClick={() => startEdit(u)}
                      disabled={savingId === u.id}
                      title={ar ? 'تعديل' : 'Edit'}
                      aria-label={ar ? `تعديل ${u.name}` : `Edit ${u.name}`}
                      className="w-8 h-8 touch:w-11 touch:h-11 rounded-lg border border-[#263248] flex items-center justify-center text-[#8592ad] transition-all hover:text-[#00a859] hover:border-[#00a859]/40 hover:bg-[#00a859]/10 disabled:opacity-30"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => void remove(u)}
                      disabled={savingId === u.id}
                      title={ar ? 'إزالة' : 'Remove'}
                      aria-label={ar ? `إزالة ${u.name}` : `Remove ${u.name}`}
                      className="w-8 h-8 touch:w-11 touch:h-11 rounded-lg border border-[#263248] flex items-center justify-center text-[#8592ad] transition-all hover:text-red-400 hover:border-red-500/40 hover:bg-red-500/10 disabled:opacity-30"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        </EnhancedCard>
      )}

      <p className="text-[11px] leading-relaxed text-[#8592ad]">
        {ar ? (
          <>
            القائمة الأساسية فيها <span dir="ltr">{BUILTIN_UNIVERSITIES.length}</span> جامعة عراقية، وهي متاحة
            دائمًا. ما تضيفه هنا يظهر للأعضاء بعدها في القائمة نفسها.
          </>
        ) : (
          `The built-in list has ${BUILTIN_UNIVERSITIES.length} Iraqi universities and is always offered. What you add here appears after them in the same list.`
        )}
      </p>
    </div>
  );
};

export default UniversitiesPage;
