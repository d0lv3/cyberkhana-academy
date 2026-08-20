import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { BookOpen, ShieldCheck } from 'lucide-react';
import CreatorLayout from '../../components/creators/CreatorLayout';
import BilingualInput from '../../components/creators/BilingualInput';
import EnhancedCard from '../../components/ui/EnhancedCard';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../contexts/AuthContext';
import {
  saveProgrammingModule,
  getCreatorProgrammingPatches,
  saveProgrammingAsAdmin,
} from '../../services/creatorDataService';
import { makeCreatorMeta, statusOf, type ContentStatus, type CreatorMeta } from '../../services/creatorTypes';
import { parseYouTubeId, youtubeEmbedUrl } from '../../services/youtube';
import { programmingLanguages } from '../../data/programming';
import { builtinToEditableProgrammingModule } from '../../data/builtinCourse';
import { ADMIN_PROGRAMMING_STASH, type AdminProgrammingStash } from './programmingEditStash';
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
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast, ToastContainer } = useToast();
  const { user } = useAuth();
  const isEditing = !!moduleId;
  // Admin editing another author's published module (in place, ownership kept).
  const isAdminEdit = searchParams.get('admin') === '1' && user?.role === 'admin';
  // Admin editing a built-in module: the first save writes an override.
  const isBuiltinEdit = searchParams.get('builtin') === '1' && user?.role === 'admin';

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
  const [adminCtx, setAdminCtx] = useState<{ ownerId: string; ownerName: string } | null>(null);

  // Load existing module for editing
  useEffect(() => {
    if (!langSlug || !moduleId) return;

    let mod: CreatorModule | undefined;

    if (isBuiltinEdit) {
      // Built-in modules ship in the bundle — resolve straight from static data.
      const builtin = programmingLanguages
        .find((l) => l.slug === langSlug)
        ?.modules.find((m) => m.id === moduleId);
      if (builtin) mod = builtinToEditableProgrammingModule(builtin);
    } else if (isAdminEdit) {
      try {
        const raw = sessionStorage.getItem(ADMIN_PROGRAMMING_STASH);
        const stash: AdminProgrammingStash | null = raw ? JSON.parse(raw) : null;
        if (stash && stash.kind === 'module' && stash.item.id === moduleId) {
          mod = stash.item;
          setAdminCtx({ ownerId: stash.ownerId, ownerName: stash.ownerName });
        }
      } catch {
        /* fall through to the error below */
      }
    } else {
      const patch = getCreatorProgrammingPatches().find((p) => p.languageSlug === langSlug);
      mod = patch?.newModules.find((m) => m.id === moduleId);
    }

    if (!mod) {
      if (isBuiltinEdit || isAdminEdit) {
        toast('error', 'Could not open this module for editing. Open it again from the list.');
        navigate('/creators/programming');
      }
      return;
    }

    setExisting(mod);
    setTitleEn(mod.title.en);
    setTitleAr(mod.title.ar);
    setDescEn(mod.description.en);
    setDescAr(mod.description.ar);
    setSlug(mod.slug);
    setVideoInput(mod.videoId || '');
    setOrder(mod.order);
    setStatus(statusOf(mod));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [langSlug, moduleId, isBuiltinEdit, isAdminEdit]);

  // Auto-generate slug (new modules only — concepts are keyed by module slug)
  useEffect(() => {
    if (!isEditing) setSlug(generateSlug(titleEn));
  }, [titleEn, isEditing]);

  const handleSave = async () => {
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

    // Admin edit: write back into the original author's patch via the server.
    if (adminCtx) {
      try {
        await saveProgrammingAsAdmin({
          ownerId: adminCtx.ownerId,
          languageSlug: langSlug,
          kind: 'module',
          item: mod,
        });
        sessionStorage.removeItem(ADMIN_PROGRAMMING_STASH);
      } catch (err) {
        setIsSaving(false);
        toast('error', err instanceof Error ? err.message : 'Could not save this module.');
        return;
      }
    } else {
      // Normal own-patch save. Copy-on-write of a built-in module lands here
      // too: it writes a module under the built-in's id, which overrides it.
      saveProgrammingModule(langSlug, mod);
    }

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

      {/* ── Built-in copy-on-write banner ── */}
      {isBuiltinEdit && !adminCtx && (
        <div className="flex items-start gap-3 rounded-lg border border-[#9fef00]/30 bg-[#9fef00]/10 px-4 py-3 mb-4 max-w-2xl">
          <BookOpen size={16} className="text-[#9fef00] mt-0.5 flex-shrink-0" />
          <div className="text-xs text-[#d2d7e3]">
            <span className="font-bold text-[#9fef00]">Editing a built-in module</span> — saving
            creates an editable copy that replaces the original everywhere. Its lessons stay where
            they are; edit those individually from the list.
          </div>
        </div>
      )}

      {/* ── Admin moderation banner ── */}
      {adminCtx && (
        <div className="flex items-start gap-3 rounded-lg border border-[#f3a43a]/30 bg-[#f3a43a]/10 px-4 py-3 mb-4 max-w-2xl">
          <ShieldCheck size={16} className="text-[#f3a43a] mt-0.5 flex-shrink-0" />
          <div className="text-xs text-[#d2d7e3]">
            <span className="font-bold text-[#f3a43a]">Admin edit</span> — you're editing{' '}
            <span className="font-semibold text-[#f3f6ff]">{adminCtx.ownerName}</span>'s published
            module. Authorship is kept; saving updates the live module for everyone.
          </div>
        </div>
      )}

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
