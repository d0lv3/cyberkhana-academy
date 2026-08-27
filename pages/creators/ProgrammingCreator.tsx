import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit3, Trash2, BookOpen, Trophy, ChevronDown, ChevronRight, Eye, EyeOff, Image, Lock, ShieldCheck, Code, Layers, User, Users } from 'lucide-react';
import EnhancedCard from '../../components/ui/EnhancedCard';
import Button from '../../components/ui/EnhancedButton';
import CreatorLayout from '../../components/creators/CreatorLayout';
import StatusBadge from '../../components/creators/StatusBadge';
import CoverImageUploader from '../../components/creators/CoverImageUploader';
import { confirmDialog } from '../../components/ui/ConfirmHost';
import { useLang } from '../../contexts/LangContext';
import { useAuth } from '../../contexts/AuthContext';
import { hasPerm } from '../../services/permissions';
import { getProgrammingLanguages } from '../../data/programming';
import {
  getCreatorProgrammingPatches,
  getCreatorLanguages,
  deleteProgrammingLanguage,
  deleteProgrammingConcept,
  deleteProgrammingModule,
  saveProgrammingModule,
  saveProgrammingLanguage,
  saveProgrammingLanguageCoverSvg,
  fetchAllModeratableProgrammingForAdmin,
  type AdminProgrammingPatch,
} from '../../services/creatorDataService';
import {
  statusOf,
  type CreatorMeta,
  type CreatorProgrammingConcept,
  type CreatorProgrammingLanguage,
} from '../../services/creatorTypes';
import type { ProgrammingConcept, ProgrammingLanguage, ProgrammingModule } from '../../data/programming/types';
import { ADMIN_PROGRAMMING_STASH, type AdminProgrammingStash } from './programmingEditStash';
import { ownerLabel } from './ownerLabel';
import ShareTab from '../../components/creators/ShareTab';
import {
  fetchSharedWithMe,
  saveSharedProgramming,
  deleteSharedProgramming,
  BUCKET_LABEL,
  type CollabPerson,
} from '../../services/collabService';
import type { ProgrammingPatch } from '../../services/creatorTypes';

type DisplayModule = ProgrammingModule & Partial<CreatorMeta>;

/** An entry in someone else's published patch, with the owner resolved. */
interface ForeignEntry<T> {
  ownerId: string;
  ownerName: string;
  languageSlug: string;
  moduleSlug?: string;
  item: T;
}

/** One line in the admin's "all published programming content" list. */
type PublishedRow =
  | { kind: 'language'; entry: ForeignEntry<CreatorProgrammingLanguage> }
  | { kind: 'module'; entry: ForeignEntry<DisplayModule> }
  | { kind: 'concept'; entry: ForeignEntry<CreatorProgrammingConcept> };

/** Display title for a row — languages carry a name, the rest carry a title. */
const titleOf = (row: PublishedRow): string =>
  row.kind === 'language' ? row.entry.item.name : row.entry.item.title.en || '';

/** Short glyph drawn on the language card art. Matches LanguageCard. */
const glyphFor = (l: Pick<ProgrammingLanguage, 'slug' | 'name'>): string =>
  l.slug === 'python' ? 'Py' : l.slug === 'c' ? 'C' : l.slug === 'cpp' ? 'C++' : l.slug === 'bash' ? '$_' : l.name.slice(0, 2);

const ProgrammingCreator: React.FC = () => {
  const navigate = useNavigate();
  const { t, lang: uiLang } = useLang();
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [coverOpen, setCoverOpen] = useState<Record<string, boolean>>({});

  // Capability gates — the admin grants these per creator.
  const canProgramming = hasPerm(user, 'programming');
  const canLanguages = hasPerm(user, 'programming-languages');
  const isAdmin = user?.role === 'admin';

  const patches = getCreatorProgrammingPatches();

  /* ── Admin: every published programming item on the platform ──
   * Two jobs. The flat list at the bottom of the page is the "see everything"
   * view, mirroring OS Modules — this admin's own published work included, so
   * there is one place that shows what is actually live. The id-keyed maps put
   * the owner back on the catalog rows above, since the merge collapses every
   * author's patches into one list that otherwise carries no owner. */
  const [publishedPatches, setPublishedPatches] = useState<AdminProgrammingPatch[]>([]);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;

    fetchAllModeratableProgrammingForAdmin()
      .then((patches) => {
        if (!cancelled) setPublishedPatches(patches);
      })
      .catch(() => {
        if (!cancelled) setPublishedPatches([]);
      });

    return () => {
      cancelled = true;
    };
  }, [isAdmin, refreshKey]);

  const { foreignModules, foreignConcepts, publishedRows } = useMemo(() => {
    const mods = new Map<string, ForeignEntry<DisplayModule>>();
    const concepts = new Map<string, ForeignEntry<CreatorProgrammingConcept>>();
    const rows: PublishedRow[] = [];

    for (const patch of publishedPatches) {
      const owner = { ownerId: patch._ownerId, ownerName: patch._ownerName };
      const languageSlug = patch.languageSlug;

      if (patch.newLanguage) {
        rows.push({ kind: 'language', entry: { ...owner, languageSlug, item: patch.newLanguage } });
      }
      for (const mod of patch.newModules ?? []) {
        const entry = { ...owner, languageSlug, item: mod };
        mods.set(mod.id, entry);
        rows.push({ kind: 'module', entry });
      }
      for (const [moduleSlug, list] of Object.entries(patch.newConcepts ?? {})) {
        for (const concept of list) {
          const entry = { ...owner, languageSlug, moduleSlug, item: concept };
          concepts.set(concept.id, entry);
          rows.push({ kind: 'concept', entry });
        }
      }
    }

    // Anything awaiting review floats to the top — that is the queue an admin
    // opened this page to work through, and it would otherwise be scattered
    // among the far more numerous published rows. Below it, group by language,
    // then languages/modules before the lessons inside them.
    const rank = { language: 0, module: 1, concept: 2 } as const;
    const pending = (r: PublishedRow) => (statusOf(r.entry.item) === 'in_review' ? 0 : 1);
    rows.sort(
      (a, b) =>
        pending(a) - pending(b) ||
        a.entry.languageSlug.localeCompare(b.entry.languageSlug) ||
        rank[a.kind] - rank[b.kind] ||
        titleOf(a).localeCompare(titleOf(b))
    );

    return { foreignModules: mods, foreignConcepts: concepts, publishedRows: rows };
  }, [publishedPatches]);

  const otherAuthorCount = publishedRows.filter((r) => r.entry.ownerId !== user?._id).length;

  /* ── Programming content another creator has shared with me ──
   * Patches are nested rather than id-keyed, so this flattens them into the
   * same language / module / lesson rows the admin list uses. */
  const [sharedPatches, setSharedPatches] = useState<
    { grantId: string; owner: CollabPerson | null; patches: ProgrammingPatch[] }[]
  >([]);

  const loadShared = useCallback(() => {
    fetchSharedWithMe<ProgrammingPatch>()
      .then((buckets) =>
        setSharedPatches(
          buckets
            .filter((b) => b.bucket === 'programming-patches')
            .map((b) => ({ grantId: b.grantId, owner: b.owner, patches: b.items }))
        )
      )
      .catch(() => setSharedPatches([]));
  }, []);
  useEffect(loadShared, [loadShared, refreshKey]);

  const sharedGroups = useMemo(
    () =>
      sharedPatches.map((group) => {
        const rows: PublishedRow[] = [];
        const ownerId = group.owner?.id ?? '';
        const ownerName = group.owner?.displayName ?? '';
        for (const patch of group.patches) {
          const base = { ownerId, ownerName, languageSlug: patch.languageSlug };
          if (patch.newLanguage) rows.push({ kind: 'language', entry: { ...base, item: patch.newLanguage } });
          for (const mod of patch.newModules ?? []) rows.push({ kind: 'module', entry: { ...base, item: mod } });
          for (const [moduleSlug, list] of Object.entries(patch.newConcepts ?? {})) {
            for (const concept of list) {
              rows.push({ kind: 'concept', entry: { ...base, moduleSlug, item: concept } });
            }
          }
        }
        const rank = { language: 0, module: 1, concept: 2 } as const;
        rows.sort(
          (a, b) =>
            a.entry.languageSlug.localeCompare(b.entry.languageSlug) ||
            rank[a.kind] - rank[b.kind] ||
            titleOf(a).localeCompare(titleOf(b))
        );
        return { ...group, rows };
      }),
    [sharedPatches]
  );

  /** Open a shared row in its editor, writing back to the owner's patch. */
  const editSharedRow = (row: PublishedRow) => {
    const { entry } = row;
    if (row.kind === 'language') {
      stashAdminEdit({ kind: 'language', ownerId: entry.ownerId, ownerName: entry.ownerName, languageSlug: entry.languageSlug, item: row.entry.item });
      navigate(`/creators/programming/edit-language/${entry.languageSlug}?shared=1`);
      return;
    }
    if (row.kind === 'module') {
      stashAdminEdit({ kind: 'module', ownerId: entry.ownerId, ownerName: entry.ownerName, languageSlug: entry.languageSlug, item: row.entry.item });
      navigate(`/creators/programming/edit-module/${entry.languageSlug}/${row.entry.item.id}?shared=1`);
      return;
    }
    stashAdminEdit({
      kind: 'concept',
      ownerId: entry.ownerId,
      ownerName: entry.ownerName,
      languageSlug: entry.languageSlug,
      moduleSlug: row.entry.moduleSlug!,
      item: row.entry.item,
    });
    navigate(
      `/creators/programming/${entry.languageSlug}/${row.entry.moduleSlug}/${row.entry.item.slug}?shared=1`
    );
  };

  const toggleSharedRowPublish = async (row: PublishedRow) => {
    const { entry } = row;
    const next = statusOf(entry.item) === 'published' ? 'draft' : 'published';
    await saveSharedProgramming({
      ownerId: entry.ownerId,
      languageSlug: entry.languageSlug,
      kind: row.kind,
      moduleSlug: entry.moduleSlug,
      item: { ...entry.item, status: next, isPublished: next === 'published', updatedAt: new Date().toISOString() },
    });
    setRefreshKey((k) => k + 1);
  };

  const deleteSharedRow = async (row: PublishedRow) => {
    const { entry } = row;
    const ok = await confirmDialog({
      title: uiLang === 'ar' ? 'حذف من محتوى مالكه؟' : "Delete from its owner's content?",
      message:
        row.kind === 'language'
          ? uiLang === 'ar'
            ? 'ستُحذف هذه اللغة وكل وحداتها ودروسها نهائيًا.'
            : 'This language and ALL of its modules and lessons will be permanently removed.'
          : row.kind === 'module'
            ? uiLang === 'ar'
              ? 'ستُحذف هذه الوحدة وكل دروسها نهائيًا.'
              : 'This module and all of its lessons will be permanently removed.'
            : uiLang === 'ar'
              ? 'سيُحذف هذا الدرس نهائيًا.'
              : 'This lesson will be permanently removed.',
      confirmLabel: t('studio.delete'),
    });
    if (!ok) return;
    await deleteSharedProgramming({
      ownerId: entry.ownerId,
      languageSlug: entry.languageSlug,
      kind: row.kind,
      moduleSlug: entry.moduleSlug,
      itemId: row.kind === 'language' ? undefined : (entry.item as { id: string }).id,
    });
    setRefreshKey((k) => k + 1);
  };

  // Catalog languages (static + published creator languages) + my own DRAFT
  // languages, which the public merge hides until published.
  const publishedLanguages = getProgrammingLanguages();
  const listedSlugs = new Set(publishedLanguages.map((l) => l.slug));
  const draftLanguages: ProgrammingLanguage[] = getCreatorLanguages()
    .filter((d) => !listedSlugs.has(d.slug))
    .map((d) => ({
      id: d.slug,
      slug: d.slug,
      name: d.name,
      color: d.color || '#9fef00',
      available: true,
      description: d.description ?? { en: '', ar: '' },
      coverSvg: patches.find((p) => p.languageSlug === d.slug)?.languageCoverSvg,
      modules: [],
    }));
  const languages = [...publishedLanguages, ...draftLanguages];

  /** My own definition for this language, when I created it. */
  const ownLanguageDef = (slug: string) => patches.find((p) => p.languageSlug === slug)?.newLanguage;

  const handleToggleLanguagePublish = (slug: string) => {
    const def = ownLanguageDef(slug);
    if (!def) return;
    const next = statusOf(def) === 'published' ? 'draft' : 'published';
    saveProgrammingLanguage({ ...def, status: next, isPublished: next === 'published' });
    setRefreshKey((k) => k + 1);
  };

  const handleDeleteLanguage = async (slug: string, name: string) => {
    if (
      await confirmDialog({
        title: uiLang === 'ar' ? `حذف لغة ${name}؟` : `Delete ${name}?`,
        message:
          uiLang === 'ar'
            ? 'ستُحذف هذه اللغة وكل وحداتها ودروسها نهائيًا.'
            : 'This language and ALL of its modules and lessons will be permanently removed.',
        confirmLabel: t('studio.delete'),
      })
    ) {
      deleteProgrammingLanguage(slug);
      setRefreshKey((k) => k + 1);
    }
  };

  const toggleExpand = (key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleDeleteConcept = async (langSlug: string, modSlug: string, conceptId: string) => {
    if (
      await confirmDialog({
        title: uiLang === 'ar' ? 'حذف المفهوم؟' : 'Delete concept?',
        message:
          uiLang === 'ar'
            ? 'سيُحذف هذا الدرس/التحدي نهائيًا.'
            : 'This lesson/challenge will be permanently removed.',
        confirmLabel: t('studio.delete'),
      })
    ) {
      deleteProgrammingConcept(langSlug, modSlug, conceptId);
      setRefreshKey((k) => k + 1);
    }
  };

  const handleDeleteModule = async (langSlug: string, moduleId: string) => {
    if (
      await confirmDialog({
        title: uiLang === 'ar' ? 'حذف الوحدة؟' : 'Delete module?',
        message:
          uiLang === 'ar'
            ? 'ستُحذف هذه الوحدة وكل مفاهيمها نهائيًا.'
            : 'This module and all of its concepts will be permanently removed.',
        confirmLabel: t('studio.delete'),
      })
    ) {
      deleteProgrammingModule(langSlug, moduleId);
      setRefreshKey((k) => k + 1);
    }
  };

  // Get creator concepts for a given lang+module
  const getCreatorConcepts = (langSlug: string, moduleSlug: string) => {
    const patch = patches.find((p) => p.languageSlug === langSlug);
    return patch?.newConcepts[moduleSlug] || [];
  };

  // Check if a module is creator-made
  const isCreatorModule = (langSlug: string, moduleId: string) => {
    const patch = patches.find((p) => p.languageSlug === langSlug);
    return patch?.newModules.some((m) => m.id === moduleId) || false;
  };

  /** Is this concept in MY patches? (Then it edits through the normal path.) */
  const isOwnConcept = (langSlug: string, moduleSlug: string, conceptId: string) =>
    getCreatorConcepts(langSlug, moduleSlug).some((c) => c.id === conceptId);

  const stashAdminEdit = (stash: AdminProgrammingStash) => {
    sessionStorage.setItem(ADMIN_PROGRAMMING_STASH, JSON.stringify(stash));
  };

  /* ── Open a row in the right editing mode ──
   * mine → own bucket; another author's → admin in-place edit; neither → it's
   * built-in, so copy-on-write. Only admins ever reach the last two. */

  const editModule = (langSlug: string, mod: DisplayModule) => {
    if (isCreatorModule(langSlug, mod.id)) {
      navigate(`/creators/programming/edit-module/${langSlug}/${mod.id}`);
      return;
    }
    const foreign = foreignModules.get(mod.id);
    if (foreign) {
      stashAdminEdit({
        kind: 'module',
        ownerId: foreign.ownerId,
        ownerName: foreign.ownerName,
        languageSlug: foreign.languageSlug,
        item: foreign.item,
      });
      navigate(`/creators/programming/edit-module/${foreign.languageSlug}/${mod.id}?admin=1`);
      return;
    }
    navigate(`/creators/programming/edit-module/${langSlug}/${mod.id}?builtin=1`);
  };

  /** Open a published language: mine goes through the normal own-bucket editor
   * (local-first, so the cache stays in step); anyone else's goes through the
   * server-side admin edit. */
  const editForeignLanguage = (entry: ForeignEntry<CreatorProgrammingLanguage>) => {
    if (entry.ownerId === user?._id) {
      navigate(`/creators/programming/edit-language/${entry.languageSlug}`);
      return;
    }
    stashAdminEdit({
      kind: 'language',
      ownerId: entry.ownerId,
      ownerName: entry.ownerName,
      languageSlug: entry.languageSlug,
      item: entry.item,
    });
    navigate(`/creators/programming/edit-language/${entry.languageSlug}?admin=1`);
  };

  const editConcept = (langSlug: string, moduleSlug: string, concept: ProgrammingConcept) => {
    const base = `/creators/programming/${langSlug}/${moduleSlug}/${concept.slug}`;
    if (isOwnConcept(langSlug, moduleSlug, concept.id)) {
      navigate(base);
      return;
    }
    const foreign = foreignConcepts.get(concept.id);
    if (foreign) {
      stashAdminEdit({
        kind: 'concept',
        ownerId: foreign.ownerId,
        ownerName: foreign.ownerName,
        languageSlug: foreign.languageSlug,
        moduleSlug: foreign.moduleSlug ?? moduleSlug,
        item: foreign.item,
      });
      navigate(`${base}?admin=1`);
      return;
    }
    navigate(`${base}?builtin=1`);
  };

  // Modules to display in the studio: merged (published) + the creator's own
  // drafts (which the consumer merge hides until published).
  const getDisplayModules = (langSlug: string, mergedModules: ProgrammingModule[]): DisplayModule[] => {
    const patch = patches.find((p) => p.languageSlug === langSlug);
    const existingIds = new Set(mergedModules.map((m) => m.id));
    const drafts = (patch?.newModules ?? []).filter((m) => !existingIds.has(m.id));
    return [...mergedModules, ...drafts].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  };

  const handleToggleModulePublish = (langSlug: string, mod: any) => {
    const next = statusOf(mod) === 'published' ? 'draft' : 'published';
    saveProgrammingModule(langSlug, { ...mod, status: next, isPublished: next === 'published' });
    setRefreshKey((k) => k + 1);
  };

  const handleSaveCover = (langSlug: string, svg: string) => {
    saveProgrammingLanguageCoverSvg(langSlug, svg);
    setRefreshKey((k) => k + 1);
  };

  return (
    <CreatorLayout
      title={uiLang === 'ar' ? 'محتوى برمجي' : 'Programming Content'}
      backTo="/creators"
      backLabel={t('studio.contentStudio')}
    >
      <div className="space-y-6">
        {isAdmin && (
          <div className="flex items-start gap-3 rounded-lg border border-[#f3a43a]/30 bg-[#f3a43a]/10 px-4 py-3">
            <ShieldCheck size={16} className="text-[#f3a43a] mt-0.5 flex-shrink-0" />
            <div className="text-xs text-[#d2d7e3]">
              {uiLang === 'ar' ? (
                <>
                  <span className="font-bold text-[#f3a43a]">مشرف</span>، كل وحدة ودرس منشور أدناه
                  قابل للتعديل مهما كان مؤلفه
                  {otherAuthorCount > 0 ? ` (${otherAuthorCount} من مؤلفين آخرين)` : ''}. المحتوى المدمج
                  يُفتح بنسخ-عند-التعديل: أول حفظ ينشئ نسخة قابلة للتعديل تحل محل الأصل.
                </>
              ) : (
                <>
                  <span className="font-bold text-[#f3a43a]">Admin</span>, every published module
                  and lesson below is editable, whoever wrote it
                  {otherAuthorCount > 0 ? ` (${otherAuthorCount} by other authors)` : ''}. Built-in content
                  opens copy-on-write: the first save creates an editable copy that replaces the
                  original.
                </>
              )}
            </div>
          </div>
        )}

        {(canLanguages || canProgramming) && (
          <div className="flex justify-between items-start gap-4">
            <p className="text-sm text-[#9aa5bf] max-w-lg">
              {canLanguages
                ? uiLang === 'ar'
                  ? 'يمكنك إنشاء لغات برمجة جديدة في الكتالوج، ثم إضافة الوحدات والدروس إليها.'
                  : 'You can create new programming languages in the catalog, then fill them with modules and lessons.'
                : uiLang === 'ar'
                  ? 'أضف الوحدات والدروس إلى اللغات الموجودة.'
                  : 'Add modules and lessons to the existing languages.'}
            </p>
            <div className="flex items-center gap-2 flex-shrink-0">
              <ShareTab
                bucket="programming-patches"
                label={BUCKET_LABEL['programming-patches'][uiLang]}
                onChange={() => setRefreshKey((k) => k + 1)}
              />
              {canLanguages && (
                <Button
                  size="sm"
                  leftIcon={<Plus size={14} />}
                  onClick={() => navigate('/creators/programming/new-language')}
                >
                  {uiLang === 'ar' ? 'لغة جديدة' : 'New Language'}
                </Button>
              )}
            </div>
          </div>
        )}

        {languages.map((lang) => (
          <EnhancedCard key={lang.id} padding="none" className="overflow-hidden">
            {/* Language header */}
            <div className="h-1" style={{ backgroundColor: lang.color }} />
            <div className="px-5 py-4 border-b border-[#263248]">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-black"
                    style={{
                      backgroundColor: `${lang.color}15`,
                      border: `1px solid ${lang.color}30`,
                      color: lang.color,
                    }}
                  >
                    {glyphFor(lang)}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#f3f6ff] flex items-center gap-2">
                      {lang.name}
                      {!lang.available && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#6e7a94]">
                          <Lock size={10} /> {uiLang === 'ar' ? 'قريباً' : 'Coming Soon'}
                        </span>
                      )}
                    </h2>
                    <p className="text-xs text-[#6e7a94]">
                      {lang.available
                        ? `${getDisplayModules(lang.slug, lang.modules).length} ${t('studio.modulesLabel')}`
                        : uiLang === 'ar'
                          ? 'الغلاف قابل للتعديل'
                          : 'Cover art editable'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Another author's published language: admin edit only */}
                  {(() => {
                    if (ownLanguageDef(lang.slug) || !isAdmin) return null;
                    const foreignLang = publishedRows.find(
                      (r): r is Extract<PublishedRow, { kind: 'language' }> =>
                        r.kind === 'language' &&
                        r.entry.languageSlug === lang.slug &&
                        r.entry.ownerId !== user?._id
                    );
                    if (!foreignLang) return null;
                    return (
                      <div className="flex items-center gap-1.5" dir="ltr">
                        <span className="hidden md:inline text-[10px] font-medium text-[#4d5a73]">
                          {foreignLang.entry.ownerName}
                        </span>
                        <StatusBadge status={statusOf(foreignLang.entry.item)} />
                        <button
                          onClick={() => editForeignLanguage(foreignLang.entry)}
                          title={uiLang === 'ar' ? 'تعديل (مشرف)' : 'Edit as admin'}
                          className="w-7 h-7 touch:w-11 touch:h-11 flex items-center justify-center rounded-md text-[#6e7a94] hover:text-[#f3a43a] hover:bg-[#f3a43a]/10 transition-all"
                        >
                          <Edit3 size={13} />
                        </button>
                      </div>
                    );
                  })()}
                  {/* Own creator language: lifecycle + edit + delete */}
                  {(() => {
                    const def = ownLanguageDef(lang.slug);
                    if (!def || !canLanguages) return null;
                    return (
                      <div className="flex items-center gap-1.5" dir="ltr">
                        <StatusBadge status={statusOf(def)} />
                        <button
                          onClick={() => handleToggleLanguagePublish(lang.slug)}
                          title={statusOf(def) === 'published' ? t('studio.unpublish') : t('studio.publish')}
                          className="w-7 h-7 touch:w-11 touch:h-11 flex items-center justify-center rounded-md text-[#6e7a94] hover:text-[#00a859] hover:bg-[#00a859]/10 transition-all"
                        >
                          {statusOf(def) === 'published' ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                        <button
                          onClick={() => navigate(`/creators/programming/edit-language/${lang.slug}`)}
                          title={uiLang === 'ar' ? 'تعديل اللغة' : 'Edit language'}
                          className="w-7 h-7 touch:w-11 touch:h-11 flex items-center justify-center rounded-md text-[#6e7a94] hover:text-[#60a5fa] hover:bg-[#60a5fa]/10 transition-all"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteLanguage(lang.slug, lang.name)}
                          title={uiLang === 'ar' ? 'حذف اللغة' : 'Delete language'}
                          className="w-7 h-7 touch:w-11 touch:h-11 flex items-center justify-center rounded-md text-[#6e7a94] hover:text-red-400 hover:bg-red-500/10 transition-all"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    );
                  })()}
                  {(canProgramming || canLanguages) && (
                    <Button
                      size="sm"
                      variant="ghost"
                      leftIcon={<Image size={12} />}
                      onClick={() => setCoverOpen((p) => ({ ...p, [lang.slug]: !p[lang.slug] }))}
                    >
                      {uiLang === 'ar' ? 'الغلاف' : 'Cover'}
                    </Button>
                  )}
                  {lang.available && canProgramming && (
                    <Button
                      size="sm"
                      variant="secondary"
                      leftIcon={<Plus size={12} />}
                      onClick={() => navigate(`/creators/programming/new-module/${lang.slug}`)}
                    >
                      {t('studio.addModule')}
                    </Button>
                  )}
                </div>
              </div>

              {/* Cover-art editor */}
              {(coverOpen[lang.slug] ?? false) && (
                <div className="mt-4 pt-4 border-t border-[#263248]">
                  <CoverImageUploader
                    value={lang.coverSvg ?? ''}
                    onChange={(cover) => handleSaveCover(lang.slug, cover)}
                    accent={lang.color}
                    label={uiLang === 'ar' ? 'غلاف اللغة' : 'Language Cover'}
                    shownOn={uiLang === 'ar' ? 'بطاقة اللغة' : 'the language card'}
                  />
                </div>
              )}
            </div>

            {/* Modules — available languages only */}
            {lang.available && (
            <div className="divide-y divide-[#263248]/50">
              {getDisplayModules(lang.slug, lang.modules).map((mod) => {
                const key = `${lang.slug}-${mod.slug}`;
                const isExpanded = expanded[key] ?? false;
                const creatorConcepts = getCreatorConcepts(lang.slug, mod.slug);
                const isCreatorMod = isCreatorModule(lang.slug, mod.id);
                const foreignMod = isCreatorMod ? undefined : foreignModules.get(mod.id);

                return (
                  <div key={mod.id}>
                    {/* Module row. A div, not a button: it carries its own
                        action buttons, and a button may not nest one. */}
                    <div
                      role="button"
                      tabIndex={0}
                      aria-expanded={isExpanded}
                      onClick={() => toggleExpand(key)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          toggleExpand(key);
                        }
                      }}
                      className="w-full flex items-center gap-3 px-5 py-3 hover:bg-[#182235]/50 transition-colors text-left cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-[#00a859]/50"
                    >
                      {isExpanded ? (
                        <ChevronDown size={14} className="text-[#6e7a94] flex-shrink-0" />
                      ) : (
                        <ChevronRight size={14} className="text-[#6e7a94] flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-semibold text-[#d2d7e3]">
                          {mod.title.en}
                        </span>
                        <span className="text-xs text-[#4d5a73] ml-2">
                          {mod.concepts.length} {t('studio.conceptsLabel')}
                          {creatorConcepts.length > 0 && (
                            <span className="text-[#00a859]"> + {creatorConcepts.length} {t('studio.customLabel')}</span>
                          )}
                        </span>
                      </div>
                      {(isCreatorMod || isAdmin) && (
                        <div className="flex items-center gap-1.5 flex-shrink-0" dir="ltr">
                          {foreignMod && (
                            <span className="hidden md:inline text-[10px] font-medium text-[#4d5a73]">
                              {foreignMod.ownerName}
                            </span>
                          )}
                          {(isCreatorMod || foreignMod) && <StatusBadge status={statusOf(mod)} />}
                          {isCreatorMod && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleModulePublish(lang.slug, mod);
                              }}
                              title={statusOf(mod) === 'published' ? t('studio.unpublish') : t('studio.publish')}
                              className="w-6 h-6 touch:w-11 touch:h-11 flex items-center justify-center rounded text-[#4d5a73] hover:text-[#00a859] transition-colors"
                            >
                              {statusOf(mod) === 'published' ? <EyeOff size={12} /> : <Eye size={12} />}
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              editModule(lang.slug, mod);
                            }}
                            title={
                              isCreatorMod
                                ? t('studio.editModule')
                                : uiLang === 'ar'
                                  ? 'تعديل (مشرف)'
                                  : 'Edit as admin'
                            }
                            className={`w-6 h-6 touch:w-11 touch:h-11 flex items-center justify-center rounded text-[#4d5a73] transition-colors ${
                              isCreatorMod
                                ? 'hover:text-[#60a5fa]'
                                : foreignMod
                                  ? 'hover:text-[#f3a43a]'
                                  : 'hover:text-[#9fef00]'
                            }`}
                          >
                            <Edit3 size={12} />
                          </button>
                          {isCreatorMod && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteModule(lang.slug, mod.id);
                              }}
                              className="w-6 h-6 touch:w-11 touch:h-11 flex items-center justify-center rounded text-[#4d5a73] hover:text-red-400 transition-colors"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Concepts */}
                    {isExpanded && (
                      <div className="bg-[#0a0f18] border-t border-[#263248]/50">
                        {/* Live concepts: built-in, mine, and other authors' published */}
                        {mod.concepts.map((concept) => {
                          const ownConcept = isOwnConcept(lang.slug, mod.slug, concept.id);
                          const foreignConcept = ownConcept
                            ? undefined
                            : foreignConcepts.get(concept.id);
                          const isCustom = (concept as Partial<CreatorMeta>).isCreatorContent === true;

                          return (
                            <div
                              key={concept.id}
                              className="flex items-center gap-3 px-8 py-2.5 border-b border-[#263248]/30"
                            >
                              {concept.type === 'challenge' ? (
                                <Trophy size={12} className="text-[#f3a43a] flex-shrink-0" />
                              ) : (
                                <BookOpen size={12} className="text-[#6e7a94] flex-shrink-0" />
                              )}
                              <span className="text-xs text-[#c4cad6] flex-1 truncate">
                                {concept.title.en}
                              </span>
                              {foreignConcept && (
                                <span className="hidden md:inline text-[10px] text-[#4d5a73] flex-shrink-0">
                                  {foreignConcept.ownerName}
                                </span>
                              )}
                              <span className="text-[10px] text-[#4d5a73] flex-shrink-0">
                                {isCustom
                                  ? uiLang === 'ar'
                                    ? 'مخصص'
                                    : 'Custom'
                                  : t('studio.builtIn')}
                              </span>
                              {(ownConcept || isAdmin) && (
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <button
                                    onClick={() => editConcept(lang.slug, mod.slug, concept)}
                                    title={
                                      ownConcept
                                        ? t('studio.edit')
                                        : uiLang === 'ar'
                                          ? 'تعديل (مشرف)'
                                          : 'Edit as admin'
                                    }
                                    className={`w-6 h-6 touch:w-11 touch:h-11 flex items-center justify-center rounded text-[#4d5a73] transition-colors ${
                                      ownConcept
                                        ? 'hover:text-[#60a5fa]'
                                        : foreignConcept
                                          ? 'hover:text-[#f3a43a]'
                                          : 'hover:text-[#9fef00]'
                                    }`}
                                  >
                                    <Edit3 size={11} />
                                  </button>
                                  {ownConcept && (
                                    <button
                                      onClick={() =>
                                        handleDeleteConcept(lang.slug, mod.slug, concept.id)
                                      }
                                      className="w-6 h-6 touch:w-11 touch:h-11 flex items-center justify-center rounded text-[#4d5a73] hover:text-red-400 transition-colors"
                                    >
                                      <Trash2 size={11} />
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* Creator concepts not yet in merged list */}
                        {creatorConcepts
                          .filter((cc) => !mod.concepts.some((c) => c.id === cc.id))
                          .map((concept) => (
                            <div
                              key={concept.id}
                              className="flex items-center gap-3 px-8 py-2.5 border-b border-[#263248]/30"
                            >
                              {concept.type === 'challenge' ? (
                                <Trophy size={12} className="text-[#f3a43a] flex-shrink-0" />
                              ) : (
                                <BookOpen size={12} className="text-[#6e7a94] flex-shrink-0" />
                              )}
                              <span className="text-xs text-[#c4cad6] flex-1 truncate">
                                {concept.title.en}
                              </span>
                              <StatusBadge status={statusOf(concept)} />
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <button
                                  onClick={() =>
                                    navigate(
                                      `/creators/programming/${lang.slug}/${mod.slug}/${concept.slug}`
                                    )
                                  }
                                  className="w-6 h-6 touch:w-11 touch:h-11 flex items-center justify-center rounded text-[#4d5a73] hover:text-[#60a5fa] transition-colors"
                                >
                                  <Edit3 size={11} />
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteConcept(lang.slug, mod.slug, concept.id)
                                  }
                                  className="w-6 h-6 touch:w-11 touch:h-11 flex items-center justify-center rounded text-[#4d5a73] hover:text-red-400 transition-colors"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            </div>
                          ))}

                        {/* Add concept button */}
                        {canProgramming && (
                          <button
                            onClick={() =>
                              navigate(`/creators/programming/new-concept/${lang.slug}/${mod.slug}`)
                            }
                            className="flex items-center gap-1.5 px-8 py-2.5 text-xs font-medium text-[#6e7a94] hover:text-[#00a859] transition-colors w-full"
                          >
                            <Plus size={12} /> {t('studio.addConcept')}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            )}
          </EnhancedCard>
        ))}

        {/* ── Shared with me: another creator's programming content ── */}
        {sharedGroups.some((g) => g.rows.length > 0) && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2">
              <Users size={14} className="text-[#60a5fa]" />
              <h2 className="text-sm font-bold text-[#6e7a94] uppercase tracking-wider">
                {uiLang === 'ar' ? 'مشارَك معك' : 'Shared with you'}
              </h2>
            </div>
            <p className="text-xs text-[#6e7a94] -mt-1">
              {uiLang === 'ar'
                ? 'لديك نفس صلاحيات المالك هنا: التعديل والنشر والحذف.'
                : "You have the owner's rights here: edit, publish and delete."}
            </p>

            {sharedGroups
              .filter((g) => g.rows.length > 0)
              .map((group) => (
                <div key={group.grantId} className="space-y-2">
                  <p className="px-1 text-xs font-semibold text-[#9aa5bf]">
                    {uiLang === 'ar' ? 'من' : 'From'}{' '}
                    <span className="text-[#f3f6ff]">
                      {group.owner?.displayName ?? (uiLang === 'ar' ? 'مستخدم محذوف' : 'Removed user')}
                    </span>
                  </p>

                  {group.rows.map((row) => {
                    const isLanguage = row.kind === 'language';
                    const isModule = row.kind === 'module';
                    const isChallenge = row.kind === 'concept' && row.entry.item.type === 'challenge';
                    const key = `${group.grantId}-${row.kind}-${
                      isLanguage ? row.entry.languageSlug : (row.entry.item as { id: string }).id
                    }`;

                    return (
                      <EnhancedCard key={key} padding="none" hoverable className="overflow-hidden group">
                        <div className="flex items-center gap-4 px-5 py-4">
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-[#60a5fa]/20 bg-[#60a5fa]/10">
                            {isLanguage ? (
                              <Code size={16} className="text-[#60a5fa]" />
                            ) : isModule ? (
                              <Layers size={16} className="text-[#60a5fa]" />
                            ) : isChallenge ? (
                              <Trophy size={16} className="text-[#60a5fa]" />
                            ) : (
                              <BookOpen size={16} className="text-[#60a5fa]" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <h3 className="truncate text-sm font-bold text-[#f3f6ff]">
                              {titleOf(row) || t('studio.untitled')}
                            </h3>
                            <p className="mt-0.5 truncate text-xs text-[#6e7a94]" dir="ltr">
                              {row.entry.languageSlug}
                              {row.entry.moduleSlug ? ` · ${row.entry.moduleSlug}` : ''}
                            </p>
                          </div>

                          <div className="flex flex-shrink-0 items-center gap-2" dir="ltr">
                            <StatusBadge status={statusOf(row.entry.item)} />
                            <button
                              onClick={() => toggleSharedRowPublish(row)}
                              title={
                                statusOf(row.entry.item) === 'published'
                                  ? t('studio.unpublish')
                                  : t('studio.publish')
                              }
                              className="flex h-7 w-7 items-center justify-center rounded-md text-[#6e7a94] transition-all hover:bg-[#00a859]/10 hover:text-[#00a859]"
                            >
                              {statusOf(row.entry.item) === 'published' ? (
                                <EyeOff size={13} />
                              ) : (
                                <Eye size={13} />
                              )}
                            </button>
                            <button
                              onClick={() => editSharedRow(row)}
                              title={t('studio.edit')}
                              className="flex h-7 w-7 items-center justify-center rounded-md text-[#6e7a94] transition-all hover:bg-[#60a5fa]/10 hover:text-[#60a5fa]"
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              onClick={() => deleteSharedRow(row)}
                              title={t('studio.delete')}
                              className="flex h-7 w-7 items-center justify-center rounded-md text-[#6e7a94] transition-all hover:bg-red-500/10 hover:text-red-400"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </EnhancedCard>
                    );
                  })}
                </div>
              ))}
          </div>
        )}

        {/* ── Admin: every published programming item (any author) ── */}
        {isAdmin && publishedRows.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-[#f3a43a]" />
              <h2 className="text-sm font-bold text-[#6e7a94] uppercase tracking-wider">
                {uiLang === 'ar'
                  ? 'المحتوى البرمجي المنشور وقيد المراجعة'
                  : 'Published & in-review programming content'}{' '}
                ({publishedRows.length})
              </h2>
            </div>
            <p className="text-xs text-[#6e7a94] -mt-1">
              {uiLang === 'ar'
                ? 'كل ما هو منشور على المنصة وكل ما أُرسل للمراجعة، بما في ذلك محتواك. يمكنك تعديل أي منه وتبقى ملكية المؤلف كما هي. المسودات تبقى خاصة بمؤلفها.'
                : 'Everything live on the platform plus everything submitted for review, your own content included. You can edit any of it; the original author is kept. Drafts stay private to their author.'}
            </p>

            {publishedRows.map((row) => {
              const { entry } = row;
              const isLanguage = row.kind === 'language';
              const isModule = row.kind === 'module';
              const isChallenge = row.kind === 'concept' && row.entry.item.type === 'challenge';
              const mine = entry.ownerId === user?._id;

              return (
                <EnhancedCard
                  key={`${entry.ownerId}-${row.kind}-${
                    isLanguage ? entry.languageSlug : (entry.item as { id: string }).id
                  }`}
                  padding="none"
                  hoverable
                  className="overflow-hidden group"
                >
                  <div className="flex items-center gap-4 px-5 py-4">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        mine
                          ? 'bg-[#00a859]/10 border border-[#00a859]/20'
                          : 'bg-[#f3a43a]/10 border border-[#f3a43a]/20'
                      }`}
                    >
                      {(() => {
                        const tint = mine ? 'text-[#00a859]' : 'text-[#f3a43a]';
                        if (isLanguage) return <Code size={16} className={tint} />;
                        if (isModule) return <Layers size={16} className={tint} />;
                        if (isChallenge) return <Trophy size={16} className={tint} />;
                        return <BookOpen size={16} className={tint} />;
                      })()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-[#f3f6ff] truncate">
                        {titleOf(row) || t('studio.untitled')}
                      </h3>
                      <p className="text-xs text-[#6e7a94] truncate mt-0.5" dir="ltr">
                        {entry.languageSlug}
                        {entry.moduleSlug ? ` · ${entry.moduleSlug}` : ''}
                        {' · '}
                        {isLanguage
                          ? uiLang === 'ar'
                            ? 'لغة'
                            : 'Language'
                          : isModule
                            ? uiLang === 'ar'
                              ? 'وحدة'
                              : 'Module'
                            : isChallenge
                              ? uiLang === 'ar'
                                ? 'تحدٍّ'
                                : 'Challenge'
                              : uiLang === 'ar'
                                ? 'درس'
                                : 'Lesson'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0" dir="ltr">
                      <span className="hidden md:flex text-[10px] font-medium text-[#4d5a73] items-center gap-1">
                        <User size={10} />{' '}
                        {ownerLabel(entry.ownerId, entry.ownerName, user?._id, uiLang)}
                      </span>
                      <StatusBadge status={statusOf(entry.item)} />

                      <button
                        onClick={() => {
                          if (row.kind === 'language') editForeignLanguage(row.entry);
                          else if (row.kind === 'module')
                            editModule(row.entry.languageSlug, row.entry.item);
                          else
                            editConcept(
                              row.entry.languageSlug,
                              row.entry.moduleSlug!,
                              row.entry.item
                            );
                        }}
                        title={
                          mine ? t('studio.edit') : uiLang === 'ar' ? 'تعديل (مشرف)' : 'Edit as admin'
                        }
                        className={`w-7 h-7 touch:w-11 touch:h-11 flex items-center justify-center rounded-md text-[#6e7a94] transition-all ${
                          mine
                            ? 'hover:text-[#60a5fa] hover:bg-[#60a5fa]/10'
                            : 'hover:text-[#f3a43a] hover:bg-[#f3a43a]/10'
                        }`}
                      >
                        <Edit3 size={13} />
                      </button>
                    </div>
                  </div>
                </EnhancedCard>
              );
            })}
          </div>
        )}
      </div>
    </CreatorLayout>
  );
};

export default ProgrammingCreator;
