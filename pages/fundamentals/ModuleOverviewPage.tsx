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
  Check,
  PlayCircle,
  ChevronRight,
} from 'lucide-react';
import Button from '../../components/ui/EnhancedButton';
import DifficultyBadge from '../../components/ui/DifficultyBadge';
import AuthorChip from '../../components/ui/AuthorChip';
import { creditOf } from '../../services/creatorTypes';
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
 * The cover takes the whole left side rather than sitting in a corner as an
 * avatar. It is the only thing on the page a creator drew by hand, and a
 * module is recognised by it long before its title is read.
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

/** One number and what it counts. The row of these is the module at a glance,
 *  so each one is a tile you read from across the room rather than a caption.
 *  The glyph stays unframed so it supports the number instead of becoming a
 *  second card nested inside the stat tile. */
const Stat: React.FC<{
  icon: React.ElementType;
  value: React.ReactNode;
  label: string;
  accent: string;
}> = ({ icon: Icon, value, label, accent }) => (
  <div className="rounded-2xl border border-[#263248] bg-[#121a2a] p-4 transition-colors hover:border-[#354562] sm:p-5">
    <span className="inline-flex h-10 w-10 items-center justify-center" style={{ color: accent }}>
      <Icon size={28} strokeWidth={1.8} />
    </span>
    <p className="mt-3 text-2xl font-black leading-none text-[#f3f6ff] sm:text-[1.75rem]" dir="ltr">
      {value}
    </p>
    <p className="mt-1.5 text-xs font-medium text-[#8592ad]">{label}</p>
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

  const ctaLabel = complete
    ? ar
      ? 'مراجعة الوحدة'
      : 'Review module'
    : started
    ? ar
      ? 'متابعة الوحدة'
      : 'Continue module'
    : enrolled
    ? ar
      ? 'ابدأ الوحدة'
      : 'Start module'
    : ar
    ? 'التسجيل في الوحدة'
    : 'Enroll in Module';

  const goIn = enrolled || started;

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
          Cover on one side, everything you decide with on the other. */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="overflow-hidden rounded-2xl border border-[#263248] bg-[#121a2a]"
      >
        <div className="relative flex flex-col md:flex-row">
          {/* Accent wash behind the whole hero, tinted by the module's colour */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: `radial-gradient(90% 120% at 0% 0%, ${mod.iconColor}26 0%, transparent 62%)`,
            }}
          />

          {/* ── The cover, taking the side ── */}
          <div className="relative w-full flex-shrink-0 md:w-[38%] md:max-w-[400px]">
            <div className="relative h-48 w-full sm:h-64 md:h-full md:min-h-[300px]">
              {mod.coverImage ? (
                <img
                  src={coverImageSrc(mod.coverImage)}
                  alt=""
                  aria-hidden
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(150deg, ${mod.iconColor}33 0%, #0d1117 68%)`,
                  }}
                >
                  <Layers
                    size={200}
                    className="absolute -bottom-8 -end-8 opacity-[0.09]"
                    style={{ color: mod.iconColor }}
                  />
                </div>
              )}

              {/* Scrims, the way the module tile does it: the cover has to hand
                  over to the card rather than stop at a hard edge. Vertical on
                  a phone where the cover sits above the text, horizontal from
                  md up where it sits beside it. */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#121a2a] via-[#121a2a]/20 to-transparent md:bg-gradient-to-r md:from-transparent md:via-transparent md:to-[#121a2a]" />
            </div>
          </div>

          {/* ── What you decide with ── */}
          <div className="relative flex min-w-0 flex-1 flex-col justify-center gap-5 p-6 md:p-8">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold backdrop-blur-sm ${domain.badgeCls}`}
                >
                  {domain.label[lang]}
                </span>
                <DifficultyBadge difficulty={mod.difficulty} className="backdrop-blur-sm" />
                <span className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-xs font-semibold text-[#9aa5bf] backdrop-blur-sm">
                  <ContentIcon size={12} /> {content.label[lang]}
                </span>
                {isPreview && (
                  <span className="inline-flex items-center rounded-md border border-[#9fef00]/30 bg-[#9fef00]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#9fef00]">
                    Preview
                  </span>
                )}
              </div>

              <h1 className="text-2xl font-black leading-tight text-[#f3f6ff] sm:text-3xl lg:text-4xl">
                {mod.title[lang] || mod.title.en}
              </h1>

              <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-[#8592ad]">
                <span>{ar ? 'بقلم' : 'By'}</span>
                <AuthorChip
                  credit={creditOf(mod)}
                  size="sm"
                  showHandle
                  linked
                  className="text-sm font-semibold text-[#d2d7e3]"
                />
              </div>
            </div>

            {/* ── The way in, and how far in you already are ──
                One row: the thing to press on the reading side, the state of
                play on the other. */}
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                {/* Glass, not a solid slab: the same translucent, blurred
                    treatment the badges on a module tile use, so the primary
                    action belongs to the cover it sits on rather than being
                    stamped over it. */}
                <button
                  onClick={goIn ? enterModule : handleEnroll}
                  disabled={isPreview && !goIn}
                  className="group inline-flex items-center justify-center gap-2 rounded-xl border border-[#00a859]/45 bg-[#00a859]/12 px-6 py-3.5 text-sm font-bold text-[#00a859] shadow-lg shadow-[#00a859]/5 backdrop-blur-md transition-all hover:border-[#9fef00]/60 hover:bg-[#00a859]/20 hover:text-[#9fef00] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[#00a859]/45 disabled:hover:bg-[#00a859]/12 disabled:hover:text-[#00a859]"
                >
                  {goIn ? <PlayCircle size={17} /> : <BookOpen size={17} />}
                  {ctaLabel}
                  <ChevronRight
                    size={15}
                    className="rtl-flip transition-transform group-hover:translate-x-0.5"
                  />
                </button>

                {/* Browsing without committing is allowed: enrolling is a
                    bookmark, not a gate, so there is always a way to just go
                    and read. */}
                {!goIn && (
                  <button
                    onClick={enterModule}
                    className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-[#8592ad] transition-colors touch:min-h-tap hover:text-[#d2d7e3]"
                  >
                    {ar ? 'تصفح الدروس' : 'Browse the lessons'}
                    <ChevronRight size={15} className="rtl-flip" />
                  </button>
                )}
              </div>

              {started ? (
                <div className="w-full lg:w-[19rem] lg:flex-shrink-0">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#00a859]">
                      <Check size={13} />
                      {complete
                        ? ar
                          ? 'اكتملت الوحدة'
                          : 'Module complete'
                        : ar
                        ? 'قيد التقدم'
                        : 'In progress'}
                    </span>
                    <span className="text-[11px] font-semibold text-[#8592ad]" dir="ltr">
                      {done}/{totalLessons}
                    </span>
                  </div>
                  <ProgressBar value={pct} color="neon" size="md" showLabel />
                </div>
              ) : (
                enrolled && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#00a859]">
                    <Check size={13} /> {ar ? 'مسجّل' : 'Enrolled'}
                  </span>
                )
              )}
            </div>
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
