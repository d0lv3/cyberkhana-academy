import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  FileText,
  Film,
  Layers,
  BookOpen,
  HelpCircle,
} from 'lucide-react';
import CreatorLayout from '../../components/creators/CreatorLayout';
import BilingualInput from '../../components/creators/BilingualInput';
import TagInput from '../../components/creators/TagInput';
import BilingualMarkdown from '../../components/creators/BilingualMarkdown';
import MarkdownPreview from '../../components/creators/MarkdownPreview';
import CoverImageUploader from '../../components/creators/CoverImageUploader';
import QuizEditor, { cleanQuiz } from '../../components/creators/QuizEditor';
import EnhancedCard from '../../components/ui/EnhancedCard';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../contexts/AuthContext';
import {
  saveOSModule,
  getOSModuleById,
  saveStandaloneModule,
  getStandaloneModuleById,
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
  type QuizQuestion,
} from '../../services/creatorTypes';
import { MODULE_DOMAINS, MODULE_DOMAIN_META, type ModuleDomain } from '../../data/fundamentalsData';
import type { Difficulty } from '../../types';

interface ModuleEditorProps {
  /** 'os' → OS Fundamentals module · 'standalone' → Modules-hub module */
  kind: 'os' | 'standalone';
}

const DIFFICULTIES: Difficulty[] = ['Beginner', 'Easy', 'Medium', 'Hard', 'Expert'];

const inputCls =
  'w-full bg-[#0a0f18] border border-[#263248] rounded-lg px-3 py-2 text-sm text-[#d2d7e3] focus:outline-none focus:border-[#00a859]/50 transition-colors placeholder:text-[#3d4a63]';

const uid = (p: string) => `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
const generateSlug = (title: string) =>
  title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 60);

const newSection = () => ({ id: uid('sec'), title: 'New Section', subtitle: '', videoId: '', markdownContent: { en: '', ar: '' } });
const newChapter = (): CreatorModuleChapter => ({ id: uid('ch'), title: 'New Chapter', sections: [newSection()] });

/** Rough mm:ss reading/watch time so the viewer sidebar shows something sane. */
function estimateDuration(s: { markdownContent: LocalizedMarkdown; videoId?: string }): string {
  const body = mdFor(s.markdownContent, 'en') || mdFor(s.markdownContent, 'ar');
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  const mins = Math.max(1, Math.round(words / 180) + (s.videoId ? 4 : 0));
  return `${mins}:00`;
}

const ModuleEditor: React.FC<ModuleEditorProps> = ({ kind }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast, ToastContainer } = useToast();
  const { user } = useAuth();
  const isEditing = !!id;
  const isOS = kind === 'os';

  const getById = isOS ? getOSModuleById : getStandaloneModuleById;
  const saveModule = isOS ? saveOSModule : saveStandaloneModule;
  const listRoute = isOS ? '/creators/os-modules' : '/creators/modules';
  const noun = isOS ? 'OS Module' : 'Module';

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
  const [selected, setSelected] = useState<{ ci: number; si: number } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [existing, setExisting] = useState<CreatorFundamentalModule | null>(null);
  const [mdLang, setMdLang] = useState<'en' | 'ar'>('en');

  // Load existing
  useEffect(() => {
    if (id) {
      const mod = getById(id);
      if (mod) {
        setExisting(mod);
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
        // chapters: prefer structured, fall back to legacy single markdown
        if (mod.chapters && mod.chapters.length) {
          setChapters(
            mod.chapters.map((ch) => ({
              ...ch,
              sections: ch.sections.map((s) => ({ ...s, markdownContent: toLocalizedMarkdown(s.markdownContent) })),
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
      setChapters([newChapter()]);
    }
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-slug for new
  useEffect(() => {
    if (!isEditing) setSlug(generateSlug(titleEn));
  }, [titleEn, isEditing]);

  // Keep a valid selection
  useEffect(() => {
    if (chapters.length && !selected) setSelected({ ci: 0, si: 0 });
  }, [chapters, selected]);

  const totalSections = useMemo(() => chapters.reduce((s, c) => s + c.sections.length, 0), [chapters]);

  /* ── Structure ops ── */
  const addChapter = () => {
    setChapters((p) => [...p, newChapter()]);
  };
  const removeChapter = (ci: number) => {
    setChapters((p) => p.filter((_, i) => i !== ci));
    setSelected(null);
  };
  const moveChapter = (ci: number, dir: -1 | 1) => {
    setChapters((p) => {
      const next = [...p];
      const t = ci + dir;
      if (t < 0 || t >= next.length) return p;
      [next[ci], next[t]] = [next[t], next[ci]];
      return next;
    });
    setSelected(null);
  };
  const setChapterTitle = (ci: number, title: string) =>
    setChapters((p) => p.map((c, i) => (i === ci ? { ...c, title } : c)));

  const addSection = (ci: number) => {
    setChapters((p) => p.map((c, i) => (i === ci ? { ...c, sections: [...c.sections, newSection()] } : c)));
    setSelected({ ci, si: chapters[ci].sections.length });
  };
  const removeSection = (ci: number, si: number) => {
    setChapters((p) => p.map((c, i) => (i === ci ? { ...c, sections: c.sections.filter((_, j) => j !== si) } : c)));
    setSelected(null);
  };
  const moveSection = (ci: number, si: number, dir: -1 | 1) => {
    setChapters((p) =>
      p.map((c, i) => {
        if (i !== ci) return c;
        const secs = [...c.sections];
        const t = si + dir;
        if (t < 0 || t >= secs.length) return c;
        [secs[si], secs[t]] = [secs[t], secs[si]];
        return { ...c, sections: secs };
      })
    );
    setSelected({ ci, si: Math.max(0, Math.min(si + dir, chapters[ci].sections.length - 1)) });
  };
  const updateSection = (ci: number, si: number, patch: Partial<CreatorModuleChapter['sections'][number]>) =>
    setChapters((p) =>
      p.map((c, i) => (i === ci ? { ...c, sections: c.sections.map((s, j) => (j === si ? { ...s, ...patch } : s)) } : c))
    );

  const activeSection = selected ? chapters[selected.ci]?.sections[selected.si] : undefined;

  /* ── Build the full module object from the current editor state ── */
  const buildModule = (): CreatorFundamentalModule => {
    const resolvedAuthorName = existing?.authorName || user?.displayName || author;
    // OS modules are pinned to their pillar; standalone modules are free-topic
    // ('general') — legacy categories are preserved on edit.
    const cat = isOS ? 'operating-systems' : existing?.category ?? 'general';

    // Derive a content type from the sections
    const hasVideo = chapters.some((c) => c.sections.some((s) => s.videoId));
    const hasText = chapters.some((c) =>
      c.sections.some((s) => (mdFor(s.markdownContent, 'en') || mdFor(s.markdownContent, 'ar')).trim())
    );
    const contentType: CreatorFundamentalModule['contentType'] =
      hasVideo && hasText ? 'mixed' : hasVideo ? 'video' : 'text';

    // Flatten to courseData so the existing viewer can render it
    const courseData = {
      id: slug || generateSlug(titleEn),
      title: titleEn,
      description: descEn,
      modules: chapters.map((ch) => ({
        id: ch.id,
        title: ch.title,
        lectures: ch.sections.map((s) => {
          const quiz = cleanQuiz(s.quiz);
          return {
            id: s.id,
            title: s.title,
            subtitle: s.subtitle || '',
            videoId: s.videoId || '',
            duration: estimateDuration(s),
            // 'embedded' marker keeps the viewer's hasQuiz/gating checks working
            quiz: quiz.length ? 'embedded' : null,
            quizQuestions: quiz.length ? quiz : undefined,
            markdownContent: s.markdownContent,
          };
        }),
      })),
    };

    const totalQuizzes = chapters.reduce(
      (sum, c) => sum + c.sections.filter((s) => cleanQuiz(s.quiz).length > 0).length,
      0
    );

    return {
      id: existing?.id || uid('mod'),
      slug: slug || generateSlug(titleEn),
      title: { en: titleEn, ar: titleAr },
      description: { en: descEn, ar: descAr },
      category: cat,
      contentType,
      difficulty,
      tags,
      author,
      estimatedHours,
      coverImage: coverImage || undefined,
      domain,
      totalLessons: totalSections,
      totalModules: chapters.length,
      totalQuizzes,
      iconColor,
      courseData,
      chapters,
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

  /* ── Save ── */
  const handleSave = () => {
    if (!titleEn.trim()) {
      toast('error', 'An English title is required.');
      return;
    }
    if (totalSections === 0) {
      toast('error', 'Add at least one section.');
      return;
    }

    setIsSaving(true);
    saveModule(buildModule());
    toast('success', status === 'published' ? `${noun} published.` : `${noun} saved.`);
    setTimeout(() => {
      setIsSaving(false);
      navigate(listRoute);
    }, 500);
  };

  /* ── Preview as published: snapshot the current (unsaved) draft and open it
   * in the real student viewer in a new tab. ── */
  const handlePreview = () => {
    if (!titleEn.trim()) {
      toast('error', 'Add an English title before previewing.');
      return;
    }
    if (totalSections === 0) {
      toast('error', 'Add at least one section to preview.');
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
      toast('error', 'Could not open the preview.');
    }
  };

  return (
    <CreatorLayout
      title={isEditing ? `Edit ${noun}` : `New ${noun}`}
      subtitle={titleEn || undefined}
      backTo={listRoute}
      backLabel={isOS ? 'OS & Modules' : 'Modules'}
      onSave={handleSave}
      isSaving={isSaving}
      onPreview={handlePreview}
      status={status}
      onStatusChange={setStatus}
    >
      <ToastContainer />

      {/* ── Metadata ── */}
      <EnhancedCard padding="lg">
        <h3 className="text-sm font-bold text-[#f3f6ff] mb-4">{noun} Details</h3>
        <div className="space-y-4">
          <BilingualInput
            labelEn="Title (English)"
            labelAr="العنوان (العربية)"
            valueEn={titleEn}
            valueAr={titleAr}
            onChangeEn={setTitleEn}
            onChangeAr={setTitleAr}
            placeholder="e.g. Windows Security Fundamentals"
            required
          />
          <BilingualInput
            labelEn="Description (English)"
            labelAr="الوصف (العربية)"
            valueEn={descEn}
            valueAr={descAr}
            onChangeEn={setDescEn}
            onChangeAr={setDescAr}
            placeholder="Short module description..."
            multiline
          />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#9aa5bf] mb-1.5">Slug</label>
              <input value={slug} onChange={(e) => setSlug(e.target.value)} className={`${inputCls} font-mono`} dir="ltr" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#9aa5bf] mb-1.5">Difficulty</label>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)} className={inputCls}>
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#9aa5bf] mb-1.5">Est. Hours</label>
              <input type="number" value={estimatedHours} onChange={(e) => setEstimatedHours(Number(e.target.value))} step="0.5" min="0.5" className={inputCls} dir="ltr" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#9aa5bf] mb-1.5">Accent</label>
              <div className="flex items-center gap-2">
                <input type="color" value={iconColor} onChange={(e) => setIconColor(e.target.value)} className="w-9 h-9 rounded border border-[#263248] bg-transparent cursor-pointer flex-shrink-0" />
                <input value={iconColor} onChange={(e) => setIconColor(e.target.value)} className={`${inputCls} font-mono`} dir="ltr" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#9aa5bf] mb-1.5">Author</label>
              <input value={author} onChange={(e) => setAuthor(e.target.value)} className={inputCls} dir="ltr" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#9aa5bf] mb-1.5">Category</label>
              <select value={domain} onChange={(e) => setDomain(e.target.value as ModuleDomain)} className={inputCls}>
                {MODULE_DOMAINS.map((d) => (
                  <option key={d} value={d}>{MODULE_DOMAIN_META[d].label.en}</option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-[#6e7a94]">Offensive, Defensive, or General — shown as the module's tag.</p>
            </div>
          </div>

          <CoverImageUploader value={coverImage} onChange={setCoverImage} accent={iconColor} />

          <TagInput value={tags} onChange={setTags} label="Tags" />

          {isOS && (
            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm font-medium text-[#d2d7e3]">Also show on Modules page</p>
                <p className="text-xs text-[#6e7a94]">Surface this OS module in the standalone Modules hub too</p>
              </div>
              <button
                type="button"
                onClick={() => setShowInModules(!showInModules)}
                className={`relative w-11 h-6 rounded-full transition-colors ${showInModules ? 'bg-[#00a859]' : 'bg-[#263248]'}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${showInModules ? 'left-[22px]' : 'left-0.5'}`} />
              </button>
            </div>
          )}
        </div>
      </EnhancedCard>

      {/* ── Structure + Section editor ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-6">
        {/* Outline */}
        <EnhancedCard padding="none" className="lg:col-span-2 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#263248] bg-[#0b1019] flex items-center justify-between">
            <span className="text-sm font-bold text-[#f3f6ff] flex items-center gap-2">
              <Layers size={15} className="text-[#f3a43a]" /> Structure
            </span>
            <span className="text-xs text-[#6e7a94]" dir="ltr">
              {chapters.length} ch · {totalSections} sec
            </span>
          </div>

          <div className="max-h-[520px] overflow-y-auto custom-scrollbar p-3 space-y-4">
            {chapters.map((ch, ci) => (
              <div key={ch.id} className="rounded-lg border border-[#263248] bg-[#0d1117]">
                {/* Chapter header */}
                <div className="flex items-center gap-2 px-2.5 py-2 border-b border-[#263248]">
                  <span className="text-[10px] font-bold text-[#6e7a94] w-4 text-center flex-shrink-0">{ci + 1}</span>
                  <input
                    value={ch.title}
                    onChange={(e) => setChapterTitle(ci, e.target.value)}
                    className="flex-1 min-w-0 bg-transparent text-xs font-bold text-[#f3f6ff] focus:outline-none"
                    dir="ltr"
                  />
                  <button onClick={() => moveChapter(ci, -1)} disabled={ci === 0} className="w-6 h-6 flex items-center justify-center rounded text-[#4d5a73] hover:text-[#d2d7e3] disabled:opacity-20">
                    <ArrowUp size={12} />
                  </button>
                  <button onClick={() => moveChapter(ci, 1)} disabled={ci === chapters.length - 1} className="w-6 h-6 flex items-center justify-center rounded text-[#4d5a73] hover:text-[#d2d7e3] disabled:opacity-20">
                    <ArrowDown size={12} />
                  </button>
                  <button onClick={() => removeChapter(ci)} className="w-6 h-6 flex items-center justify-center rounded text-[#4d5a73] hover:text-red-400">
                    <Trash2 size={12} />
                  </button>
                </div>

                {/* Sections */}
                <div className="p-1.5 space-y-1">
                  {ch.sections.map((s, si) => {
                    const isActive = selected?.ci === ci && selected?.si === si;
                    return (
                      <div
                        key={s.id}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors ${
                          isActive ? 'bg-[#00a859]/10 border border-[#00a859]/25' : 'hover:bg-[#182235] border border-transparent'
                        }`}
                        onClick={() => setSelected({ ci, si })}
                      >
                        {s.videoId ? (
                          <Film size={12} className="text-[#60a5fa] flex-shrink-0" />
                        ) : (
                          <FileText size={12} className="text-[#6e7a94] flex-shrink-0" />
                        )}
                        <span className={`flex-1 min-w-0 truncate text-xs ${isActive ? 'text-[#f3f6ff] font-semibold' : 'text-[#c4cad6]'}`}>
                          {s.title || 'Untitled section'}
                        </span>
                        <button onClick={(e) => { e.stopPropagation(); moveSection(ci, si, -1); }} disabled={si === 0} className="w-5 h-5 flex items-center justify-center rounded text-[#4d5a73] hover:text-[#d2d7e3] disabled:opacity-20">
                          <ArrowUp size={11} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); moveSection(ci, si, 1); }} disabled={si === ch.sections.length - 1} className="w-5 h-5 flex items-center justify-center rounded text-[#4d5a73] hover:text-[#d2d7e3] disabled:opacity-20">
                          <ArrowDown size={11} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); removeSection(ci, si); }} className="w-5 h-5 flex items-center justify-center rounded text-[#4d5a73] hover:text-red-400">
                          <Trash2 size={11} />
                        </button>
                      </div>
                    );
                  })}
                  <button
                    onClick={() => addSection(ci)}
                    className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[11px] font-medium text-[#6e7a94] hover:text-[#00a859] transition-colors"
                  >
                    <Plus size={12} /> Add Section
                  </button>
                </div>
              </div>
            ))}

            <button
              onClick={addChapter}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-[#6e7a94] bg-[#0d1420] border border-dashed border-[#263248] hover:border-[#f3a43a]/40 hover:text-[#f3a43a] transition-all"
            >
              <Plus size={13} /> Add Chapter
            </button>
          </div>
        </EnhancedCard>

        {/* Section editor */}
        <div className="lg:col-span-3 space-y-4">
          {activeSection && selected ? (
            <>
              <EnhancedCard padding="lg">
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen size={15} className="text-[#00a859]" />
                  <h3 className="text-sm font-bold text-[#f3f6ff]">Section Content</h3>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#9aa5bf] mb-1.5">Section Title</label>
                      <input
                        value={activeSection.title}
                        onChange={(e) => updateSection(selected.ci, selected.si, { title: e.target.value })}
                        className={inputCls}
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#9aa5bf] mb-1.5">Subtitle (optional)</label>
                      <input
                        value={activeSection.subtitle || ''}
                        onChange={(e) => updateSection(selected.ci, selected.si, { subtitle: e.target.value })}
                        className={inputCls}
                        dir="ltr"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#9aa5bf] mb-1.5">YouTube Video ID (optional)</label>
                    <input
                      value={activeSection.videoId || ''}
                      onChange={(e) => updateSection(selected.ci, selected.si, { videoId: e.target.value })}
                      placeholder="e.g. dQw4w9WgXcQ"
                      className={`${inputCls} font-mono`}
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#9aa5bf] mb-1.5">Markdown Content</label>
                    <BilingualMarkdown
                      value={toLocalizedMarkdown(activeSection.markdownContent)}
                      onChange={(v) => updateSection(selected.ci, selected.si, { markdownContent: v })}
                      lang={mdLang}
                      onLangChange={setMdLang}
                    />
                  </div>
                </div>
              </EnhancedCard>

              {/* ── Section quiz ── */}
              <EnhancedCard padding="lg">
                <div className="flex items-center gap-2 mb-1">
                  <HelpCircle size={15} className="text-[#9fef00]" />
                  <h3 className="text-sm font-bold text-[#f3f6ff]">
                    Section Quiz <span className="text-[#6e7a94] font-normal">(optional)</span>
                  </h3>
                </div>
                <p className="text-xs text-[#6e7a94] mb-4">
                  Add multiple-choice questions students answer after this section. Options are
                  shuffled for each attempt.
                </p>
                <QuizEditor
                  value={activeSection.quiz ?? []}
                  onChange={(quiz) => updateSection(selected.ci, selected.si, { quiz })}
                />
              </EnhancedCard>

              <EnhancedCard padding="none" className="overflow-hidden">
                <div className="px-4 py-3 border-b border-[#263248] bg-[#0b1019] flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#6e7a94]">Section Preview</span>
                  <span className="text-[10px] font-semibold text-[#6e7a94]">{mdLang === 'ar' ? 'العربية' : 'English'}</span>
                </div>
                {activeSection.videoId && (
                  <div className="aspect-video border-b border-[#263248]">
                    <iframe
                      className="w-full h-full"
                      src={`https://www.youtube.com/embed/${activeSection.videoId}`}
                      title="Section video"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                )}
                <div className="p-6 max-h-[420px] overflow-y-auto custom-scrollbar">
                  <MarkdownPreview content={mdFor(activeSection.markdownContent, mdLang)} />
                </div>
              </EnhancedCard>
            </>
          ) : (
            <EnhancedCard padding="xl" className="text-center">
              <div className="w-12 h-12 rounded-xl bg-[#121a2a] border border-[#263248] flex items-center justify-center mx-auto mb-3">
                <ChevronRight size={20} className="text-[#4d5a73]" />
              </div>
              <p className="text-sm text-[#6e7a94]">Select a section to edit its content.</p>
            </EnhancedCard>
          )}
        </div>
      </div>
    </CreatorLayout>
  );
};

export default ModuleEditor;
