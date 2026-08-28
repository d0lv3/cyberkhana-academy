import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  FileText,
  Network,
  Eye,
  HelpCircle,
  BookOpen,
  ShieldCheck,
  Users,
  Plus,
  Trash2,
} from 'lucide-react';
import CreatorLayout from '../../components/creators/CreatorLayout';
import BilingualInput from '../../components/creators/BilingualInput';
import TagInput from '../../components/creators/TagInput';
import CoverImageUploader from '../../components/creators/CoverImageUploader';
import BilingualMarkdown from '../../components/creators/BilingualMarkdown';
import MarkdownPreview from '../../components/creators/MarkdownPreview';
import QuizEditor, { cleanQuiz } from '../../components/creators/QuizEditor';
import SimulationBuilder from '../../components/creators/SimulationBuilder';
import NetworkSimulator from '../../components/network-sim/NetworkSimulator';
import Button from '../../components/ui/EnhancedButton';
import EnhancedCard from '../../components/ui/EnhancedCard';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../contexts/AuthContext';
import {
  saveNetworkingLesson,
  getNetworkingLessonById,
  saveItemAsAdmin,
} from '../../services/creatorDataService';
import {
  makeCreatorMeta,
  statusOf,
  type ContentStatus,
  type CreatorNetworkingLesson,
  type QuizQuestion,
} from '../../services/creatorTypes';
import { networkingLessons } from '../../data/networking';
import { builtinToEditableLesson } from '../../data/builtinCourse';
import { ADMIN_NETWORKING_STASH, type AdminNetworkingStash } from './networkingEditStash';
import {
  hasSimulation,
  toLocalizedText,
  type NetworkSimulation,
} from '../../components/network-sim/types';

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);
}

function generateId(): string {
  return `net-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const emptySimulation = (slug: string): NetworkSimulation => ({
  id: `sim-${slug || 'new'}`,
  nodes: [],
  edges: [],
  steps: [],
});

type Tab = 'lesson' | 'simulation';

const NetworkingEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast, ToastContainer } = useToast();
  const { user } = useAuth();
  const isEditing = !!id;
  /* Editing someone else's lesson in place, ownership kept. Two ways to get
   * here: platform moderation (?admin=1) or a share the owner gave you
   * (?shared=1). Neither is gated on the client beyond the stash being present:
   * the server authorises every write on its own, by role or by grant. */
  const isAdminEdit = searchParams.get('admin') === '1' || searchParams.get('shared') === '1';
  const viaShare = searchParams.get('shared') === '1';
  // Admin editing a built-in lesson: the first save writes an override (copy-on-write).
  const isBuiltinEdit = searchParams.get('builtin') === '1' && user?.role === 'admin';

  const [tab, setTab] = useState<Tab>('lesson');
  const [titleEn, setTitleEn] = useState('');
  const [titleAr, setTitleAr] = useState('');
  const [descEn, setDescEn] = useState('');
  const [descAr, setDescAr] = useState('');
  const [slug, setSlug] = useState('');
  const [order, setOrder] = useState(100);
  const [estimatedMinutes, setEstimatedMinutes] = useState(10);
  const [tags, setTags] = useState<string[]>([]);
  const [coverSvg, setCoverSvg] = useState('');
  const [markdownContent, setMarkdownContent] = useState({ en: '', ar: '' });
  /* The language tab shared by the markdown editor and its preview, and by
   * the simulation builder and its preview. One per pane, because an author
   * translating the body is not necessarily translating the topology in the
   * same sitting. */
  const [mdLang, setMdLang] = useState<'en' | 'ar'>('en');
  const [simLang, setSimLang] = useState<'en' | 'ar'>('en');
  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [simulation, setSimulation] = useState<NetworkSimulation>(emptySimulation(''));
  /* Whether this lesson ships a simulation at all. Held apart from the
   * simulation itself so switching it off and back on inside one editing
   * session does not throw away a topology the author already built. */
  const [withSimulation, setWithSimulation] = useState(false);
  const [status, setStatus] = useState<ContentStatus>('draft');
  const [isSaving, setIsSaving] = useState(false);
  const [existingLesson, setExistingLesson] = useState<CreatorNetworkingLesson | null>(null);
  const [adminCtx, setAdminCtx] = useState<{ ownerId: string; ownerName: string } | null>(null);

  // Load existing lesson for editing
  useEffect(() => {
    if (!id) return;

    let lesson: CreatorNetworkingLesson | undefined;

    if (isBuiltinEdit) {
      // Built-in lessons ship in the bundle, so resolve straight from static
      // data — no stash to go stale on a refresh.
      const builtin = networkingLessons.find((l) => l.id === id);
      if (builtin) lesson = builtinToEditableLesson(builtin);
    } else if (isAdminEdit) {
      // Another author's lesson: it came from an admin-only endpoint, so the
      // list page hands it over through sessionStorage.
      try {
        const raw = sessionStorage.getItem(ADMIN_NETWORKING_STASH);
        const stash: AdminNetworkingStash | null = raw ? JSON.parse(raw) : null;
        if (stash && stash.id === id && stash.lesson) {
          lesson = stash.lesson;
          setAdminCtx({ ownerId: stash.ownerId, ownerName: stash.ownerName });
        }
      } catch {
        /* fall through to the error below */
      }
    } else {
      lesson = getNetworkingLessonById(id);
    }

    if (!lesson) {
      if (isBuiltinEdit || isAdminEdit) {
        toast('error', 'Could not open this lesson for editing. Open it again from the list.');
        navigate('/creators/networking');
      }
      return;
    }

    setExistingLesson(lesson);
    setTitleEn(lesson.title.en);
    setTitleAr(lesson.title.ar);
    setDescEn(lesson.description.en);
    setDescAr(lesson.description.ar);
    setSlug(lesson.slug);
    setOrder(lesson.order);
    setEstimatedMinutes(lesson.estimatedMinutes);
    setTags(lesson.tags);
    setCoverSvg(lesson.coverSvg ?? '');
    setMarkdownContent(toLocalizedText(lesson.markdownContent));
    setQuiz(lesson.quiz ?? []);
    setSimulation(lesson.simulation ?? emptySimulation(lesson.slug));
    setWithSimulation(hasSimulation(lesson.simulation));
    setStatus(statusOf(lesson));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isBuiltinEdit, isAdminEdit]);

  // Auto-generate slug from English title
  useEffect(() => {
    if (!isEditing) setSlug(generateSlug(titleEn));
  }, [titleEn, isEditing]);

  const handleSave = async () => {
    if (!markdownContent.en.trim() && markdownContent.ar.trim()) {
      // Arabic alone would leave English readers with a blank lesson, since
      // every fallback in the app runs towards English.
      toast('error', 'Write the English lesson body too; Arabic alone has nothing to fall back to.');
      setTab('lesson');
      setMdLang('en');
      return;
    }
    if (!titleEn.trim()) {
      toast('error', 'An English title is required before saving.');
      setTab('lesson');
      return;
    }
    // Only a lesson that claims a simulation owes one: markdown-only lessons
    // publish on their own.
    if (status === 'published' && withSimulation && simulation.steps.length === 0) {
      toast('error', 'Add at least one simulation step before publishing, or turn the simulation off.');
      setTab('simulation');
      return;
    }

    setIsSaving(true);
    const author = user?.displayName || 'CyberKhana';
    const finalSlug = slug || generateSlug(titleEn);

    const lesson: CreatorNetworkingLesson = {
      id: existingLesson?.id || generateId(),
      slug: finalSlug,
      title: { en: titleEn, ar: titleAr },
      description: { en: descEn, ar: descAr },
      order,
      estimatedMinutes,
      tags,
      coverSvg: coverSvg.trim() || undefined,
      markdownContent,
      quiz: cleanQuiz(quiz),
      simulation:
        withSimulation && simulation.nodes.length > 0
          ? { ...simulation, id: simulation.id || `sim-${finalSlug}` }
          : undefined,
      ...(existingLesson
        ? {
            isCreatorContent: true as const,
            isPublished: status === 'published',
            status,
            authorName: existingLesson.authorName || author,
            createdAt: existingLesson.createdAt,
            updatedAt: new Date().toISOString(),
          }
        : makeCreatorMeta(status, author)),
    };

    // Admin edit: write back into the original author's bucket via the server.
    if (adminCtx) {
      try {
        await saveItemAsAdmin(adminCtx.ownerId, 'networking-lessons', lesson);
        sessionStorage.removeItem(ADMIN_NETWORKING_STASH);
      } catch (err) {
        setIsSaving(false);
        toast('error', err instanceof Error ? err.message : 'Could not save this lesson.');
        return;
      }
    } else {
      // Normal own-bucket save. Copy-on-write of a built-in lesson lands here
      // too: it writes a lesson under the built-in's id, which overrides it.
      saveNetworkingLesson(lesson);
    }

    toast('success', status === 'published' ? 'Lesson published.' : 'Lesson saved.');
    setTimeout(() => {
      setIsSaving(false);
      navigate('/creators/networking');
    }, 500);
  };

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'lesson', label: 'Lesson', icon: FileText },
    { key: 'simulation', label: 'Simulation', icon: Network },
  ];

  return (
    <CreatorLayout
      title={isEditing ? 'Edit Networking Lesson' : 'New Networking Lesson'}
      subtitle={titleEn || undefined}
      backTo="/creators/networking"
      backLabel="Networking"
      onSave={handleSave}
      isSaving={isSaving}
      status={status}
      onStatusChange={setStatus}
      previewHref={isEditing && slug ? `#/fundamentals/networking/lesson/${slug}` : undefined}
    >
      <ToastContainer />

      {/* ── Built-in copy-on-write banner ── */}
      {isBuiltinEdit && !adminCtx && (
        <div className="flex items-start gap-3 rounded-lg border border-[#9fef00]/30 bg-[#9fef00]/10 px-4 py-3 mb-4">
          <BookOpen size={16} className="text-[#9fef00] mt-0.5 flex-shrink-0" />
          <div className="text-xs text-[#d2d7e3]">
            <span className="font-bold text-[#9fef00]">Editing a built-in lesson</span>, saving
            creates an editable copy that replaces the original everywhere. Existing student
            progress is preserved.
          </div>
        </div>
      )}

      {/* ── Editing on someone else's behalf ── */}
      {adminCtx && (
        <div
          className={`flex items-start gap-3 rounded-lg border px-4 py-3 mb-4 ${
            viaShare
              ? 'border-[#60a5fa]/30 bg-[#60a5fa]/10'
              : 'border-[#f3a43a]/30 bg-[#f3a43a]/10'
          }`}
        >
          {viaShare ? (
            <Users size={16} className="text-[#60a5fa] mt-0.5 flex-shrink-0" />
          ) : (
            <ShieldCheck size={16} className="text-[#f3a43a] mt-0.5 flex-shrink-0" />
          )}
          <div className="text-xs text-[#d2d7e3]">
            <span className={`font-bold ${viaShare ? 'text-[#60a5fa]' : 'text-[#f3a43a]'}`}>
              {viaShare ? 'Shared with you' : 'Admin edit'}
            </span>{' '}
            you're editing{' '}
            <span className="font-semibold text-[#f3f6ff]">{adminCtx.ownerName}</span>'s lesson.
            Authorship is kept; saving updates it for everyone who can see it.
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-[#0b1019] border border-[#263248] rounded-xl p-1 w-fit mb-6" dir="ltr">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              tab === t.key
                ? 'bg-[#1a2332] text-[#f3f6ff] border border-[#263248]'
                : 'text-[#6e7a94] hover:text-[#d2d7e3]'
            }`}
          >
            <t.icon size={15} /> {t.label}
            {t.key === 'simulation' && withSimulation && simulation.steps.length > 0 && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#00a859]/15 text-[#00a859]">
                {simulation.steps.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === 'lesson' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT: Form */}
          <div className="space-y-6">
            <EnhancedCard padding="lg">
              <h3 className="text-sm font-bold text-[#f3f6ff] mb-4">Lesson Details</h3>
              <div className="space-y-4">
                <BilingualInput
                  labelEn="Title (English)"
                  labelAr="العنوان (العربية)"
                  valueEn={titleEn}
                  valueAr={titleAr}
                  onChangeEn={setTitleEn}
                  onChangeAr={setTitleAr}
                  placeholder="e.g. IP Addressing & Communication"
                  required
                />

                <BilingualInput
                  labelEn="Description (English)"
                  labelAr="الوصف (العربية)"
                  valueEn={descEn}
                  valueAr={descAr}
                  onChangeEn={setDescEn}
                  onChangeAr={setDescAr}
                  placeholder="Brief description of the lesson..."
                  multiline
                />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#9aa5bf] mb-1.5">Slug</label>
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      className="w-full bg-[#0a0f18] border border-[#263248] rounded-lg px-3 py-2 text-sm text-[#d2d7e3] font-mono focus:outline-none focus:border-[#00a859]/50 transition-colors"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#9aa5bf] mb-1.5">Order</label>
                    <input
                      type="number"
                      value={order}
                      onChange={(e) => setOrder(Number(e.target.value))}
                      className="w-full bg-[#0a0f18] border border-[#263248] rounded-lg px-3 py-2 text-sm text-[#d2d7e3] focus:outline-none focus:border-[#00a859]/50 transition-colors"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#9aa5bf] mb-1.5">Est. Minutes</label>
                    <input
                      type="number"
                      value={estimatedMinutes}
                      onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                      className="w-full bg-[#0a0f18] border border-[#263248] rounded-lg px-3 py-2 text-sm text-[#d2d7e3] focus:outline-none focus:border-[#00a859]/50 transition-colors"
                      dir="ltr"
                    />
                  </div>
                </div>

                <TagInput value={tags} onChange={setTags} label="Tags" placeholder="Add a tag..." />

                <CoverImageUploader
                  value={coverSvg}
                  onChange={setCoverSvg}
                  accent="#60a5fa"
                  label="Cover"
                  shownOn="the lesson card"
                />
              </div>
            </EnhancedCard>

            <EnhancedCard padding="lg">
              <h3 className="text-sm font-bold text-[#f3f6ff] mb-4">Markdown Content</h3>
              <BilingualMarkdown
                value={markdownContent}
                onChange={setMarkdownContent}
                lang={mdLang}
                onLangChange={setMdLang}
              />
            </EnhancedCard>

            <EnhancedCard padding="lg">
              <div className="flex items-center gap-2 mb-1">
                <HelpCircle size={15} className="text-[#9fef00]" />
                <h3 className="text-sm font-bold text-[#f3f6ff]">
                  Lesson Quiz <span className="text-[#6e7a94] font-normal">(optional)</span>
                </h3>
              </div>
              <p className="text-xs text-[#6e7a94] mb-4">
                With a quiz, students must pass it (≥70%) to complete the lesson. Without one,
                they get a manual "Mark as complete" button.
              </p>
              <QuizEditor value={quiz} onChange={setQuiz} />
            </EnhancedCard>
          </div>

          {/* RIGHT: Preview */}
          <div className="space-y-4">
            <EnhancedCard padding="none" className="overflow-hidden sticky top-4">
              <div className="px-4 py-3 border-b border-[#263248] bg-[#0b1019] flex items-center gap-2">
                <Eye size={13} className="text-[#6e7a94]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#6e7a94]">
                  Live Preview
                </span>
                <span className="ms-auto text-[10px] font-bold text-[#6e7a94]">
                  {mdLang === 'ar' ? 'العربية' : 'English'}
                </span>
              </div>
              <div
                className="max-h-[calc(100vh-220px)] overflow-y-auto custom-scrollbar p-6"
                dir={mdLang === 'ar' ? 'rtl' : 'ltr'}
              >
                <MarkdownPreview content={markdownContent[mdLang]} />
              </div>
            </EnhancedCard>
          </div>
        </div>
      ) : !withSimulation ? (
        /* ── The lesson has opted out of a simulation ── */
        <EnhancedCard padding="xl" className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-[#263248] bg-[#0f1726]">
            <Network size={20} className="text-[#60a5fa]" />
          </div>
          <h3 className="text-sm font-bold text-[#f3f6ff] mb-2">No simulation on this lesson</h3>
          <p className="mx-auto mb-5 max-w-md text-xs leading-relaxed text-[#6e7a94]">
            Students will read this lesson full width, with no side panel. Add a simulation if the
            topic is better shown than described, packets moving through a topology, a handshake
            step by step.
          </p>
          <Button size="sm" leftIcon={<Plus size={14} />} onClick={() => setWithSimulation(true)}>
            Add a simulation
          </Button>
          {simulation.nodes.length > 0 && (
            <p className="mt-4 text-[11px] text-[#4d5a73]">
              The {simulation.nodes.length} device{simulation.nodes.length === 1 ? '' : 's'} you
              already built are kept until you save.
            </p>
          )}
        </EnhancedCard>
      ) : (
        <div className="space-y-4">
          {/* ── Opt out again, without losing the work mid-session ── */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#263248] bg-[#0b1019] px-4 py-3">
            <div className="flex items-start gap-3">
              <Network size={15} className="mt-0.5 flex-shrink-0 text-[#60a5fa]" />
              <div>
                <p className="text-xs font-bold text-[#f3f6ff]">This lesson has a simulation</p>
                <p className="text-[11px] text-[#6e7a94]">
                  It sits beside the reading pane, and students can resize or minimise it.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setWithSimulation(false)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#263248] px-3 py-1.5 text-[11px] font-semibold text-[#9aa5bf] transition-colors hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400"
            >
              <Trash2 size={12} /> Remove the simulation
            </button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* LEFT: Builder */}
            <div>
              <SimulationBuilder
                value={simulation}
                onChange={setSimulation}
                lang={simLang}
                onLangChange={setSimLang}
              />
            </div>

            {/* RIGHT: Live simulation preview */}
            <div>
              <EnhancedCard padding="none" className="overflow-hidden sticky top-4">
                <div className="px-4 py-3 border-b border-[#263248] bg-[#0b1019] flex items-center gap-2">
                  <Eye size={13} className="text-[#6e7a94]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#6e7a94]">
                    Simulation Preview
                  </span>
                  <span className="ms-auto text-[10px] font-bold text-[#6e7a94]">
                    {simLang === 'ar' ? 'العربية' : 'English'}
                  </span>
                </div>
                <div className="p-4">
                  {simulation.nodes.length === 0 ? (
                    <div className="h-[420px] flex items-center justify-center text-center text-sm text-[#4d5a73]">
                      Add devices and steps to preview the simulation.
                    </div>
                  ) : (
                    <div className="h-[520px]">
                      <NetworkSimulator
                        simulation={simulation}
                        lang={simLang}
                        onNodeMove={(id, x, y) =>
                          setSimulation((s) => ({
                            ...s,
                            nodes: s.nodes.map((n) => (n.id === id ? { ...n, x, y } : n)),
                          }))
                        }
                      />
                    </div>
                  )}
                </div>
              </EnhancedCard>
            </div>
          </div>
        </div>
      )}
    </CreatorLayout>
  );
};

export default NetworkingEditor;
