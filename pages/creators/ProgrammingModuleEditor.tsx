import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CreatorLayout from '../../components/creators/CreatorLayout';
import BilingualInput from '../../components/creators/BilingualInput';
import EnhancedCard from '../../components/ui/EnhancedCard';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../contexts/AuthContext';
import { saveProgrammingModule, getCreatorProgrammingPatches } from '../../services/creatorDataService';
import { makeCreatorMeta, statusOf, type ContentStatus, type CreatorMeta } from '../../services/creatorTypes';
import { parseYouTubeId, youtubeEmbedUrl } from '../../services/youtube';
import type { ProgrammingModule } from '../../data/programming/types';

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);
}

function generateId(): string {
  return `mod-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

type CreatorModule = ProgrammingModule & Partial<CreatorMeta>;

const ProgrammingModuleEditor: React.FC = () => {
  const { langSlug, moduleId } = useParams<{ langSlug: string; moduleId: string }>();
  const navigate = useNavigate();
  const { toast, ToastContainer } = useToast();
  const { user } = useAuth();
  const isEditing = !!moduleId;

  const [titleEn, setTitleEn] = useState('');
  const [titleAr, setTitleAr] = useState('');
  const [descEn, setDescEn] = useState('');
  const [descAr, setDescAr] = useState('');
  const [slug, setSlug] = useState('');
  const [videoInput, setVideoInput] = useState('');
  const [order, setOrder] = useState(100);
  const [status, setStatus] = useState<ContentStatus>('draft');
  const [isSaving, setIsSaving] = useState(false);
  const [existing, setExisting] = useState<CreatorModule | null>(null);

  // Load existing module for editing
  useEffect(() => {
    if (langSlug && moduleId) {
      const patch = getCreatorProgrammingPatches().find((p) => p.languageSlug === langSlug);
      const mod = patch?.newModules.find((m) => m.id === moduleId);
      if (mod) {
        setExisting(mod);
        setTitleEn(mod.title.en);
        setTitleAr(mod.title.ar);
        setDescEn(mod.description.en);
        setDescAr(mod.description.ar);
        setSlug(mod.slug);
        setVideoInput(mod.videoId || '');
        setOrder(mod.order);
        setStatus(statusOf(mod));
      }
    }
  }, [langSlug, moduleId]);

  // Auto-generate slug (new modules only — concepts are keyed by module slug)
  useEffect(() => {
    if (!isEditing) setSlug(generateSlug(titleEn));
  }, [titleEn, isEditing]);

  const handleSave = () => {
    if (!titleEn.trim()) {
      toast('error', 'An English title is required.');
      return;
    }
    if (!langSlug) {
      toast('error', 'Missing language context.');
      return;
    }

    setIsSaving(true);
    const author = existing?.authorName || user?.displayName || 'CyberKhana';
    const now = new Date().toISOString();

    const mod: CreatorModule = {
      id: existing?.id || generateId(),
      slug: slug || generateSlug(titleEn),
      title: { en: titleEn, ar: titleAr },
      description: { en: descEn, ar: descAr },
      order,
      videoId: parseYouTubeId(videoInput) || undefined,
      concepts: existing?.concepts ?? [],
      ...(existing
        ? {
            isCreatorContent: true as const,
            isPublished: status === 'published',
            status,
            authorName: author,
            createdAt: existing.createdAt || now,
            updatedAt: now,
          }
        : makeCreatorMeta(status, author)),
    };

    saveProgrammingModule(langSlug, mod);
    toast('success', status === 'published' ? 'Module published.' : isEditing ? 'Module updated.' : 'Module created.');
    setTimeout(() => {
      setIsSaving(false);
      navigate('/creators/programming');
    }, 500);
  };

  const langName = `${langSlug?.charAt(0).toUpperCase()}${langSlug?.slice(1) || ''}`;

  return (
    <CreatorLayout
      title={isEditing ? `Edit ${langName} Module` : `New ${langName} Module`}
      subtitle={isEditing ? titleEn || undefined : undefined}
      backTo="/creators/programming"
      backLabel="Programming"
      onSave={handleSave}
      isSaving={isSaving}
      status={status}
      onStatusChange={setStatus}
    >
      <ToastContainer />
      <EnhancedCard padding="lg" className="max-w-2xl">
        <h3 className="text-sm font-bold text-[#f3f6ff] mb-4">Module Details</h3>
        <div className="space-y-4">
          <BilingualInput
            labelEn="Title (English)"
            labelAr="العنوان (العربية)"
            valueEn={titleEn}
            valueAr={titleAr}
            onChangeEn={setTitleEn}
            onChangeAr={setTitleAr}
            placeholder="e.g. Control Flow"
            required
          />

          <BilingualInput
            labelEn="Description (English)"
            labelAr="الوصف (العربية)"
            valueEn={descEn}
            valueAr={descAr}
            onChangeEn={setDescEn}
            onChangeAr={setDescAr}
            placeholder="Module description..."
            multiline
          />

          <div>
            <label className="block text-xs font-semibold text-[#9aa5bf] mb-1.5">
              YouTube video <span className="text-[#4d5a73] font-normal">(optional — URL or ID, shown at the top of each lesson)</span>
            </label>
            <input
              type="text"
              value={videoInput}
              onChange={(e) => setVideoInput(e.target.value)}
              placeholder="https://youtu.be/dQw4w9WgXcQ  or  dQw4w9WgXcQ"
              className="w-full bg-[#0a0f18] border border-[#263248] rounded-lg px-3 py-2 text-sm text-[#d2d7e3] font-mono focus:outline-none focus:border-[#00a859]/50"
              dir="ltr"
            />
            {videoInput.trim() && !parseYouTubeId(videoInput) && (
              <p className="text-[10px] text-[#f3a43a] mt-1">Couldn't find a YouTube video id in that — paste the video URL or its 11-character id.</p>
            )}
            {parseYouTubeId(videoInput) && (
              <div className="mt-2 aspect-video overflow-hidden rounded-lg border border-[#263248]">
                <iframe
                  className="h-full w-full"
                  src={youtubeEmbedUrl(parseYouTubeId(videoInput))}
                  title="Module video preview"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#9aa5bf] mb-1.5">Slug</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                disabled={isEditing}
                title={isEditing ? 'Slugs are locked after creation — concepts are linked to them.' : undefined}
                className="w-full bg-[#0a0f18] border border-[#263248] rounded-lg px-3 py-2 text-sm text-[#d2d7e3] font-mono focus:outline-none focus:border-[#00a859]/50 disabled:opacity-50 disabled:cursor-not-allowed"
                dir="ltr"
              />
              {isEditing && (
                <p className="text-[10px] text-[#4d5a73] mt-1">
                  Locked — concepts in this module are linked to this slug.
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#9aa5bf] mb-1.5">Order</label>
              <input
                type="number"
                value={order}
                onChange={(e) => setOrder(Number(e.target.value))}
                className="w-full bg-[#0a0f18] border border-[#263248] rounded-lg px-3 py-2 text-sm text-[#d2d7e3] focus:outline-none focus:border-[#00a859]/50"
                dir="ltr"
              />
            </div>
          </div>
        </div>
      </EnhancedCard>
    </CreatorLayout>
  );
};

export default ProgrammingModuleEditor;
