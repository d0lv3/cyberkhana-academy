import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Code, ShieldCheck } from 'lucide-react';
import CreatorLayout from '../../components/creators/CreatorLayout';
import BilingualInput from '../../components/creators/BilingualInput';
import EnhancedCard from '../../components/ui/EnhancedCard';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../contexts/AuthContext';
import { getProgrammingLanguages } from '../../data/programming';
import {
  getCreatorLanguageBySlug,
  saveProgrammingLanguage,
  saveProgrammingAsAdmin,
} from '../../services/creatorDataService';
import {
  makeCreatorMeta,
  statusOf,
  type ContentStatus,
  type CreatorProgrammingLanguage,
} from '../../services/creatorTypes';
import { ADMIN_PROGRAMMING_STASH, type AdminProgrammingStash } from './programmingEditStash';

const inputCls =
  'w-full bg-[#0a0f18] border border-[#263248] rounded-lg px-3 py-2 text-sm text-[#d2d7e3] focus:outline-none focus:border-[#00a859]/50 transition-colors placeholder:text-[#3d4a63]';

const generateSlug = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 40);

/**
 * Create/edit a creator-defined programming language (name, slug, color,
 * description). Modules/lessons are added afterwards from the Programming
 * studio, exactly like the built-in languages. Requires the
 * 'programming-languages' permission (buttons that lead here are gated; the
 * server independently rejects unauthorized writes).
 */
const ProgrammingLanguageEditor: React.FC = () => {
  const { slug: editSlug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast, ToastContainer } = useToast();
  const { user } = useAuth();
  const isEditing = !!editSlug;
  // Admin editing another author's published language (in place, ownership kept).
  const isAdminEdit = searchParams.get('admin') === '1' && user?.role === 'admin';

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [color, setColor] = useState('#9fef00');
  const [descEn, setDescEn] = useState('');
  const [descAr, setDescAr] = useState('');
  const [status, setStatus] = useState<ContentStatus>('draft');
  const [isSaving, setIsSaving] = useState(false);
  const [adminDef, setAdminDef] = useState<CreatorProgrammingLanguage | null>(null);
  const [adminCtx, setAdminCtx] = useState<{ ownerId: string; ownerName: string } | null>(null);

  // Load an existing definition when editing.
  useEffect(() => {
    if (!editSlug) return;

    let def: CreatorProgrammingLanguage | undefined;

    if (isAdminEdit) {
      // Another author's language: the list page hands it over, since it lives
      // in their bucket rather than mine.
      try {
        const raw = sessionStorage.getItem(ADMIN_PROGRAMMING_STASH);
        const stash: AdminProgrammingStash | null = raw ? JSON.parse(raw) : null;
        if (stash && stash.kind === 'language' && stash.item.slug === editSlug) {
          def = stash.item;
          setAdminDef(stash.item);
          setAdminCtx({ ownerId: stash.ownerId, ownerName: stash.ownerName });
        }
      } catch {
        /* fall through to the error below */
      }
    } else {
      def = getCreatorLanguageBySlug(editSlug);
    }

    if (!def) {
      toast('error', 'Language not found.');
      navigate('/creators/programming');
      return;
    }
    setName(def.name);
    setSlug(def.slug);
    setColor(def.color || '#9fef00');
    setDescEn(def.description?.en ?? '');
    setDescAr(def.description?.ar ?? '');
    setStatus(statusOf(def));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editSlug, isAdminEdit]);

  // Auto-slug for new languages.
  useEffect(() => {
    if (!isEditing) setSlug(generateSlug(name));
  }, [name, isEditing]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast('error', 'A language name is required.');
      return;
    }
    const finalSlug = (isEditing ? editSlug! : slug || generateSlug(name)).trim();
    if (!finalSlug) {
      toast('error', 'A slug is required.');
      return;
    }
    // Slug collisions: static languages + everything already in the catalog +
    // my own definitions (except the one being edited).
    if (!isEditing) {
      const taken =
        getProgrammingLanguages().some((l) => l.slug === finalSlug) ||
        !!getCreatorLanguageBySlug(finalSlug);
      if (taken) {
        toast('error', `"${finalSlug}" is already used by another language.`);
        return;
      }
    }

    setIsSaving(true);
    const existing = adminDef ?? (isEditing ? getCreatorLanguageBySlug(editSlug!) : undefined);
    const def: CreatorProgrammingLanguage = {
      slug: finalSlug,
      name: name.trim(),
      color,
      description: { en: descEn.trim(), ar: descAr.trim() },
      ...(existing
        ? {
            isCreatorContent: true as const,
            isPublished: status === 'published',
            status,
            authorName: existing.authorName,
            createdAt: existing.createdAt,
            updatedAt: new Date().toISOString(),
          }
        : makeCreatorMeta(status, user?.displayName || 'CyberKhana')),
    };

    // Admin edit: write back into the original author's patch via the server.
    if (adminCtx) {
      try {
        await saveProgrammingAsAdmin({
          ownerId: adminCtx.ownerId,
          languageSlug: finalSlug,
          kind: 'language',
          item: def,
        });
        sessionStorage.removeItem(ADMIN_PROGRAMMING_STASH);
      } catch (err) {
        setIsSaving(false);
        toast('error', err instanceof Error ? err.message : 'Could not save this language.');
        return;
      }
    } else {
      saveProgrammingLanguage(def);
    }

    toast('success', status === 'published' ? 'Language published.' : 'Language saved.');
    setTimeout(() => {
      setIsSaving(false);
      navigate('/creators/programming');
    }, 500);
  };

  return (
    <CreatorLayout
      title={isEditing ? 'Edit Language' : 'New Language'}
      subtitle={name || undefined}
      backTo="/creators/programming"
      backLabel="Programming"
      onSave={handleSave}
      isSaving={isSaving}
      status={status}
      onStatusChange={setStatus}
    >
      <ToastContainer />

      {/* ── Admin moderation banner ── */}
      {adminCtx && (
        <div className="flex items-start gap-3 rounded-lg border border-[#f3a43a]/30 bg-[#f3a43a]/10 px-4 py-3 mb-4">
          <ShieldCheck size={16} className="text-[#f3a43a] mt-0.5 flex-shrink-0" />
          <div className="text-xs text-[#d2d7e3]">
            <span className="font-bold text-[#f3a43a]">Admin edit</span> — you're editing{' '}
            <span className="font-semibold text-[#f3f6ff]">{adminCtx.ownerName}</span>'s published
            language. Authorship is kept; saving updates the live language for everyone.
          </div>
        </div>
      )}

      <EnhancedCard padding="lg">
        <div className="flex items-center gap-2 mb-4">
          <Code size={15} style={{ color }} />
          <h3 className="text-sm font-bold text-[#f3f6ff]">Language Details</h3>
        </div>

        <div className="space-y-4 max-w-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#9aa5bf] mb-1.5">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. JavaScript"
                className={inputCls}
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#9aa5bf] mb-1.5">Slug</label>
              <input
                value={slug}
                onChange={(e) => setSlug(generateSlug(e.target.value))}
                disabled={isEditing}
                className={`${inputCls} font-mono disabled:opacity-50`}
                dir="ltr"
              />
              {isEditing && (
                <p className="mt-1 text-[11px] text-[#6e7a94]">The slug can't change after creation.</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#9aa5bf] mb-1.5">Accent</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-9 h-9 rounded border border-[#263248] bg-transparent cursor-pointer flex-shrink-0"
                />
                <input
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className={`${inputCls} font-mono`}
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          <BilingualInput
            labelEn="Description (English)"
            labelAr="الوصف (العربية)"
            valueEn={descEn}
            valueAr={descAr}
            onChangeEn={setDescEn}
            onChangeAr={setDescAr}
            placeholder="What will students learn in this language?"
            multiline
          />

          <p className="text-[11px] text-[#6e7a94]">
            After saving, add modules and lessons to this language from the Programming studio —
            same as the built-in languages. The cover image is set there too.
          </p>
        </div>
      </EnhancedCard>
    </CreatorLayout>
  );
};

export default ProgrammingLanguageEditor;
