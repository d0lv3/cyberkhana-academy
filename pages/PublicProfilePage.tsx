import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  GraduationCap,
  Trophy,
  Medal,
  PenTool,
  Pencil,
  EyeOff,
  UserX,
  Loader2,
  ListOrdered,
  ChevronRight,
} from 'lucide-react';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/EnhancedButton';
import LevelBadge from '../components/ui/LevelBadge';
import SocialLinksRow from '../components/profile/SocialLinks';
import NetworkingLessonCard from '../components/fundamentals/NetworkingLessonCard';
import ModuleCard from '../components/fundamentals/ModuleCard';
import PathCard from '../components/paths/PathCard';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { ApiError } from '../services/api';
import { fetchPublicProfile, type PublicProfile } from '../services/profiles';
import { creditOf } from '../services/creatorTypes';
import { getNetworkingLessons } from '../data/networking';
import { getMergedFundamentalModules } from '../data/fundamentalsData';
import {
  getPublishedCreatorPaths,
  getPublishedNetworkingUnits,
} from '../services/creatorDataService';
import { universityLabel } from '../data/iraqUniversities';

/* ─── A member's public profile ───
 *
 * What one member can see of another: their picture with the links they chose
 * to share pinned beneath it, their name and handle, their university, their
 * bio if they switched it on, where they stand on the leaderboard, and
 * anything they have published. Everything here comes from the server's
 * public projection (GET /api/users/:handle) or from content that is already
 * public, so there is nothing private for this page to leak.
 */

type LoadState =
  | { status: 'loading' }
  | { status: 'missing' }
  | { status: 'error' }
  | { status: 'ready'; profile: PublicProfile };

const CARD_GRID = 'grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5';

const Stat: React.FC<{ icon: React.ElementType; value: React.ReactNode; label: string; accent: string }> = ({
  icon: Icon,
  value,
  label,
  accent,
}) => (
  <div className="rounded-xl border border-[#263248]/70 bg-[#0a0f18]/50 p-3.5">
    <Icon size={25} strokeWidth={1.8} style={{ color: accent }} />
    <p className="mt-2 text-xl font-black leading-none text-[#f3f6ff]" dir="ltr">
      {value}
    </p>
    <p className="mt-1 text-[11px] font-medium text-[#8592ad]">{label}</p>
  </div>
);

const PublicProfilePage: React.FC = () => {
  const { handle = '' } = useParams<{ handle: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { lang, t } = useLang();
  const ar = lang === 'ar';
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    fetchPublicProfile(handle)
      .then((profile) => {
        if (cancelled) return;
        setState({ status: 'ready', profile });
        // Reached by account id but they have a handle: show the address people share.
        if (profile.username && handle !== profile.username) {
          navigate(`/u/${profile.username}`, { replace: true });
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setState({ status: err instanceof ApiError && err.status === 404 ? 'missing' : 'error' });
      });
    return () => {
      cancelled = true;
    };
  }, [handle, navigate]);

  const profile = state.status === 'ready' ? state.profile : null;
  const isMe = !!profile && !!user && profile.id === user._id;

  /* What they have published, from the public content already on this device.
     Credit comes from the owning account (creditOf), so this is their work,
     whatever name is typed into an item. */
  const published = useMemo(() => {
    if (!profile) return { lessons: [], units: [], modules: [], paths: [] };
    const mine = (item: unknown) => creditOf(item).id === profile.id;
    return {
      lessons: getNetworkingLessons().filter(mine),
      units: getPublishedNetworkingUnits().filter(mine),
      modules: getMergedFundamentalModules().filter(mine),
      paths: getPublishedCreatorPaths().filter(mine),
    };
  }, [profile]);
  const publishedCount =
    published.lessons.length + published.units.length + published.modules.length + published.paths.length;

  if (state.status === 'loading') {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-[#00a859]" size={26} />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#263248] bg-[#121a2a]">
          <UserX size={24} className="text-[#8592ad]" />
        </div>
        <h1 className="text-lg font-bold text-[#f3f6ff]">
          {state.status === 'missing'
            ? ar
              ? 'هذا الملف غير متاح'
              : "This profile isn't available"
            : ar
              ? 'تعذر تحميل الملف'
              : "Couldn't load this profile"}
        </h1>
        <p className="mt-1.5 text-sm text-[#8592ad]">
          {state.status === 'missing'
            ? ar
              ? 'ربما تغير اسم المستخدم، أو لم يعد الحساب متاحا.'
              : 'The username may have changed, or the account is no longer available.'
            : ar
              ? 'حاول مرة أخرى بعد قليل.'
              : 'Try again in a moment.'}
        </p>
        <Button variant="outline" size="sm" className="mt-5" onClick={() => navigate('/leaderboard')}>
          {t('leaderboard.title')}
        </Button>
      </div>
    );
  }

  const uni = universityLabel(profile.university ?? undefined, lang);
  // Lifetime XP; a server from before XP only had the board score.
  const xp = profile.xp ?? profile.points;

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 touch:min-h-tap text-sm text-[#8592ad] hover:text-[#d2d7e3] transition-colors select-none"
      >
        <ArrowLeft size={16} className="rtl-flip" />
        <span>{ar ? 'رجوع' : 'Back'}</span>
      </button>

      {/* Your own profile, as others see it */}
      {isMe && (
        <div className="flex flex-col gap-3 rounded-xl border border-[#00a859]/30 bg-[#00a859]/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-[#d2d7e3]">
            <p className="font-semibold text-[#f3f6ff]">
              {ar ? 'هكذا يرى الأعضاء الآخرون ملفك.' : 'This is how other members see your profile.'}
            </p>
            {user?.bio && !user.showBio && (
              <p className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-[#9aa5bf]">
                <EyeOff size={12} />
                {ar ? 'نبذتك مخفية. يمكنك إظهارها من ملفك الشخصي.' : 'Your bio is hidden. You can show it from your profile.'}
              </p>
            )}
          </div>
          <Button size="sm" variant="outline" leftIcon={<Pencil size={14} />} onClick={() => navigate('/profile')}>
            {t('profile.edit')}
          </Button>
        </div>
      )}

      {/* ── Who they are ── */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-2xl border border-[#263248] bg-[#121a2a]"
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(90% 120% at 0% 0%, rgba(0,168,89,0.14) 0%, transparent 60%)' }}
        />

        <div className="relative flex flex-col items-center gap-6 p-6 sm:flex-row sm:items-start sm:p-8">
          <div className="flex-shrink-0">
            <Avatar
              avatarUrl={profile.avatarUrl}
              name={profile.displayName}
              className="h-28 w-28 rounded-3xl"
              initialClassName="text-5xl"
            />
          </div>

          <div className="min-w-0 flex-1 text-center sm:text-start">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              {/* dir="auto" on anything a member wrote: an English name in the
                  Arabic interface keeps its own direction and punctuation. */}
              <h1 dir="auto" className="text-2xl font-black leading-tight text-[#f3f6ff] sm:text-3xl">
                {profile.displayName}
              </h1>
              {/* The emblem belongs with the level's name, not on the picture. */}
              <LevelBadge xp={xp} lang={lang} size="md" unframed />
              {publishedCount > 0 && (
                <span className="inline-flex items-center gap-1 rounded-md border border-[#9fef00]/30 bg-[#9fef00]/10 px-2 py-0.5 text-[11px] font-bold text-[#9fef00]">
                  <PenTool size={11} /> {ar ? 'منشئ محتوى' : 'Creator'}
                </span>
              )}
            </div>
            {profile.username && (
              /* The handle reads left to right, but the line itself follows the
                 page. Both dir and font-mono stay on the inline span: on the
                 paragraph either one (index.css left-aligns .font-mono blocks in
                 Arabic) would push the handle to the far edge. */
              <p className="mt-1 text-sm text-[#00a859]">
                <span dir="ltr" className="font-mono">
                  @{profile.username}
                </span>
              </p>
            )}
            {uni.isSet && !uni.isNotEnrolled && (
              <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-[#9aa5bf]">
                <GraduationCap size={15} className="flex-shrink-0 text-[#8592ad]" /> {uni.text}
              </p>
            )}
            {/* Their links, in the text beside the picture. Pulled in by the
                icons' own padding so the first mark lines up with the text. */}
            <SocialLinksRow links={profile.socials} lang={lang} className="mt-2 justify-center sm:-ms-2 sm:justify-start" />
            {profile.bio && (
              /* The paragraph follows the page, so the bio lines up with the
                 name; the text inside keeps its own direction and punctuation. */
              <p className="mx-auto mt-4 max-w-2xl whitespace-pre-line text-sm leading-relaxed text-[#d2d7e3] sm:mx-0">
                <span dir="auto">{profile.bio}</span>
              </p>
            )}
          </div>
        </div>

        <div className="relative grid grid-cols-2 gap-3 border-t border-[#263248] px-6 py-4 sm:grid-cols-3 sm:px-8">
          <Stat
            icon={Trophy}
            value={xp.toLocaleString('en-US')}
            label={ar ? 'نقاط الخبرة' : 'XP'}
            accent="#f3c84b"
          />
          <Stat
            icon={Medal}
            value={profile.rank ? `#${profile.rank}` : '-'}
            label={profile.rank ? (ar ? 'الترتيب العام' : 'All-time rank') : ar ? 'غير مصنف بعد' : 'Not ranked yet'}
            accent="#00a859"
          />
          {publishedCount > 0 && (
            <Stat
              icon={PenTool}
              value={publishedCount}
              label={ar ? 'عمل منشور' : 'Published'}
              accent="#60a5fa"
            />
          )}
        </div>
      </motion.section>

      {/* ── What they have published ── */}
      {publishedCount > 0 && (
        <section className="space-y-6">
          <h2 className="text-lg font-bold text-[#f3f6ff]">
            {ar ? 'منشور في الأكاديمية' : 'Published on the Academy'}
          </h2>

          {published.lessons.length > 0 && (
            <div>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#8592ad]">
                {ar ? 'دروس الشبكات' : 'Networking lessons'}
              </h3>
              <div className={CARD_GRID}>
                {published.lessons.map((lesson, i) => (
                  <NetworkingLessonCard key={lesson.id} lesson={lesson} index={Math.min(i, 8)} />
                ))}
              </div>
            </div>
          )}

          {published.units.length > 0 && (
            <div>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#8592ad]">
                {ar ? 'مراحل الشبكات' : 'Networking units'}
              </h3>
              <div className="space-y-2">
                {published.units.map((unit) => (
                  <Link
                    key={unit.id}
                    to="/fundamentals/networking"
                    className="group flex items-center gap-3 rounded-xl border border-[#263248] bg-[#121a2a] px-4 py-3 transition-colors hover:border-[#60a5fa]/40"
                  >
                    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-[#60a5fa]/25 bg-[#60a5fa]/10 text-[#60a5fa]">
                      <ListOrdered size={16} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-[#f3f6ff] group-hover:text-[#60a5fa]">
                        {unit.title[lang] || unit.title.en}
                      </span>
                      <span className="block text-xs text-[#8592ad]">
                        {unit.lessonIds.length} {t(unit.lessonIds.length === 1 ? 'card.lesson' : 'card.lessons')}
                      </span>
                    </span>
                    <ChevronRight size={16} className="rtl-flip flex-shrink-0 text-[#7c8aa6]" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {published.modules.length > 0 && (
            <div>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#8592ad]">{t('sidebar.modules')}</h3>
              <div className={CARD_GRID}>
                {published.modules.map((mod, i) => (
                  <ModuleCard key={mod.id} module={mod} index={Math.min(i, 8)} />
                ))}
              </div>
            </div>
          )}

          {published.paths.length > 0 && (
            <div>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#8592ad]">{t('sidebar.paths')}</h3>
              <div className={CARD_GRID}>
                {published.paths.map((path, i) => (
                  <PathCard key={path.id} path={path} index={Math.min(i, 8)} />
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default PublicProfilePage;
