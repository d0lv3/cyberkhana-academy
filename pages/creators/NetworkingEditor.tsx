import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText, Network, Eye, HelpCircle } from 'lucide-react';
import CreatorLayout from '../../components/creators/CreatorLayout';
import BilingualInput from '../../components/creators/BilingualInput';
import TagInput from '../../components/creators/TagInput';
import CoverSvgUploader from '../../components/creators/CoverSvgUploader';
import MarkdownUploader from '../../components/creators/MarkdownUploader';
import MarkdownPreview from '../../components/creators/MarkdownPreview';
import QuizEditor, { cleanQuiz } from '../../components/creators/QuizEditor';
import SimulationBuilder from '../../components/creators/SimulationBuilder';
import NetworkSimulator from '../../components/network-sim/NetworkSimulator';
import EnhancedCard from '../../components/ui/EnhancedCard';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../contexts/AuthContext';
import { saveNetworkingLesson, getNetworkingLessonById } from '../../services/creatorDataService';
import {
  makeCreatorMeta,
  statusOf,
  type ContentStatus,
  type CreatorNetworkingLesson,
  type QuizQuestion,
} from '../../services/creatorTypes';
import type { NetworkSimulation } from '../../components/network-sim/types';

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
  const navigate = useNavigate();
  const { toast, ToastContainer } = useToast();
  const { user } = useAuth();
  const isEditing = !!id;

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
  const [markdownContent, setMarkdownContent] = useState('');
  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [simulation, setSimulation] = useState<NetworkSimulation>(emptySimulation(''));
  const [status, setStatus] = useState<ContentStatus>('draft');
  const [isSaving, setIsSaving] = useState(false);
  const [existingLesson, setExistingLesson] = useState<CreatorNetworkingLesson | null>(null);

  // Load existing lesson for editing
  useEffect(() => {
    if (id) {
      const lesson = getNetworkingLessonById(id);
      if (lesson) {
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
        setMarkdownContent(lesson.markdownContent);
        setQuiz(lesson.quiz ?? []);
        setSimulation(lesson.simulation ?? emptySimulation(lesson.slug));
        setStatus(statusOf(lesson));
      }
    }
  }, [id]);

  // Auto-generate slug from English title
  useEffect(() => {
    if (!isEditing) setSlug(generateSlug(titleEn));
  }, [titleEn, isEditing]);

  const handleSave = () => {
    if (!titleEn.trim()) {
      toast('error', 'An English title is required before saving.');
      setTab('lesson');
      return;
    }
    if (status === 'published' && simulation.steps.length === 0) {
      toast('error', 'Add at least one simulation step before publishing.');
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
      simulation: { ...simulation, id: simulation.id || `sim-${finalSlug}` },
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

    saveNetworkingLesson(lesson);
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
            {t.key === 'simulation' && simulation.steps.length > 0 && (
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

                <CoverSvgUploader value={coverSvg} onChange={setCoverSvg} accent="#60a5fa" kind="network" />
              </div>
            </EnhancedCard>

            <EnhancedCard padding="lg">
              <h3 className="text-sm font-bold text-[#f3f6ff] mb-4">Markdown Content</h3>
              <MarkdownUploader
                value={markdownContent}
                onChange={setMarkdownContent}
                placeholder={'# Lesson Title\n\nYour lesson content in markdown...'}
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
              </div>
              <div className="max-h-[calc(100vh-220px)] overflow-y-auto custom-scrollbar p-6">
                <MarkdownPreview content={markdownContent} />
              </div>
            </EnhancedCard>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* LEFT: Builder */}
          <div>
            <SimulationBuilder value={simulation} onChange={setSimulation} />
          </div>

          {/* RIGHT: Live simulation preview */}
          <div>
            <EnhancedCard padding="none" className="overflow-hidden sticky top-4">
              <div className="px-4 py-3 border-b border-[#263248] bg-[#0b1019] flex items-center gap-2">
                <Eye size={13} className="text-[#6e7a94]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#6e7a94]">
                  Simulation Preview
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
      )}
    </CreatorLayout>
  );
};

export default NetworkingEditor;
