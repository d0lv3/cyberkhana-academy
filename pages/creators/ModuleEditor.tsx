import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  FileText,
  Layers,
  BookOpen,
  FlaskConical,
} from 'lucide-react';
import CreatorLayout from '../../components/creators/CreatorLayout';
import TagInput from '../../components/creators/TagInput';
import CoverImageUploader from '../../components/creators/CoverImageUploader';
import { cleanQuiz } from '../../components/creators/QuizEditor';
import LabEditor from '../../components/creators/LabEditor';
import ContentLanguageBar from '../../components/creators/module-editor/ContentLanguageBar';
import LessonsTab, { newChapter, type LessonSelection } from '../../components/creators/module-editor/LessonsTab';
import ModuleLanguagesField from '../../components/creators/module-editor/ModuleLanguagesField';
import { LocalizedInput, useInterfaceLang, useTr, type EditingLanguage } from '../../components/creators/module-editor/fields';
import EnhancedCard from '../../components/ui/EnhancedCard';
import { confirmDialog } from '../../components/ui/ConfirmHost';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../contexts/AuthContext';
import {
  saveOSModule,
  getOSModuleById,
  saveStandaloneModule,
  getStandaloneModuleById,
  saveModuleAsAdmin,
  type AdminModuleBucket,
} from '../../services/creatorDataService';
import {
  makeCreatorMeta,
  statusOf,
  mdFor,
  toLocalizedMarkdown,
  type ContentStatus,
  type CreatorFundamentalModule,
  type CreatorModuleChapter,
  type LocalizedMarkdown,
} from '../../services/creatorTypes';
import { cleanLabs, type ModuleLab } from '../../services/labTypes';
import { exactText, moduleLanguages, pairOf, pickText, type Lang } from '../../services/contentLang';
import {
  servedBody,
  servedLab,
  servedName,
  servedQuiz,
  servedText,
  translationReport,
  UNNAMED,
  type Gap,
} from '../../services/moduleLocalize';
import { MODULE_DOMAINS, MODULE_DOMAIN_META, type ModuleDomain } from '../../data/fundamentalsData';
import type { Difficulty } from '../../types';

interface ModuleEditorProps {
  /** 'os' → OS Fundamentals module · 'standalone' → Modules-hub module */
  kind: 'os' | 'standalone';
}

const DIFFICULTIES: Difficulty[] = ['Beginner', 'Easy', 'Medium', 'Hard', 'Expert'];

const inputCls =
  'w-full bg-[#0a0f18] border border-[#263248] rounded-lg px-3 py-2 text-sm text-[#d2d7e3] focus:outline-none focus:border-[#00a859]/50 transition-colors placeholder:text-[#7c8aa6]';

const fieldLabelCls = 'block text-xs font-semibold text-[#9aa5bf] mb-1.5';

/** Where the module list stashes the foreign module an admin chose to edit. */
const ADMIN_EDIT_STASH = 'academy-admin-module-edit';

interface AdminEditStash {
  id: string;
  ownerId: string;
  ownerName: string;
  bucket: AdminModuleBucket;
  module: CreatorFundamentalModule;
}

/** Where the list stashes a built-in course converted for copy-on-write edit. */
const BUILTIN_EDIT_STASH = 'academy-builtin-module-edit';

interface BuiltinEditStash {
  id: string;
  module: CreatorFundamentalModule;
}

/** Whether the other language is shown beside each field: a preference of the
 *  person translating, kept on this device like the autosave switch. */
const COMPARE_KEY = 'creator-compare-languages';

const uid = (p: string) => `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
const generateSlug = (title: string) =>
  title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 60);

/* The names the editor used to give a new chapter and a new lesson. They were
   English, they were saved, and on a module written in Arabic they were all an
   English reader saw. Nobody chose them, so they are read back as no name. */
const OLD_PLACEHOLDER_NAMES = new Set(['New Chapter', 'New Section']);
const withoutPlaceholder = (name: string | undefined): string => (name && OLD_PLACEHOLDER_NAMES.has(name.trim()) ? '' : name ?? '');

/** Rough mm:ss reading/watch time so the viewer sidebar shows something sane. */
function estimateDuration(s: { markdownContent: LocalizedMarkdown; videoId?: string; videoMinutes?: number }): string {
  const body = mdFor(s.markdownContent, 'en') || mdFor(s.markdownContent, 'ar');
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  const video = s.videoId ? (s.videoMinutes && s.videoMinutes > 0 ? s.videoMinutes : 4) : 0;
  const mins = Math.max(1, Math.round(words / 180 + video));
  return `${mins}:00`;
}

const ModuleEditor: React.FC<ModuleEditorProps> = ({ kind }) => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast, ToastContainer } = useToast();
  const { user } = useAuth();
  const tr = useTr();
  const interfaceLang = useInterfaceLang();
  const isEditing = !!id;
  const isOS = kind === 'os';
  /* Editing someone else's module in place, ownership kept. Two ways here:
   * platform moderation (?admin=1) or a share the owner gave you (?shared=1).
   * The client only checks the stash; the server authorises every write on its
   * own, by role or by grant. */
  const isAdminEdit = searchParams.get('admin') === '1' || searchParams.get('shared') === '1';
  const viaShare = searchParams.get('shared') === '1';
  // Admin editing a built-in course: first save creates a DB override (copy-on-write).
  const isBuiltinEdit = searchParams.get('builtin') === '1' && user?.role === 'admin';

  const getById = isOS ? getOSModuleById : getStandaloneModuleById;
  const saveModule = isOS ? saveOSModule : saveStandaloneModule;
  const listRoute = isOS ? '/creators/os-modules' : '/creators/modules';
  const noun = isOS ? 'OS Module' : 'Module';
  const nounAr = isOS ? 'وحدة أنظمة التشغيل' : 'الوحدة';

  const [titleEn, setTitleEn] = useState('');
  const [titleAr, setTitleAr] = useState('');
  const [descEn, setDescEn] = useState('');
  const [descAr, setDescAr] = useState('');
  const [slug, setSlug] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('Beginner');
  const [tags, setTags] = useState<string[]>([]);
  const [author, setAuthor] = useState('CyberKhana');
  const [estimatedHours, setEstimatedHours] = useState(1);
  const [iconColor, setIconColor] = useState(isOS ? '#f3a43a' : '#34d399');
  const [coverImage, setCoverImage] = useState('');
  const [domain, setDomain] = useState<ModuleDomain>('general');
  const [showInModules, setShowInModules] = useState(true);
  const [status, setStatus] = useState<ContentStatus>('draft');
  const [chapters, setChapters] = useState<CreatorModuleChapter[]>([]);
  const [labs, setLabs] = useState<ModuleLab[]>([]);
  const [selected, setSelected] = useState<LessonSelection | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [existing, setExisting] = useState<CreatorFundamentalModule | null>(null);
  /* The languages the module is written in, the main one first, and the one
     being written right now. Every text field on every tab follows the second
     (services/contentLang.ts has the rule). */
  const [languages, setLanguages] = useState<Lang[]>(['en']);
  const [contentLang, setContentLang] = useState<Lang>('en');
  const [compare, setCompare] = useState(() => {
    try { return localStorage.getItem(COMPARE_KEY) === 'true'; } catch { return false; }
  });
  const [openLabId, setOpenLabId] = useState<string | null>(null);
  const [tab, setTab] = useState<'details' | 'content' | 'lab'>('details');
  const [adminCtx, setAdminCtx] = useState<{
    ownerId: string;
    ownerName: string;
    bucket: AdminModuleBucket;
  } | null>(null);

  const mainLang = languages[0] ?? 'en';
  const editing: EditingLanguage = useMemo(
    () => ({ lang: languages.includes(contentLang) ? contentLang : mainLang, languages, compare }),
    [contentLang, languages, compare, mainLang]
  );

  // Load existing
  useEffect(() => {
    if (id) {
      // Admin editing a foreign module: the list page stashed the full module
      // (+ its owner) in sessionStorage. Fall back to a normal own-bucket load.
      let mod: CreatorFundamentalModule | undefined;
      if (isBuiltinEdit) {
        // Built-in course converted by the list page; save creates the override.
        try {
          const raw = sessionStorage.getItem(BUILTIN_EDIT_STASH);
          const stash: BuiltinEditStash | null = raw ? JSON.parse(raw) : null;
          if (stash && stash.id === id && stash.module) mod = stash.module;
        } catch {
          /* fall through */
        }
        if (!mod) {
          toast('error', tr('Could not open this course for editing. Open it again from the list.', 'تعذّر فتح هذه الدورة للتعديل. افتحها من القائمة مجددًا.'));
          navigate(listRoute);
          return;
        }
      } else if (isAdminEdit) {
        try {
          const raw = sessionStorage.getItem(ADMIN_EDIT_STASH);
          const stash: AdminEditStash | null = raw ? JSON.parse(raw) : null;
          if (stash && stash.id === id && stash.module) {
            mod = stash.module;
            setAdminCtx({ ownerId: stash.ownerId, ownerName: stash.ownerName, bucket: stash.bucket });
          }
        } catch {
          /* fall through to own-bucket load */
        }
        if (!mod) {
          toast('error', tr('Could not open this module for editing. Open it again from the list.', 'تعذّر فتح هذه الوحدة للتعديل. افتحها من القائمة مجددًا.'));
          navigate(listRoute);
          return;
        }
      } else {
        mod = getById(id);
      }
      if (mod) {
        const written = moduleLanguages(mod);
        setExisting(mod);
        setLanguages(written);
        setContentLang(written[0]);
        setTitleEn(mod.title.en);
        setTitleAr(mod.title.ar);
        setDescEn(mod.description.en);
        setDescAr(mod.description.ar);
        setSlug(mod.slug);
        setDifficulty(mod.difficulty);
        setTags(mod.tags);
        setAuthor(mod.author);
        setEstimatedHours(mod.estimatedHours);
        setIconColor(mod.iconColor);
        setCoverImage(mod.coverImage || '');
        setDomain(mod.domain ?? 'general');
        setShowInModules(mod.showInModules);
        setStatus(statusOf(mod));
        setLabs(mod.labs ?? []);
        // chapters: prefer structured, fall back to legacy single markdown
        if (mod.chapters && mod.chapters.length) {
          setChapters(
            mod.chapters.map((ch) => ({
              ...ch,
              title: withoutPlaceholder(ch.title),
              sections: ch.sections.map((s) => ({
                ...s,
                title: withoutPlaceholder(s.title),
                markdownContent: toLocalizedMarkdown(s.markdownContent),
              })),
            }))
          );
        } else if (mod.markdownContent) {
          setChapters([
            { id: uid('ch'), title: mod.title.en || 'Chapter 1', sections: [{ id: uid('sec'), title: 'Overview', subtitle: '', videoId: mod.videoId || '', markdownContent: toLocalizedMarkdown(mod.markdownContent) }] },
          ]);
        } else {
          setChapters([newChapter()]);
        }
      }
    } else {
      /* A new module starts out in the language its creator works in: someone
         using the Studio in Arabic is most likely about to write in Arabic. */
      setLanguages([interfaceLang]);
      setContentLang(interfaceLang);
      setChapters([newChapter()]);
    }
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Auto-slug for new. A slug is Latin letters, so it can only follow an
     English title; with none, whatever is in the box stays, and saving gives
     the module one if it is still empty. */
  useEffect(() => {
    if (isEditing) return;
    const fromTitle = generateSlug(titleEn);
    if (fromTitle) setSlug(fromTitle);
  }, [titleEn, isEditing]);

  // Keep a valid selection
  useEffect(() => {
    if (chapters.length && !selected) setSelected({ ci: 0, si: 0 });
  }, [chapters, selected]);

  useEffect(() => {
    try { localStorage.setItem(COMPARE_KEY, String(compare)); } catch { /* preference is optional */ }
  }, [compare]);

  const totalSections = useMemo(() => chapters.reduce((s, c) => s + c.sections.length, 0), [chapters]);

  const title = pairOf(titleEn, titleAr);
  const description = pairOf(descEn, descAr);

  /* Every lesson, flattened and labelled by its chapter, so a lab can be
   * placed after one of them by name rather than by id. */
  const sectionOptions = useMemo(
    () =>
      chapters.flatMap((ch, ci) =>
        ch.sections.map((s) => ({
          id: s.id,
          label: `${pickText(pairOf(ch.title, ch.titleAr), editing.lang) || tr(`Chapter ${ci + 1}`, `الفصل ${ci + 1}`)} / ${
            pickText(pairOf(s.title, s.titleAr), editing.lang) || tr('Untitled lesson', 'درس بلا عنوان')
          }`,
        }))
      ),
    [chapters, editing.lang] // eslint-disable-line react-hooks/exhaustive-deps
  );

  /* What the second language still lacks, for the bar above the tabs and for
     the question asked before publishing. Nothing to report on a module
     written in one language. */
  const report = useMemo(
    () => (languages.length === 2 ? translationReport({ title, description, chapters, labs }, languages[1]) : null),
    [languages, titleEn, titleAr, descEn, descAr, chapters, labs] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const changeLanguages = (next: Lang[]) => {
    setLanguages(next);
    if (!next.includes(contentLang)) setContentLang(next[0]);
  };

  /** Take the creator to something that is not translated yet. */
  const openGap = (gap: Gap, lang: Lang) => {
    setContentLang(lang);
    if (gap.target.tab === 'details') setTab('details');
    else if (gap.target.tab === 'lab') {
      setOpenLabId(gap.target.labId);
      setTab('lab');
    } else {
      setSelected({ ci: gap.target.ci, si: gap.target.si ?? 0 });
      setTab('content');
    }
  };

  /* ── Build the full module object from the current editor state ── */
  const buildModule = (): CreatorFundamentalModule => {
    const resolvedAuthorName = existing?.authorName || user?.displayName || author;
    // OS modules are pinned to their pillar; standalone modules are free-topic
    // ('general') — legacy categories are preserved on edit.
    const cat = isOS ? 'operating-systems' : existing?.category ?? 'general';
    const moduleId = existing?.id || uid('mod');
    /* The address the module is reached at. With no English title to make one
       from, the module's own id serves: it is already Latin and unique. */
    const resolvedSlug = slug.trim() || generateSlug(titleEn) || moduleId;

    // Derive a content type from the sections
    const hasVideo = chapters.some((c) => c.sections.some((s) => s.videoId));
    const hasText = chapters.some((c) =>
      c.sections.some((s) => (mdFor(s.markdownContent, 'en') || mdFor(s.markdownContent, 'ar')).trim())
    );
    const contentType: CreatorFundamentalModule['contentType'] =
      hasVideo && hasText ? 'mixed' : hasVideo ? 'video' : 'text';

    /* ── Labs ──
     * A lab is a stop in the course, not a separate screen, so it is flattened
     * into courseData as a lecture like everything else. That is what puts it
     * in the sidebar, in the progress count and in "next lesson" for free: the
     * viewer's only special case is rendering a lab body instead of a lesson
     * one. Stubs are dropped by cleanLabs, since a lab with nothing in it is
     * worse in the sidebar than no lab at all.
     *
     * courseData is what learners are sent, so every text in it goes through
     * services/moduleLocalize.ts: the module's languages decide what is sent,
     * and a name is never left empty where the other language has one. */
    const readyLabs = cleanLabs(labs).map((lab) => servedLab(lab, languages));
    const labLecture = (lab: ModuleLab) => ({
      id: lab.id,
      title: lab.title,
      titleAr: lab.titleAr ?? '',
      subtitle: '',
      videoId: '',
      duration: `${lab.estimatedMinutes}:00`,
      quiz: null,
      kind: 'lab' as const,
      lab,
    });

    // Flatten to courseData so the existing viewer can render it
    const courseModules = chapters.map((ch, ci) => {
      const chapterName = servedName(pairOf(ch.title, ch.titleAr), languages, UNNAMED.chapter(ci + 1));
      return {
        id: ch.id,
        title: chapterName.text,
        titleAr: chapterName.textAr,
        lectures: ch.sections.flatMap((s) => {
          const quiz = servedQuiz(cleanQuiz(s.quiz), languages);
          const lessonName = servedName(pairOf(s.title, s.titleAr), languages, UNNAMED.lesson);
          const subtitle = servedText(pairOf(s.subtitle, s.subtitleAr), languages);
          const body = servedBody(s.markdownContent, languages);
          const lecture = {
            id: s.id,
            title: lessonName.text,
            titleAr: lessonName.textAr,
            subtitle: subtitle.text,
            subtitleAr: subtitle.textAr,
            videoId: s.videoId || '',
            // Only with a video; XP times the video from it (shared/xp.ts).
            videoMinutes: s.videoId && s.videoMinutes ? s.videoMinutes : undefined,
            duration: estimateDuration({ ...s, markdownContent: body }),
            // 'embedded' marker keeps the viewer's hasQuiz/gating checks working
            quiz: quiz.length ? 'embedded' : null,
            quizQuestions: quiz.length ? quiz : undefined,
            markdownContent: body,
          };
          const pinned = readyLabs.filter(
            (lab) => lab.placement.at === 'after-section' && lab.placement.sectionId === s.id
          );
          return [lecture, ...pinned.map(labLecture)];
        }),
      };
    });

    /* Labs placed at the end, plus any that were pinned to a section the author
     * has since deleted. An orphaned lab moves to the end rather than vanishing
     * with the section it was attached to. */
    const sectionIds = new Set(chapters.flatMap((c) => c.sections.map((s) => s.id)));
    const trailingLabs = readyLabs.filter(
      (lab) => lab.placement.at === 'end' || !sectionIds.has(lab.placement.sectionId)
    );
    const labsChapter = servedName(pairOf('', ''), languages, UNNAMED.labs(trailingLabs.length));

    const courseData = {
      id: resolvedSlug,
      title: servedText(title, languages).text,
      description: servedText(description, languages).text,
      modules: [
        ...courseModules,
        ...(trailingLabs.length
          ? [
              {
                id: `${resolvedSlug}-labs`,
                title: labsChapter.text,
                titleAr: labsChapter.textAr,
                lectures: trailingLabs.map(labLecture),
              },
            ]
          : []),
      ],
    };

    const totalQuizzes = chapters.reduce(
      (sum, c) => sum + c.sections.filter((s) => cleanQuiz(s.quiz).length > 0).length,
      0
    );

    return {
      id: moduleId,
      slug: resolvedSlug,
      title: { en: titleEn, ar: titleAr },
      description: { en: descEn, ar: descAr },
      languages,
      category: cat,
      contentType,
      difficulty,
      tags,
      author,
      estimatedHours,
      coverImage: coverImage || undefined,
      domain,
      // Labs are stops too, so the header count matches what the sidebar lists.
      totalLessons: totalSections + readyLabs.length,
      totalModules: chapters.length,
      totalQuizzes,
      totalLabs: readyLabs.length,
      iconColor,
      courseData,
      chapters,
      // Keep unfinished lab drafts in the editor; courseData contains only
      // complete labs, so students never see a stub.
      labs,
      showInModules: isOS ? showInModules : true,
      ...(existing
        ? {
            isCreatorContent: true as const,
            isPublished: status === 'published',
            status,
            authorName: resolvedAuthorName,
            createdAt: existing.createdAt,
            updatedAt: new Date().toISOString(),
          }
        : makeCreatorMeta(status, resolvedAuthorName)),
    };
  };

  /** The one thing a module cannot be saved without: a title in the language
   *  it is written in. Says so, and takes the creator to the box. */
  const hasMainTitle = (silent: boolean): boolean => {
    if (exactText(title, mainLang)) return true;
    if (!silent) {
      setContentLang(mainLang);
      setTab('details');
      toast(
        'error',
        mainLang === 'ar'
          ? tr('Give the module a title in Arabic first.', 'أضف عنوانًا للوحدة بالعربية أولًا.')
          : tr('Give the module a title in English first.', 'أضف عنوانًا للوحدة بالإنجليزية أولًا.')
      );
    }
    return false;
  };

  /* ── Save ── */
  const handleSave = async (silent = false) => {
    if (isSaving) return;
    if (!hasMainTitle(silent)) return;
    if (totalSections === 0) {
      if (!silent) { setTab('content'); toast('error', tr('Add at least one lesson.', 'أضف درسًا واحدًا على الأقل.')); }
      return;
    }

    setIsSaving(true);
    const built = buildModule();
    const saved = status === 'published' ? tr(`${noun} published.`, `نُشرت ${nounAr}.`) : tr(`${noun} saved.`, `حُفظت ${nounAr}.`);

    // Admin edit: write back into the original author's bucket via the server.
    if (adminCtx) {
      try {
        await saveModuleAsAdmin(adminCtx.ownerId, adminCtx.bucket, built);
        sessionStorage.setItem(ADMIN_EDIT_STASH, JSON.stringify({ id: built.id, ...adminCtx, module: built }));
        setExisting(built);
        if (!silent) toast('success', saved);
      } catch (err) {
        toast('error', err instanceof Error ? err.message : tr('Could not save this module.', 'تعذّر حفظ هذه الوحدة.'));
      } finally {
        setIsSaving(false);
      }
      return;
    }

    // Normal own-bucket save. Copy-on-write of a built-in course lands here too:
    // it writes a fresh, published DB module (owned by this admin) that overrides
    // the static original.
    saveModule(built);
    if (isBuiltinEdit) sessionStorage.setItem(BUILTIN_EDIT_STASH, JSON.stringify({ id: built.id, module: built }));
    setExisting(built);
    if (!slug.trim()) setSlug(built.slug);
    setIsSaving(false);
    if (!silent) toast('success', saved);
    if (!id) navigate(`${listRoute}/edit/${built.id}`, { replace: true });
  };

  /* Publishing is the moment a half-done translation starts reaching people,
     so that is when it is asked about: once, plainly, with the way to carry on
     regardless. Nothing is blocked. A module can go out in one language and
     gain the other lesson by lesson. */
  const changeStatus = async (next: ContentStatus) => {
    if (next === 'published' && status !== 'published' && report && report.gaps.length > 0) {
      const second = report.language;
      const count = report.gaps.length;
      const ok = await confirmDialog({
        title:
          second === 'ar'
            ? tr('Publish with the Arabic unfinished?', 'النشر قبل اكتمال العربية؟')
            : tr('Publish with the English unfinished?', 'النشر قبل اكتمال الإنجليزية؟'),
        message:
          second === 'ar'
            ? tr(
                `${count} ${count === 1 ? 'part is' : 'parts are'} not in Arabic yet. Learners reading in Arabic will be shown the English for ${count === 1 ? 'it' : 'those'}, with a note saying so.`,
                `عدد الأجزاء التي لم تُكتب بالعربية بعد: ${count}. من يقرأ بالعربية سيرى النص الإنجليزي بدلًا منها مع ملاحظة توضّح ذلك.`
              )
            : tr(
                `${count} ${count === 1 ? 'part is' : 'parts are'} not in English yet. Learners reading in English will be shown the Arabic for ${count === 1 ? 'it' : 'those'}, with a note saying so.`,
                `عدد الأجزاء التي لم تُكتب بالإنجليزية بعد: ${count}. من يقرأ بالإنجليزية سيرى النص العربي بدلًا منها مع ملاحظة توضّح ذلك.`
              ),
        confirmLabel: tr('Publish anyway', 'انشر على أي حال'),
        cancelLabel: tr('Keep translating', 'تابع الترجمة'),
      });
      if (!ok) return;
    }
    setStatus(next);
  };

  /* ── Preview as published: snapshot the current (unsaved) draft and open it
   * in the real student viewer in a new tab. ── */
  const handlePreview = () => {
    if (!hasMainTitle(false)) return;
    if (totalSections === 0) {
      setTab('content');
      toast('error', tr('Add at least one lesson to preview.', 'أضف درسًا واحدًا على الأقل للمعاينة.'));
      return;
    }
    try {
      localStorage.setItem('academy-module-preview', JSON.stringify(buildModule()));
      window.open(
        `${window.location.origin}${window.location.pathname}#/fundamentals/module/__preview__`,
        '_blank',
        'noopener'
      );
    } catch {
      toast('error', tr('Could not open the preview.', 'تعذّر فتح المعاينة.'));
    }
  };

  const tabCls = (on: boolean, amber = false) =>
    `flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
      on
        ? amber
          ? 'bg-[#f3a43a]/12 text-[#f3a43a] border border-[#f3a43a]/30'
          : 'bg-[#00a859]/12 text-[#00a859] border border-[#00a859]/30'
        : 'text-[#8592ad] hover:text-[#d2d7e3] border border-transparent'
    }`;

  return (
    <CreatorLayout
      title={isEditing ? tr(`Edit ${noun}`, `تعديل ${nounAr}`) : tr(`New ${noun}`, isOS ? 'وحدة أنظمة تشغيل جديدة' : 'وحدة جديدة')}
      subtitle={pickText(title, editing.lang) || undefined}
      backTo={listRoute}
      backLabel={isOS ? tr('OS & Modules', 'أنظمة التشغيل والوحدات') : tr('Modules', 'الوحدات')}
      onSave={handleSave}
      autoSaveSnapshot={JSON.stringify([titleEn, titleAr, descEn, descAr, slug, difficulty, tags, author, estimatedHours, iconColor, coverImage, domain, showInModules, status, chapters, labs, languages])}
      isSaving={isSaving}
      onPreview={handlePreview}
      status={status}
      onStatusChange={(next) => void changeStatus(next)}
    >
      <ToastContainer />

      {/* ── Built-in copy-on-write banner ── */}
      {isBuiltinEdit && !adminCtx && (
        <div className="flex items-start gap-3 rounded-lg border border-[#9fef00]/30 bg-[#9fef00]/10 px-4 py-3">
          <BookOpen size={16} className="text-[#9fef00] mt-0.5 flex-shrink-0" />
          <div className="text-xs text-[#d2d7e3]">
            <span className="font-bold text-[#9fef00]">{tr('Editing a built-in course', 'تعديل دورة مضمّنة')}</span>
            {tr(
              ', saving creates an editable copy that replaces the original everywhere. Existing student progress is preserved.',
              '، والحفظ ينشئ نسخة قابلة للتعديل تحل محل الأصل في كل مكان. يبقى تقدّم الطلاب كما هو.'
            )}
          </div>
        </div>
      )}

      {/* ── Editing on someone else's behalf ── */}
      {adminCtx && (
        <div
          className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${
            viaShare ? 'border-[#60a5fa]/30 bg-[#60a5fa]/10' : 'border-[#f3a43a]/30 bg-[#f3a43a]/10'
          }`}
        >
          <Layers
            size={16}
            className={`mt-0.5 flex-shrink-0 ${viaShare ? 'text-[#60a5fa]' : 'text-[#f3a43a]'}`}
          />
          <div className="text-xs text-[#d2d7e3]">
            <span className={`font-bold ${viaShare ? 'text-[#60a5fa]' : 'text-[#f3a43a]'}`}>
              {viaShare ? tr('Shared with you', 'مشاركة معك') : tr('Admin edit', 'تعديل إداري')}
            </span>{' '}
            {tr("you're editing", 'أنت تعدّل وحدة')} <span className="font-semibold text-[#f3f6ff]"><bdi>{adminCtx.ownerName}</bdi></span>
            {tr("'s module. Authorship is kept; saving updates it for everyone who can see it.", '. يبقى التأليف باسمه، والحفظ يحدّثها لكل من يراها.')}
          </div>
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="creator-section-tabs grid grid-cols-3 sm:flex items-stretch gap-1 rounded-xl border border-[#263248] bg-[#0b1019] p-1">
        <button type="button" onClick={() => setTab('details')} aria-pressed={tab === 'details'} className={tabCls(tab === 'details')}>
          <FileText size={15} />
          <span>{tr('Details', 'التفاصيل')}</span>
        </button>
        <button type="button" onClick={() => setTab('content')} aria-pressed={tab === 'content'} className={tabCls(tab === 'content')}>
          <Layers size={15} />
          <span>{tr('Lessons', 'الدروس')}</span>
          {totalSections > 0 && (
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${tab === 'content' ? 'bg-[#00a859]/20 text-[#00a859]' : 'bg-[#1a2332] text-[#8592ad]'}`}>
              {totalSections}
            </span>
          )}
        </button>
        <button type="button" onClick={() => setTab('lab')} aria-pressed={tab === 'lab'} className={tabCls(tab === 'lab', true)}>
          <FlaskConical size={15} />
          <span>{tr('Labs', 'المختبرات')}</span>
          {labs.length > 0 && (
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                tab === 'lab' ? 'bg-[#f3a43a]/20 text-[#f3a43a]' : 'bg-[#1a2332] text-[#8592ad]'
              }`}
            >
              {labs.length}
            </span>
          )}
        </button>
      </div>

      {/* ── The language being written, for every tab ── */}
      <ContentLanguageBar
        editing={editing}
        onLang={setContentLang}
        onCompare={setCompare}
        report={report}
        onOpenGap={openGap}
        onChangeLanguages={() => setTab('details')}
      />

      {/* ── Metadata ── */}
      {tab === 'details' && (
      <EnhancedCard padding="lg">
        <h3 className="text-sm font-bold text-[#f3f6ff] mb-4">{tr('Details', 'التفاصيل')}</h3>
        <div className="space-y-5">
          <ModuleLanguagesField value={languages} onChange={changeLanguages} />

          <LocalizedInput
            label={tr('Title', 'العنوان')}
            value={title}
            onChange={(next) => { setTitleEn(next.en); setTitleAr(next.ar); }}
            editing={editing}
            required
            placeholder={{ en: 'e.g. Windows Security Fundamentals', ar: 'مثل: أساسيات أمن ويندوز' }}
          />
          <LocalizedInput
            label={tr('Description', 'الوصف')}
            value={description}
            onChange={(next) => { setDescEn(next.en); setDescAr(next.ar); }}
            editing={editing}
            multiline
            placeholder={{ en: 'A sentence or two on what the module covers.', ar: 'جملة أو جملتان عمّا تتناوله الوحدة.' }}
          />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className={fieldLabelCls}>{tr('Slug', 'المسار')}</label>
              <input value={slug} onChange={(e) => setSlug(e.target.value)} className={`${inputCls} font-mono`} dir="ltr" placeholder="windows-security" />
            </div>
            <div>
              <label className={fieldLabelCls}>{tr('Difficulty', 'الصعوبة')}</label>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)} className={inputCls}>
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={fieldLabelCls}>{tr('Est. hours', 'الساعات التقديرية')}</label>
              <input type="number" value={estimatedHours} onChange={(e) => setEstimatedHours(Number(e.target.value))} step="0.5" min="0.5" className={inputCls} dir="ltr" />
            </div>
            <div>
              <label className={fieldLabelCls}>{tr('Accent', 'اللون')}</label>
              <div className="flex items-center gap-2" dir="ltr">
                <input type="color" value={iconColor} onChange={(e) => setIconColor(e.target.value)} className="w-9 h-9 rounded border border-[#263248] bg-transparent cursor-pointer flex-shrink-0" aria-label={tr('Accent colour', 'لون الوحدة')} />
                <input value={iconColor} onChange={(e) => setIconColor(e.target.value)} className={`${inputCls} font-mono`} dir="ltr" aria-label={tr('Accent colour code', 'رمز لون الوحدة')} />
              </div>
            </div>
          </div>
          <p className="-mt-3 text-[11px] text-[#8592ad]">
            {tr(
              "The slug is the module's address: Latin letters, numbers and hyphens. Leave it empty and it is filled in when you save.",
              'المسار هو عنوان الوحدة في الرابط: أحرف لاتينية وأرقام وشرطات. إن تركته فارغًا يُملأ عند الحفظ.'
            )}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={fieldLabelCls}>{tr('Author', 'المؤلف')}</label>
              <input value={author} onChange={(e) => setAuthor(e.target.value)} className={inputCls} dir="auto" />
            </div>
            <div>
              <label className={fieldLabelCls}>{tr('Category', 'التصنيف')}</label>
              <select value={domain} onChange={(e) => setDomain(e.target.value as ModuleDomain)} className={inputCls}>
                {MODULE_DOMAINS.map((d) => (
                  <option key={d} value={d}>{tr(MODULE_DOMAIN_META[d].label.en, MODULE_DOMAIN_META[d].label.ar)}</option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-[#8592ad]">
                {tr("Offensive, Defensive, or General, shown as the module's tag.", 'هجومي أو دفاعي أو عام، ويظهر وسمًا على الوحدة.')}
              </p>
            </div>
          </div>

          <CoverImageUploader value={coverImage} onChange={setCoverImage} accent={iconColor} />

          <TagInput value={tags} onChange={setTags} label={tr('Tags', 'الوسوم')} />

          {isOS && (
            <div className="flex items-center justify-between gap-4 py-1">
              <div>
                <p className="text-sm font-medium text-[#d2d7e3]">{tr('Also show on Modules page', 'أظهرها في صفحة الوحدات أيضًا')}</p>
                <p className="text-xs text-[#8592ad]">{tr('Surface this OS module in the standalone Modules hub too', 'اعرض هذه الوحدة في مركز الوحدات كذلك')}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={showInModules}
                aria-label={tr('Also show on Modules page', 'أظهرها في صفحة الوحدات أيضًا')}
                onClick={() => setShowInModules(!showInModules)}
                dir="ltr"
                className={`relative w-11 h-6 flex-shrink-0 rounded-full transition-colors ${showInModules ? 'bg-[#00a859]' : 'bg-[#263248]'}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${showInModules ? 'left-[22px]' : 'left-0.5'}`} />
              </button>
            </div>
          )}
        </div>
      </EnhancedCard>
      )}

      {/* ── Chapters and lessons ── */}
      {tab === 'content' && (
        <LessonsTab
          chapters={chapters}
          setChapters={setChapters}
          selected={selected}
          onSelect={setSelected}
          editing={editing}
        />
      )}

      {/* ── Lab ── */}
      {tab === 'lab' && (
        <LabEditor
          labs={labs}
          onChange={setLabs}
          sections={sectionOptions}
          editing={editing}
          openLabId={openLabId}
        />
      )}
    </CreatorLayout>
  );
};

export default ModuleEditor;
