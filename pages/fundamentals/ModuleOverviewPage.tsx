import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Layers,
  Clock,
  BookOpen,
  ClipboardCheck,
  FlaskConical,
  Video,
  FileText,
  User,
  Check,
  PlayCircle,
  ChevronRight,
} from 'lucide-react';
import Button from '../../components/ui/EnhancedButton';
import DifficultyBadge from '../../components/ui/DifficultyBadge';
import LessonMarkdown from '../../components/ui/LessonMarkdown';
import ProgressBar from '../../components/ui/ProgressBar';
import { useLang } from '../../contexts/LangContext';
import { getViewableModuleBySlug } from '../../data/modulesData';
import {
  MODULE_DOMAIN_META,
  coverImageSrc,
  hasLabs,
  moduleDomain,
  moduleLearnPath,
  type FundamentalModule,
} from '../../data/fundamentalsData';
import {
  enrollInModule,
  getOSModuleDoneCount,
  isModuleEnrolled,
} from '../../services/progressService';

/* ─── Module overview ───
 *
 * A module's front door. Everything a student weighs before committing lives
 * here: what it covers, how long it runs, how hard it is, what shape the work
 * takes. The lessons themselves are one level down, behind the call to action,
 * so this page can stay about the decision rather than the reading.
 *
 * The description renders as markdown. Creators were already writing lists and
 * emphasis into that field and getting them back as literal asterisks; running
 * it through the same renderer the lessons use means a description can be a
 * real piece of writing, and it costs a creator nothing if they only type a
 * sentence.
 */

const contentTypeMeta = {
  video: { icon: Video, label: { en: 'Video', ar: 'فيديو' } },
  text: { icon: FileText, label: { en: 'Text', ar: 'نصي' } },
  mixed: { icon: Layers, label: { en: 'Mixed', ar: 'مختلط' } },
} as const;

/** One number and what it counts. The row of these is the module at a glance. */
const Stat: React.FC<{
  icon: React.ElementType;
  value: React.ReactNode;
  label: string;
  accent?: string;
}> = ({ icon: Icon, value, label, accent = '#8592ad' }) => (
  <div className="flex items-center gap-3 rounded-xl border border-[#263248] bg-[#121a2a] px-4 py-3">
    <Icon size={17} style={{ color: accent }} className="flex-shrink-0" />
    <div className="min-w-0">
      <p className="text-sm font-bold leading-none text-[#f3f6ff]" dir="ltr">
        {value}
      </p>
      <p className="mt-1 truncate text-[11px] font-medium text-[#8592ad]">{label}</p>
    </div>
  </div>
);

const ModuleOverviewPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { lang, t } = useLang();
  const ar = lang === 'ar';

  /* `__preview__` renders the unsaved draft the creator studio snapshotted,
     the same way the viewer does, so a creator previews the front door too. */
  const isPreview = slug === '__preview__';
  const mod = useMemo<FundamentalModule | undefined>(() => {
    if (isPreview) {
      try {
        const raw = localStorage.getItem('academy-module-preview');
        return raw ? JSON.parse(raw) : undefined;
      } catch {
        return undefined;
      }
    }
    return getViewableModuleBySlug(slug || '');
  }, [slug, isPreview]);

  const [enrolled, setEnrolled] = useState(() => (slug ? isModuleEnrolled(slug) : false));

  if (!mod) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <h2 className="mb-4 text-xl font-bold text-[#f3f6ff]">
            {ar ? 'الوحدة غير موجودة' : 'Module not found'}
          </h2>
          <Button variant="outline" onClick={() => navigate('/modules')}>
            {t('sidebar.modules')}
          </Button>
        </div>
      </div>
    );
  }

  const domain = MODULE_DOMAIN_META[moduleDomain(mod)];
  const content = contentTypeMeta[mod.contentType];
  const ContentIcon = content.icon;
  const description = mod.description[lang] || mod.description.en || mod.description.ar || '';

  const done = isPreview ? 0 : getOSModuleDoneCount(mod.slug);
  const totalLessons = mod.totalLessons || 0;
  const pct = totalLessons > 0 ? Math.round((done / totalLessons) * 100) : 0;
  const started = done > 0;
  const complete = totalLessons > 0 && done >= totalLessons;

  const enterModule = () => navigate(moduleLearnPath(mod));

  const handleEnroll = () => {
    if (isPreview) return;
    enrollInModule(mod.slug);
    setEnrolled(true);
    enterModule();
  };

  /* Where the module sits, so "back" goes where the student came from. */
  const backTo = mod.category === 'general' ? '/modules' : `/fundamentals/${mod.category}`;
  const backLabel = mod.category === 'general' ? t('sidebar.modules') : t('sidebar.fundamentals');

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(backTo)}
        className="inline-flex select-none items-center gap-2 text-sm text-[#8592ad] transition-colors touch:min-h-tap hover:text-[#d2d7e3]"
      >
        <ArrowLeft size={16} className="rtl-flip" />
        <span>{backLabel}</span>
      </button>

      {/* ── Hero ──
          The module's own art, its name, and the one thing to press. */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="overflow-hidden rounded-2xl border border-[#263248] bg-[#121a2a]"
      >
        <div className="relative p-6 md:p-8">
          {/* Accent wash behind the header, tinted by the module's own colour */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: `radial-gradient(120% 130% at 8% 0%, ${mod.iconColor}22 0%, transparent 58%)`,
            }}
          />

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start">
            {/* Module icon: its cover when it has one, otherwise its accent */}
            <div
              className="flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl border sm:h-24 sm:w-24"
              style={{
                borderColor: `${mod.iconColor}55`,
                backgroundColor: `${mod.iconColor}14`,
              }}
            >
              {mod.coverImage ? (
                <img
                  src={coverImageSrc(mod.coverImage)}
                  alt=""
                  aria-hidden
                  className="h-full w-full object-cover"
                />
              ) : (
                <Layers size={38} style={{ color: mod.iconColor }} />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="mb-2.5 flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${domain.badgeCls}`}
                >
                  {domain.label[lang]}
                </span>
                <DifficultyBadge difficulty={mod.difficulty} />
                <span className="inline-flex items-center gap-1 rounded-md border border-[#263248] bg-[#1a2332] px-2 py-0.5 text-xs font-semibold text-[#9aa5bf]">
                  <ContentIcon size={12} /> {content.label[lang]}
                </span>
                {isPreview && (
                  <span className="inline-flex items-center rounded-md border border-[#9fef00]/30 bg-[#9fef00]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#9fef00]">
                    Preview
                  </span>
                )}
              </div>

              <h1 className="text-2xl font-black leading-tight text-[#f3f6ff] sm:text-3xl">
                {mod.title[lang] || mod.title.en}
              </h1>

              <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-[#8592ad]">
                <User size={12} /> {mod.author}
              </p>
            </div>
          </div>

          {/* ── Progress, once there is any ── */}
          {started && (
            <div className="relative mt-6" dir="ltr">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#00a859]">
                  <Check size={13} />
                  {complete
                    ? ar
                      ? 'اكتملت الوحدة'
                      : 'Module complete'
                    : ar
                    ? 'قيد التقدم'
                    : 'In progress'}
                </span>
                <span className="text-xs font-medium text-[#9aa5bf]">
                  {done}/{totalLessons} · {pct}%
                </span>
              </div>
              <ProgressBar value={pct} color="green" size="sm" />
            </div>
          )}

          {/* ── The way in ── */}
          <div className="relative mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            {enrolled || started ? (
              <Button
                variant="primary"
                onClick={enterModule}
                leftIcon={<PlayCircle size={16} />}
                className="sm:w-auto"
                fullWidth
              >
                {complete
                  ? ar
                    ? 'مراجعة الوحدة'
                    : 'Review module'
                  : started
                  ? ar
                    ? 'متابعة الوحدة'
                    : 'Continue module'
                  : ar
                  ? 'ابدأ الوحدة'
                  : 'Start module'}
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleEnroll}
                disabled={isPreview}
                leftIcon={<BookOpen size={16} />}
                className="sm:w-auto"
                fullWidth
              >
                {ar ? 'التسجيل في الوحدة' : 'Enroll in Module'}
              </Button>
            )}

            {/* Browsing without committing is allowed: enrolling is a bookmark,
                not a gate, so there is always a way to just go and read. */}
            {!enrolled && !started && (
              <button
                onClick={enterModule}
                className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-[#8592ad] transition-colors touch:min-h-tap hover:text-[#d2d7e3]"
              >
                {ar ? 'تصفح الدروس' : 'Browse the lessons'}
                <ChevronRight size={15} className="rtl-flip" />
              </button>
            )}

            {enrolled && !started && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#00a859]">
                <Check size={13} /> {ar ? 'مسجّل' : 'Enrolled'}
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── The module at a glance ── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          icon={Clock}
          value={`${mod.estimatedHours}${ar ? 'س' : 'h'}`}
          label={ar ? 'الوقت المقدر' : 'Estimated time'}
          accent="#60a5fa"
        />
        <Stat
          icon={BookOpen}
          value={totalLessons}
          label={ar ? (totalLessons === 1 ? 'درس' : 'دروس') : totalLessons === 1 ? 'Lesson' : 'Lessons'}
          accent="#9fef00"
        />
        <Stat
          icon={Layers}
          value={mod.totalModules}
          label={ar ? (mod.totalModules === 1 ? 'قسم' : 'أقسام') : mod.totalModules === 1 ? 'Section' : 'Sections'}
          accent="#00a859"
        />
        {hasLabs(mod) ? (
          <Stat
            icon={FlaskConical}
            value={mod.totalLabs}
            label={ar ? (mod.totalLabs! === 1 ? 'مختبر' : 'مختبرات') : mod.totalLabs! === 1 ? 'Lab' : 'Labs'}
            accent="#f3a43a"
          />
        ) : (
          <Stat
            icon={ClipboardCheck}
            value={mod.totalQuizzes}
            label={ar ? (mod.totalQuizzes === 1 ? 'اختبار' : 'اختبارات') : mod.totalQuizzes === 1 ? 'Quiz' : 'Quizzes'}
            accent="#00a859"
          />
        )}
      </div>

      {/* ── What this module covers ── */}
      {description.trim() && (
        <section>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-[#8592ad]">
            {ar ? 'عن هذه الوحدة' : 'About this module'}
          </h2>
          <LessonMarkdown content={description} />
        </section>
      )}

      {/* ── Tags ── */}
      {mod.tags.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-[#8592ad]">
            {ar ? 'المواضيع' : 'Topics'}
          </h2>
          <div className="flex flex-wrap gap-2">
            {mod.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md border border-[#263248] bg-[#121a2a] px-2.5 py-1 text-xs font-medium text-[#9aa5bf]"
                dir="ltr"
              >
                {tag}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ModuleOverviewPage;
