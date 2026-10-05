import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus,
  Check,
  Trash2,
  ArrowUp,
  ArrowDown,
  Search,
  ListChecks,
  Route,
  GripVertical,
  Eye,
  Clock,
  Users,
  Award,
  Lock,
} from 'lucide-react';
import CreatorLayout from '../../components/creators/CreatorLayout';
import BilingualInput from '../../components/creators/BilingualInput';
import TagInput from '../../components/creators/TagInput';
import CoverImageUploader from '../../components/creators/CoverImageUploader';
import EnhancedCard from '../../components/ui/EnhancedCard';
import DifficultyBadge from '../../components/ui/DifficultyBadge';
import { coverImageSrc } from '../../data/fundamentalsData';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../contexts/AuthContext';
import { savePath, getPathById } from '../../services/creatorDataService';
import { saveSharedItem } from '../../services/collabService';
import { SHARED_PATH_STASH, type SharedPathStash } from './sharedPathStash';
import {
  makeCreatorMeta,
  statusOf,
  type ContentStatus,
  type CreatorPath,
  type PathStep,
} from '../../services/creatorTypes';
import { buildPathCatalog } from '../../data/pathCatalog';
import ExamEditor, { Switch } from '../../components/creators/ExamEditor';
import ExamActivity from '../../components/creators/ExamActivity';
import CertificateTemplate from '../../components/certificates/CertificateTemplate';
import { useLang } from '../../contexts/LangContext';
import { hasPerm } from '../../services/permissions';
import {
  blankCertificate,
  blankExam,
  cleanExam,
  examHasContent,
  examInfoOf,
  publishProblem,
  shapeProblem,
  type PathCertificate,
  type PathExam,
} from '../../services/examService';
import { certificateLink, type CertificateData } from '../../services/certificateService';
import type { Difficulty } from '../../types';

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);
}

function generateId(): string {
  return `path-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const DIFFICULTIES: Difficulty[] = ['Beginner', 'Easy', 'Medium', 'Hard', 'Expert'];
const inputCls =
  'w-full bg-[#0a0f18] border border-[#263248] rounded-lg px-3 py-2 text-sm text-[#d2d7e3] focus:outline-none focus:border-[#00a859]/50 transition-colors placeholder:text-[#7c8aa6]';

const PathEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  /* A path the owner shared with me. The client only checks the stash; the
   * server authorises the write by grant. */
  const viaShare = searchParams.get('shared') === '1';
  const [sharedCtx, setSharedCtx] = useState<{ ownerId: string; ownerName: string } | null>(null);
  const navigate = useNavigate();
  const { toast, ToastContainer } = useToast();
  const { user } = useAuth();
  const isEditing = !!id;

  const [titleEn, setTitleEn] = useState('');
  const [titleAr, setTitleAr] = useState('');
  const [descEn, setDescEn] = useState('');
  const [descAr, setDescAr] = useState('');
  const [slug, setSlug] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('Beginner');
  const [color, setColor] = useState('#a78bfa');
  const [cover, setCover] = useState('');
  const [estimatedHours, setEstimatedHours] = useState(2);
  const [tags, setTags] = useState<string[]>([]);
  const [steps, setSteps] = useState<PathStep[]>([]);
  const [status, setStatus] = useState<ContentStatus>('draft');
  const [isSaving, setIsSaving] = useState(false);
  const [existing, setExisting] = useState<CreatorPath | null>(null);

  /* ── Final exam and certificate ──
   * Both take the "Exams and certificates" permission, which an admin grants.
   * Without it they ride along exactly as they were loaded. */
  const { isArabic } = useLang();
  const say = (en: string, ar: string) => (isArabic ? ar : en);
  const isAdmin = user?.role === 'admin';
  const canExam = hasPerm(user, 'exams');
  const [exam, setExam] = useState<PathExam>(blankExam);
  const [certificate, setCertificate] = useState<PathCertificate>(blankCertificate);
  const [activeAttempts, setActiveAttempts] = useState<number | undefined>(undefined);

  const [query, setQuery] = useState('');

  const catalog = useMemo(() => buildPathCatalog(), []);

  // Load existing path
  useEffect(() => {
    if (id) {
      let p = getPathById(id);
      if (viaShare) {
        p = undefined;
        try {
          const raw = sessionStorage.getItem(SHARED_PATH_STASH);
          const stash: SharedPathStash | null = raw ? JSON.parse(raw) : null;
          if (stash && stash.id === id) {
            p = stash.path;
            setSharedCtx({ ownerId: stash.ownerId, ownerName: stash.ownerName });
          }
        } catch {
          /* falls through to the guard below */
        }
        if (!p) {
          navigate('/creators/paths');
          return;
        }
      }
      if (p) {
        setExisting(p);
        setTitleEn(p.title.en);
        setTitleAr(p.title.ar);
        setDescEn(p.description.en);
        setDescAr(p.description.ar);
        setSlug(p.slug);
        setDifficulty(p.difficulty);
        setColor(p.color);
        setCover(p.coverImage || '');
        setEstimatedHours(p.estimatedHours);
        setTags(p.tags);
        setSteps(p.steps);
        setStatus(statusOf(p));
        setExam(p.exam ?? blankExam());
        setCertificate(p.certificate ?? blankCertificate());
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, viaShare]);

  // Auto-slug for new paths
  useEffect(() => {
    if (!isEditing) setSlug(generateSlug(titleEn));
  }, [titleEn, isEditing]);

  const stepKey = (s: { kind: string; refId: string }) => `${s.kind}:${s.refId}`;
  const addedKeys = useMemo(() => new Set(steps.map(stepKey)), [steps]);

  const addStep = (step: PathStep) => {
    if (addedKeys.has(stepKey(step))) return;
    setSteps((prev) => [...prev, step]);
  };
  const removeStep = (idx: number) => setSteps((prev) => prev.filter((_, i) => i !== idx));
  const moveStep = (idx: number, dir: -1 | 1) => {
    setSteps((prev) => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  /* Why the exam cannot go live as it stands, shown beside it while it is being built. */
  const examIssue = useMemo(
    () => (canExam ? publishProblem(cleanExam(exam), certificate) : null),
    [canExam, exam, certificate]
  );
  const taskPrompts = useMemo(() => {
    const prompts = new Map<string, string>();
    for (const section of exam.sections) {
      for (const version of section.versions) for (const task of version.tasks) prompts.set(task.id, task.prompt);
    }
    return prompts;
  }, [exam]);
  /* What the sheet will look like for this path, with a made-up holder. */
  const sampleCertificate = useMemo<CertificateData>(() => {
    const now = new Date().toISOString();
    return {
      code: '0'.repeat(32),
      name: 'Sara Al-Hashimi',
      username: user?.username ?? 'sara',
      university: null,
      pathTitle: certificate.title?.trim() || titleEn || 'Your learning path',
      difficulty,
      stepCount: steps.length,
      lessonCount: 0,
      hours: Math.max(1, Math.round(estimatedHours)),
      syllabus: steps.map((s) => s.title),
      practical: examInfoOf(cleanExam({ ...exam, enabled: true }))?.practical === true,
      distinction: false,
      pathCompletedAt: now,
      issuedAt: now,
      revoked: false,
    };
  }, [certificate.title, titleEn, difficulty, steps, estimatedHours, exam, user?.username]);

  const filteredCatalog = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return catalog;
    return catalog
      .map((g) => ({ ...g, items: g.items.filter((it) => it.title.toLowerCase().includes(q)) }))
      .filter((g) => g.items.length > 0);
  }, [catalog, query]);

  const handleSave = async (silent = false) => {
    if (isSaving) return;
    if (!titleEn.trim()) {
      if (!silent) toast('error', 'An English title is required.');
      return;
    }
    if (steps.length === 0) {
      if (!silent) toast('error', 'Add at least one step to the path.');
      return;
    }

    /* The exam and the certificate ride along untouched for someone who may
       not set them; otherwise they are tidied, and left out when blank, so
       saving a path never looks like setting an exam on it. */
    const tidyExam = cleanExam(exam);
    const nextExam = canExam ? (examHasContent(tidyExam) ? tidyExam : undefined) : existing?.exam;
    const nextCertificate = canExam
      ? certificate.enabled || certificate.title?.trim()
        ? { enabled: certificate.enabled, title: certificate.title?.trim() || undefined }
        : undefined
      : existing?.certificate;
    /* The server refuses a published path whose exam cannot be sat, and any
       path whose exam has a value out of range, so say why here first. */
    if (canExam) {
      const problem =
        status === 'published' ? publishProblem(nextExam, nextCertificate) : shapeProblem(nextExam, nextCertificate);
      if (problem) {
        if (!silent) toast('error', problem);
        return;
      }
    }

    setIsSaving(true);
    const author = existing?.authorName || user?.displayName || 'CyberKhana';

    const path: CreatorPath = {
      id: existing?.id || generateId(),
      slug: slug || generateSlug(titleEn),
      title: { en: titleEn, ar: titleAr },
      description: { en: descEn, ar: descAr },
      difficulty,
      color,
      coverImage: cover || undefined,
      tags,
      estimatedHours,
      steps,
      exam: nextExam,
      certificate: nextCertificate,
      ...(existing
        ? {
            isCreatorContent: true as const,
            isPublished: status === 'published',
            status,
            authorName: author,
            createdAt: existing.createdAt,
            updatedAt: new Date().toISOString(),
          }
        : makeCreatorMeta(status, author)),
    };

    // A shared path is written back into its owner's bucket, through the server.
    if (sharedCtx) {
      try {
        await saveSharedItem(sharedCtx.ownerId, 'paths', path);
        sessionStorage.setItem(SHARED_PATH_STASH, JSON.stringify({ id: path.id, ...sharedCtx, path }));
      } catch (err) {
        setIsSaving(false);
        toast('error', err instanceof Error ? err.message : 'Could not save this path.');
        return;
      }
    } else {
      savePath(path);
    }

    setExisting(path);
    setIsSaving(false);
    if (!silent) toast('success', status === 'published' ? 'Path published.' : 'Path saved.');
    if (!id) navigate(`/creators/paths/edit/${path.id}`, { replace: true });
  };

  return (
    <CreatorLayout
      title={isEditing ? 'Edit Learning Path' : 'New Learning Path'}
      subtitle={titleEn || undefined}
      backTo="/creators/paths"
      backLabel="Learning Paths"
      onSave={handleSave}
      autoSaveSnapshot={JSON.stringify([titleEn, titleAr, descEn, descAr, slug, difficulty, color, cover, tags, estimatedHours, steps, status, exam, certificate])}
      isSaving={isSaving}
      status={status}
      onStatusChange={setStatus}
    >
      <ToastContainer />

      {sharedCtx && (
        <div className="flex items-start gap-3 rounded-lg border border-[#60a5fa]/30 bg-[#60a5fa]/10 px-4 py-3 mb-4">
          <Users size={16} className="text-[#60a5fa] mt-0.5 flex-shrink-0" />
          <div className="text-xs text-[#d2d7e3]">
            <span className="font-bold text-[#60a5fa]">Shared with you</span> you're editing{' '}
            <span className="font-semibold text-[#f3f6ff]">{sharedCtx.ownerName}</span>'s path.
            Authorship is kept; saving updates it for everyone who can see it.
          </div>
        </div>
      )}

      {/* ── Details ── */}
      <EnhancedCard padding="lg">
        <h3 className="text-sm font-bold text-[#f3f6ff] mb-4">Path Details</h3>
        <div className="space-y-4">
          <BilingualInput
            labelEn="Title (English)"
            labelAr="العنوان (العربية)"
            valueEn={titleEn}
            valueAr={titleAr}
            onChangeEn={setTitleEn}
            onChangeAr={setTitleAr}
            placeholder="e.g. SOC Analyst Track"
            required
          />
          <BilingualInput
            labelEn="Description (English)"
            labelAr="الوصف (العربية)"
            valueEn={descEn}
            valueAr={descAr}
            onChangeEn={setDescEn}
            onChangeAr={setDescAr}
            placeholder="What will a student achieve by completing this path?"
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
              <input
                type="number"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(Number(e.target.value))}
                step="0.5"
                min="0.5"
                className={inputCls}
                dir="ltr"
              />
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
                <input value={color} onChange={(e) => setColor(e.target.value)} className={`${inputCls} font-mono`} dir="ltr" />
              </div>
            </div>
          </div>

          <TagInput value={tags} onChange={setTags} label="Tags" />

          <CoverImageUploader
            value={cover}
            onChange={setCover}
            accent={color}
            label="Cover Image"
            shownOn="the path card"
          />
        </div>
      </EnhancedCard>

      {/* ── Builder ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Catalog */}
        <EnhancedCard padding="none" className="overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#263248] bg-[#0b1019] flex items-center justify-between gap-3">
            <span className="text-sm font-bold text-[#f3f6ff]">Available Content</span>
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#7c8aa6]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search..."
                className="w-40 bg-[#0a0f18] border border-[#263248] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#d2d7e3] focus:outline-none focus:border-[#00a859]/50 placeholder:text-[#7c8aa6]"
                dir="ltr"
              />
            </div>
          </div>
          <div className="max-h-[460px] overflow-y-auto custom-scrollbar p-3 space-y-4">
            {filteredCatalog.every((g) => g.items.length === 0) ? (
              <p className="text-sm text-[#8592ad] text-center py-8">No matching content.</p>
            ) : (
              filteredCatalog.map((group) => (
                <div key={group.kind}>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#8592ad] px-1 mb-2">
                    {group.label}
                  </p>
                  <div className="space-y-1.5">
                    {group.items.map((item) => {
                      const added = addedKeys.has(stepKey(item));
                      return (
                        <button
                          key={stepKey(item)}
                          type="button"
                          onClick={() => addStep(item)}
                          disabled={added}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all ${
                            added
                              ? 'border-[#263248] bg-[#0d1117] opacity-60 cursor-default'
                              : 'border-[#263248] bg-[#0d1117] hover:border-[#354562] hover:bg-[#121a2a]'
                          }`}
                        >
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: item.accent }}
                          />
                          <span className="flex-1 min-w-0">
                            <span className="block text-xs font-semibold text-[#d2d7e3] truncate">{item.title}</span>
                            {item.subtitle && (
                              <span className="block text-[10px] text-[#8592ad] truncate" dir="ltr">{item.subtitle}</span>
                            )}
                          </span>
                          {added ? (
                            <Check size={14} className="text-[#00a859] flex-shrink-0" />
                          ) : (
                            <Plus size={14} className="text-[#8592ad] flex-shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </EnhancedCard>

        {/* Selected steps */}
        <EnhancedCard padding="none" className="overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#263248] bg-[#0b1019] flex items-center justify-between">
            <span className="text-sm font-bold text-[#f3f6ff] flex items-center gap-2">
              <ListChecks size={15} className="text-[#a78bfa]" /> Path Steps
            </span>
            <span className="text-xs text-[#8592ad]" dir="ltr">{steps.length} steps</span>
          </div>
          <div className="max-h-[460px] overflow-y-auto custom-scrollbar p-3">
            {steps.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="w-12 h-12 rounded-xl bg-[#0d1117] border border-[#263248] flex items-center justify-center mx-auto mb-3">
                  <Route size={20} className="text-[#7c8aa6]" />
                </div>
                <p className="text-sm text-[#8592ad]">
                  Pick content from the left to build your path.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {steps.map((step, idx) => (
                  <div
                    key={stepKey(step)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-[#263248] bg-[#0d1117]"
                  >
                    <GripVertical size={14} className="text-[#7c8aa6] flex-shrink-0" />
                    <span
                      className="w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                      style={{ backgroundColor: `${step.accent}15`, color: step.accent, border: `1px solid ${step.accent}30` }}
                      dir="ltr"
                    >
                      {idx + 1}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-xs font-semibold text-[#d2d7e3] truncate">{step.title}</span>
                      {step.subtitle && (
                        <span className="block text-[10px] text-[#8592ad] truncate" dir="ltr">{step.subtitle}</span>
                      )}
                    </span>
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => moveStep(idx, -1)}
                        disabled={idx === 0}
                        className="w-6 h-6 flex items-center justify-center rounded text-[#8592ad] hover:text-[#d2d7e3] hover:bg-[#182235] transition-all disabled:opacity-20"
                      >
                        <ArrowUp size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveStep(idx, 1)}
                        disabled={idx === steps.length - 1}
                        className="w-6 h-6 flex items-center justify-center rounded text-[#8592ad] hover:text-[#d2d7e3] hover:bg-[#182235] transition-all disabled:opacity-20"
                      >
                        <ArrowDown size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeStep(idx)}
                        className="w-6 h-6 flex items-center justify-center rounded text-[#8592ad] hover:text-red-400 hover:bg-red-500/10 transition-all"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </EnhancedCard>
      </div>

      {/* ── Final exam ── */}
      <EnhancedCard padding="lg" className="mt-6">
        {canExam ? (
          <ExamEditor
            value={exam}
            onChange={setExam}
            steps={steps}
            isAdmin={isAdmin}
            problem={examIssue}
            activeAttempts={activeAttempts}
          />
        ) : (
          <div className="flex items-start gap-3">
            <Lock size={16} className="mt-0.5 flex-shrink-0 text-[#8592ad]" />
            <div className="text-xs leading-relaxed text-[#9aa5bf]">
              <p className="text-sm font-bold text-[#f3f6ff]">{say('Final exam and certificate', 'الاختبار النهائي والشهادة')}</p>
              <p className="mt-1">
                {existing?.exam?.enabled
                  ? say(
                      'This path has a final exam. It is kept exactly as it is when you save. Changing it takes the "Exams and certificates" permission, which an admin grants.',
                      'لهذا المسار اختبار نهائي، ويبقى كما هو عند الحفظ. تعديله يتطلب صلاحية «الاختبارات والشهادات» التي يمنحها المشرف.'
                    )
                  : say(
                      'A path can end in a final exam that awards a certificate of achievement. Setting one takes the "Exams and certificates" permission, which an admin grants.',
                      'يمكن أن ينتهي المسار باختبار نهائي يمنح شهادة إنجاز. إعداده يتطلب صلاحية «الاختبارات والشهادات» التي يمنحها المشرف.'
                    )}
              </p>
            </div>
          </div>
        )}
      </EnhancedCard>

      {/* ── Certificate ── */}
      {canExam && (
        <EnhancedCard padding="lg" className="mt-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className="flex items-center gap-2 text-sm font-bold text-[#f3f6ff]">
                <Award size={15} className="text-[#9fef00]" /> {say('Certificate of achievement', 'شهادة الإنجاز')}
              </h3>
              <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[#8592ad]">
                {say(
                  'Awarded to whoever passes the final exam. It is one standard sheet for every path, with a public page anyone can open to check it. Only the title is yours to set.',
                  'تُمنح لمن ينجح في الاختبار النهائي. هي ورقة موحدة لكل المسارات، ولها صفحة عامة يستطيع أي شخص فتحها للتحقق منها. العنوان وحده قابل للتغيير.'
                )}
              </p>
            </div>
            <Switch
              on={certificate.enabled}
              onChange={(enabled) => setCertificate((c) => ({ ...c, enabled }))}
              label={say('Certificate of achievement', 'شهادة الإنجاز')}
            />
          </div>

          {certificate.enabled && (
            <div className="mt-5 space-y-4">
              {!exam.enabled && (
                <p className="rounded-lg border border-[#f3a43a]/40 bg-[#f3a43a]/[0.07] px-3 py-2.5 text-xs text-[#d2d7e3]">
                  {say(
                    'A certificate is awarded for passing the final exam, so switch the exam on above first.',
                    'تُمنح الشهادة عند النجاح في الاختبار النهائي، لذا فعّل الاختبار أعلاه أولًا.'
                  )}
                </p>
              )}
              <div className="max-w-xl">
                <label className="block text-xs font-semibold text-[#9aa5bf] mb-1.5">
                  {say('Title printed on the certificate', 'العنوان المطبوع على الشهادة')}
                </label>
                <input
                  value={certificate.title ?? ''}
                  onChange={(e) => setCertificate((c) => ({ ...c, title: e.target.value }))}
                  placeholder={titleEn || 'The English title of the path'}
                  maxLength={160}
                  dir="ltr"
                  className={inputCls}
                />
                <p className="mt-1.5 text-[11px] leading-relaxed text-[#7c8aa6]">
                  {say(
                    'Leave it empty to print the English title of the path. The sheet is in English for everyone, so it reads the same wherever it is shown.',
                    'اتركه فارغًا لطباعة عنوان المسار بالإنجليزية. الورقة بالإنجليزية للجميع، لتُقرأ بالشكل نفسه أينما عُرضت.'
                  )}
                </p>
              </div>
              <div className="overflow-hidden rounded-xl border border-[#263248]">
                <CertificateTemplate certificate={sampleCertificate} verifyUrl={certificateLink(sampleCertificate.code)} printable={false} />
              </div>
              <p className="text-[11px] leading-relaxed text-[#7c8aa6]">
                {say(
                  'A sample. The real one prints the name its holder confirms when they claim it, the date, and a code of its own.',
                  'هذه عينة. الشهادة الفعلية تطبع الاسم الذي يؤكده حاملها عند طلبها، والتاريخ، ورمزًا خاصًا بها.'
                )}
              </p>
            </div>
          )}
        </EnhancedCard>
      )}

      {existing?.exam?.enabled && (
        <ExamActivity
          pathId={existing.id}
          ownerId={sharedCtx?.ownerId}
          isAdmin={isAdmin}
          prompts={taskPrompts}
          onStats={(s) => setActiveAttempts(s.attempts.active)}
        />
      )}

      {/* ── Student preview ── */}
      <EnhancedCard padding="lg" className="mt-6">
        <div className="flex items-center gap-2 mb-5">
          <Eye size={15} className="text-[#a78bfa]" />
          <h3 className="text-sm font-bold text-[#f3f6ff]">Student Preview</h3>
        </div>

        {/* hero */}
        <div className="flex items-start gap-4 mb-6">
          {cover ? (
            <div
              className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border"
              style={{ borderColor: `${color}30` }}
            >
              <img src={coverImageSrc(cover)} alt="" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }}
            >
              <Route size={22} style={{ color }} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-black text-[#f3f6ff]">{titleEn || 'Untitled path'}</h2>
            {descEn && <p className="text-sm text-[#9aa5bf] mt-1">{descEn}</p>}
            <div className="flex items-center gap-3 mt-3" dir="ltr">
              <DifficultyBadge difficulty={difficulty} />
              <span className="flex items-center gap-1 text-xs text-[#8592ad]">
                <ListChecks size={12} /> {steps.length} steps
              </span>
              <span className="flex items-center gap-1 text-xs text-[#8592ad]">
                <Clock size={12} /> {estimatedHours}h
              </span>
            </div>
          </div>
        </div>

        {/* timeline */}
        {steps.length === 0 ? (
          <p className="text-sm text-[#8592ad] text-center py-6">
            Add steps to preview the curriculum students will follow.
          </p>
        ) : (
          <div className="relative">
            <div className="absolute left-[18px] top-3 bottom-3 w-px bg-[#263248]" />
            <div className="space-y-3">
              {steps.map((step, idx) => (
                <div
                  key={stepKey(step)}
                  className="relative z-10 flex items-center gap-4 rounded-xl border border-[#263248] bg-[#0d1117] p-3.5"
                >
                  <span
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 border-2"
                    style={{ backgroundColor: '#0d1117', color: step.accent, borderColor: `${step.accent}55` }}
                    dir="ltr"
                  >
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-[#f3f6ff] truncate">{step.title}</h4>
                    {step.subtitle && (
                      <p className="text-xs text-[#8592ad] truncate" dir="ltr">
                        {step.subtitle}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </EnhancedCard>
    </CreatorLayout>
  );
};

export default PathEditor;
