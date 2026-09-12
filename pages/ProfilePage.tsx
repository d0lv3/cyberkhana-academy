import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  UserCircle,
  Mail,
  GraduationCap,
  CalendarDays,
  Pencil,
  Check,
  X,
  Globe,
  LogOut,
  AtSign,
  ImagePlus,
  Loader2,
  AlertCircle,
  Link2,
  EyeOff,
  Eye,
  Trash2,
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/EnhancedButton';
import Input from '../components/ui/EnhancedInput';
import { confirmDialog } from '../components/ui/ConfirmHost';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import UniversityPicker from '../components/university/UniversityPicker';
import Avatar from '../components/ui/Avatar';
import AvatarPicker from '../components/account/AvatarPicker';
import SocialLinksRow, { SocialIcon } from '../components/profile/SocialLinks';
import { universityLabel } from '../data/iraqUniversities';
import { profilePath } from '../services/profiles';
import { ROLE_META } from '../services/roles';
import { useXp } from '../services/xpService';
import LevelBadge, { levelColor } from '../components/ui/LevelBadge';
import LevelEmblem from '../components/levels/LevelEmblem';
import {
  SOCIAL_META,
  SOCIAL_PLATFORMS,
  normalizeSocial,
  type SocialPlatform,
} from '../services/socials';

const BIO_MAX = 500;
const HANDLE_RE = /^[a-zA-Z0-9_]{3,20}$/;
/** Mirrors DELETION_GRACE_DAYS in backend/src/utils/accountDeletion.ts. Only
 *  used to show the date before asking; the server says when it really is. */
const DELETION_GRACE_DAYS = 7;

type SocialDraft = Record<SocialPlatform, string>;
const emptySocials = (): SocialDraft =>
  Object.fromEntries(SOCIAL_PLATFORMS.map((p) => [p, ''])) as SocialDraft;

/* ── Form section ──
 * The editor used to be a single stack of controls in a column beside the
 * avatar, which gave no clue that "display name" and "university" are
 * different kinds of decision. Grouping them under headed sections lets
 * someone find the one field they came to change without reading the rest.
 */
const Section: React.FC<{
  icon: React.ElementType;
  title: string;
  hint?: string;
  children: React.ReactNode;
}> = ({ icon: Icon, title, hint, children }) => (
  <section className="border-t border-[#1e293b] py-5 first:border-t-0 first:pt-0">
    <div className="mb-4 flex items-start gap-2.5">
      <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md border border-[#263248] bg-[#0e1522] text-[#8592ad]">
        <Icon size={13} />
      </span>
      <div className="min-w-0">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#9aa5bf]">{title}</h3>
        {hint && <p className="mt-0.5 text-xs text-[#8592ad]">{hint}</p>}
      </div>
    </div>
    {children}
  </section>
);

const ProfilePage: React.FC = () => {
  const { user, updateUsername, updateProfile, logout, requestAccountDeletion } = useAuth();
  const { t, lang, setLang } = useLang();
  const navigate = useNavigate();
  const ar = lang === 'ar';

  const [editing, setEditing] = useState(false);
  /* One draft for the whole form, the picture included. Everything commits on
     Save and everything reverts on Cancel — previously the picture wrote
     straight through on click, so Cancel silently left it changed. */
  const [form, setForm] = useState({
    displayName: '',
    bio: '',
    university: '',
    avatarUrl: '',
    username: '',
    showBio: false,
    socials: emptySocials(),
  });
  const [saving, setSaving] = useState(false);
  /* The handle is the only field the server can refuse (it must be unique), so
     its rejection has to land on the field rather than as a page-level error. */
  const [handleError, setHandleError] = useState<string | null>(null);
  /* Anything else the server refuses on save (a link it will not accept). */
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  /* The level is public, so the profile shows it the way members see it. */
  const { xp, level } = useXp();

  if (!user) return null;

  const isAdmin = user.role === 'admin';

  const current = {
    displayName: user.displayName ?? '',
    bio: user.bio ?? '',
    university: user.university ?? '',
    avatarUrl: user.avatarUrl ?? '',
    username: user.username ?? '',
    showBio: !!user.showBio,
    socials: { ...emptySocials(), ...(user.socials ?? {}) } as SocialDraft,
  };

  const startEdit = () => {
    setForm(current);
    setHandleError(null);
    setSaveError(null);
    setEditing(true);
  };

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const trimmedHandle = form.username.trim();
  const handleChanged = trimmedHandle.toLowerCase() !== current.username.toLowerCase();
  const handleMalformed = trimmedHandle !== '' && !HANDLE_RE.test(trimmedHandle);

  const nameEmpty = form.displayName.trim() === '';
  const bioTooLong = form.bio.length > BIO_MAX;

  /* Each link checked as it is typed, with the same rules the server applies,
     so a mistake shows under its own field instead of failing the save. */
  const socialChecks = SOCIAL_PLATFORMS.map((p) => [p, normalizeSocial(p, form.socials[p])] as const);
  const socialErrors: Partial<Record<SocialPlatform, string>> = {};
  for (const [p, check] of socialChecks) if (!check.ok) socialErrors[p] = check.reason[lang];
  const socialsInvalid = Object.keys(socialErrors).length > 0;
  const socialsChanged = socialChecks.some(
    ([p, check]) => (check.ok ? check.value : form.socials[p]) !== (current.socials[p] || '')
  );

  const dirty =
    form.displayName.trim() !== current.displayName ||
    form.bio.trim() !== current.bio ||
    form.university.trim() !== current.university ||
    form.avatarUrl !== current.avatarUrl ||
    form.showBio !== current.showBio ||
    socialsChanged ||
    handleChanged;

  const blocked = nameEmpty || bioTooLong || handleMalformed || socialsInvalid;

  const setSocial = (platform: SocialPlatform, value: string) => {
    setForm((f) => ({ ...f, socials: { ...f.socials, [platform]: value } }));
    setSaveError(null);
  };

  const save = async () => {
    if (saving || !dirty || blocked) return;
    setSaving(true);
    setHandleError(null);
    setSaveError(null);

    /* Handle first. It is the one round-trip that can fail, and if it does the
       form has to stay open on the offending field — so nothing else is
       committed until the server has accepted it. */
    if (handleChanged && trimmedHandle) {
      try {
        await updateUsername(trimmedHandle);
      } catch (err) {
        setHandleError(
          err instanceof Error ? err.message : ar ? 'تعذر الحفظ.' : 'Could not save that username.'
        );
        setSaving(false);
        return;
      }
    }

    /* The rest in one request, waited for: links can be refused, and the
       server hands them back normalised, which is what the view should show. */
    try {
      await updateProfile({
        displayName: form.displayName.trim(),
        bio: form.bio.trim(),
        university: form.university.trim(),
        avatarUrl: form.avatarUrl,
        showBio: form.showBio,
        socials: form.socials,
      });
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : ar ? 'تعذر الحفظ.' : 'Could not save your profile.');
      setSaving(false);
      return;
    }
    setSaving(false);
    setEditing(false);
  };

  /* Nothing is deleted on this click. The account waits, signing in again
     brings it back, and the dialog says both, with the date. */
  const askToDelete = async () => {
    const due = new Date(Date.now() + DELETION_GRACE_DAYS * 24 * 60 * 60 * 1000).toLocaleDateString(
      ar ? 'ar' : 'en-US',
      { year: 'numeric', month: 'long', day: 'numeric' }
    );
    const ok = await confirmDialog({
      title: ar ? 'حذف حسابك؟' : 'Delete your account?',
      message: ar
        ? `سيُسجَّل خروجك من جميع الأجهزة، وسيُحذف حسابك في ${due} ما لم تسجّل الدخول مجددًا قبل ذلك.`
        : `You will be signed out on every device, and your account will be deleted on ${due} unless you sign in again before then.`,
      confirmLabel: ar ? 'احذف حسابي' : 'Delete my account',
      cancelLabel: ar ? 'أبقِ حسابي' : 'Keep my account',
      tone: 'danger',
    });
    if (!ok) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      // Signs out on success: this page goes, and the account notice takes over.
      await requestAccountDeletion();
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : ar ? 'تعذر إرسال طلبك.' : 'Could not send your request.'
      );
      setDeleting(false);
    }
  };

  const memberSince = (() => {
    try {
      return new Date(user.createdAt).toLocaleDateString(lang === 'ar' ? 'ar' : 'en-US', {
        year: 'numeric',
        month: 'long',
      });
    } catch {
      return '-';
    }
  })();

  const role = ROLE_META[user.role];

  /* Handle field state, resolved once so the input border and the message
     below it can never disagree about whether something is wrong. */
  const handleState: { tone: 'error' | 'warn' | 'ok' | 'muted'; message: string } = handleError
    ? { tone: 'error', message: handleError }
    : handleMalformed
      ? {
          tone: 'warn',
          message: ar
            ? '3 إلى 20 حرفا: أحرف وأرقام وشرطة سفلية فقط.'
            : '3–20 characters: letters, numbers and underscores only.',
        }
      : handleChanged && trimmedHandle
        ? {
            tone: 'ok',
            message: ar ? 'سيُحفظ عند الحفظ.' : 'Will be claimed when you save.',
          }
        : {
            tone: 'muted',
            message: ar
              ? 'اسمك العام، يظهر في لوحة المتصدرين.'
              : 'Your public handle, shown on the leaderboard.',
          };

  const handleToneClass = {
    error: 'text-[#ff6b6b]',
    warn: 'text-[#f3a43a]',
    ok: 'text-[#00a859]',
    muted: 'text-[#8592ad]',
  }[handleState.tone];

  return (
    <div className="space-y-6">
      <PageHeader
        iconNode={<UserCircle size={38} strokeWidth={1.7} className="flex-shrink-0 text-[#00a859]" />}
        title={t('profile.title')}
        subtitle={t('profile.subtitle')}
      />

      {/* ── Identity card ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-2xl border border-[#263248] bg-[#121a2a]"
      >
        <div className="absolute -top-20 -right-10 w-64 h-64 bg-[#00a859]/10 rounded-full blur-[90px]" />
        <div className="relative z-10 p-6 sm:p-7">
          {editing ? (
            /* ── Edit mode ──
               Takes the full width of the card rather than a column beside the
               avatar: the picture grid and the university picker were both
               being squeezed into half a card for no reason. */
            <div>
              <div className="mb-5 flex items-start justify-between gap-3 border-b border-[#1e293b] pb-4">
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-[#f3f6ff]">
                    {ar ? 'تعديل الملف الشخصي' : 'Edit profile'}
                  </h2>
                  <p className="mt-0.5 text-xs text-[#8592ad]">
                    {ar
                      ? 'لا شيء يُحفظ حتى تضغط حفظ.'
                      : 'Nothing is saved until you press Save.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  title={t('profile.cancel')}
                  className="flex h-8 w-8 touch:h-11 touch:w-11 flex-shrink-0 items-center justify-center rounded-lg text-[#8592ad] transition-colors hover:bg-[#1a2332] hover:text-[#f3f6ff]"
                >
                  <X size={16} />
                </button>
              </div>

              <Section
                icon={ImagePlus}
                title={ar ? 'الصورة' : 'Picture'}
                hint={ar ? 'اختر صورة أو أحد الرموز.' : 'Pick your photo or one of the built-in icons.'}
              >
                <AvatarPicker
                  value={form.avatarUrl}
                  onChange={(v) => set('avatarUrl', v)}
                  googlePhotoUrl={user.googlePhotoUrl}
                  displayName={form.displayName || user.displayName}
                  lang={lang}
                />
              </Section>

              <Section icon={UserCircle} title={ar ? 'الهوية' : 'Identity'}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label={t('profile.displayName')}
                    value={form.displayName}
                    onChange={(e) => set('displayName', e.target.value)}
                    maxLength={60}
                    error={
                      nameEmpty
                        ? ar
                          ? 'الاسم مطلوب.'
                          : 'A display name is required.'
                        : undefined
                    }
                  />

                  <div>
                    <label className="block text-sm font-medium text-[#d2d7e3] mb-2">
                      {ar ? 'اسم المستخدم' : 'Username'}
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 start-0 flex items-center ps-3 text-[#8592ad] pointer-events-none">
                        <AtSign size={15} />
                      </span>
                      <input
                        value={form.username}
                        onChange={(e) => {
                          set('username', e.target.value);
                          setHandleError(null);
                        }}
                        placeholder="sara_hunts"
                        dir="ltr"
                        maxLength={20}
                        aria-invalid={handleState.tone === 'error' || handleState.tone === 'warn'}
                        className={`w-full ps-9 pe-3 py-2.5 rounded-lg bg-[#1a2332] border text-[#f3f6ff] font-mono text-sm placeholder:text-[#7c8aa6] focus:outline-none transition-colors ${
                          handleState.tone === 'error'
                            ? 'border-red-500 focus:border-red-500'
                            : handleState.tone === 'warn'
                              ? 'border-[#f3a43a]/60 focus:border-[#f3a43a]'
                              : 'border-[#263248] focus:border-[#00a859]'
                        }`}
                      />
                    </div>
                    <p className={`mt-1.5 flex items-center gap-1.5 text-xs ${handleToneClass}`}>
                      {handleState.tone === 'error' && <AlertCircle size={12} className="flex-shrink-0" />}
                      {handleState.message}
                    </p>
                  </div>
                </div>
              </Section>

              <Section icon={GraduationCap} title={ar ? 'نبذة' : 'About'}>
                <div className="space-y-4">
                  <div>
                    <div className="mb-2 flex items-baseline justify-between gap-2">
                      <label className="block text-sm font-medium text-[#d2d7e3]">
                        {t('profile.bio')}
                      </label>
                      <span
                        className={`text-[11px] tabular-nums ${
                          bioTooLong ? 'text-[#ff6b6b]' : 'text-[#8592ad]'
                        }`}
                        dir="ltr"
                      >
                        {form.bio.length} / {BIO_MAX}
                      </span>
                    </div>
                    <textarea
                      value={form.bio}
                      onChange={(e) => set('bio', e.target.value)}
                      placeholder={t('profile.bioPlaceholder')}
                      rows={3}
                      className={`w-full bg-[#1a2332] border rounded-lg text-[#f3f6ff] placeholder-[#8592ad] focus:outline-none focus:ring-2 transition-all p-3 resize-none ${
                        bioTooLong
                          ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                          : 'border-[#263248] focus:ring-[#00a859] focus:border-[#00a859]'
                      }`}
                    />
                    {/* Opt-in, never on by default: bios were written when
                        they were private, so showing one is the owner's call. */}
                    <label className="mt-2.5 flex cursor-pointer items-start gap-2.5 rounded-lg border border-[#263248] bg-[#0e1522] px-3 py-2.5">
                      <input
                        type="checkbox"
                        checked={form.showBio}
                        onChange={(e) => set('showBio', e.target.checked)}
                        className="mt-0.5 h-4 w-4 flex-shrink-0 accent-[#00a859]"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-[#d2d7e3]">
                          {ar ? 'أظهر نبذتي في ملفي العام' : 'Show my bio on my public profile'}
                        </span>
                        <span className="block text-xs text-[#8592ad]">
                          {ar
                            ? 'مطفأ افتراضيا. عند إطفائه تبقى نبذتك ظاهرة لك وحدك.'
                            : 'Off by default. While it is off, only you can see your bio.'}
                        </span>
                      </span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#d2d7e3] mb-2">
                      {t('profile.university')}
                    </label>
                    <UniversityPicker
                      value={form.university}
                      onSelect={(v) => set('university', v)}
                      lang={lang}
                    />
                  </div>
                </div>
              </Section>

              <Section
                icon={Link2}
                title={ar ? 'روابط التواصل' : 'Social links'}
                hint={
                  ar
                    ? 'تظهر في ملفك العام لبقية الأعضاء المسجلين. الصق رابط ملفك أو اكتب اسم المستخدم فقط.'
                    : 'Shown on your public profile to other signed-in members. Paste a profile link or type just the username.'
                }
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  {SOCIAL_PLATFORMS.map((platform) => {
                    const meta = SOCIAL_META[platform];
                    const error = socialErrors[platform];
                    return (
                      <div key={platform}>
                        <label
                          htmlFor={`social-${platform}`}
                          className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-[#9aa5bf]"
                        >
                          <span style={{ color: meta.color }} className="inline-flex w-4 justify-center">
                            <SocialIcon platform={platform} size={14} />
                          </span>
                          {meta.label}
                        </label>
                        <input
                          id={`social-${platform}`}
                          value={form.socials[platform]}
                          onChange={(e) => setSocial(platform, e.target.value)}
                          placeholder={meta.placeholder}
                          dir="ltr"
                          maxLength={300}
                          spellCheck={false}
                          autoComplete="off"
                          aria-invalid={!!error}
                          className={`w-full rounded-lg border bg-[#1a2332] px-3 py-2 text-sm text-[#f3f6ff] placeholder:text-[#7c8aa6] focus:outline-none transition-colors ${
                            error ? 'border-[#f3a43a]/60 focus:border-[#f3a43a]' : 'border-[#263248] focus:border-[#00a859]'
                          }`}
                        />
                        {error && (
                          <p className="mt-1 flex items-center gap-1.5 text-xs text-[#f3a43a]">
                            <AlertCircle size={12} className="flex-shrink-0" /> {error}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Section>

              {saveError && (
                <p className="mb-3 flex items-center gap-1.5 text-sm text-[#ff6b6b]">
                  <AlertCircle size={14} className="flex-shrink-0" /> {saveError}
                </p>
              )}

              {/* Action bar. Save states its own reason for being disabled, so
                  a greyed-out button is never a dead end. */}
              <div className="flex flex-wrap items-center gap-3 border-t border-[#1e293b] pt-4">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={save}
                  disabled={!dirty || blocked || saving}
                  leftIcon={saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                >
                  {saving ? (ar ? 'جارٍ الحفظ...' : 'Saving…') : t('profile.save')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditing(false)}
                  disabled={saving}
                  leftIcon={<X size={15} />}
                >
                  {t('profile.cancel')}
                </Button>
                <span className="text-xs text-[#8592ad]">
                  {blocked
                    ? ar
                      ? 'أصلح الحقول المميزة أولا.'
                      : 'Fix the highlighted fields first.'
                    : dirty
                      ? ar
                        ? 'لديك تغييرات غير محفوظة.'
                        : 'You have unsaved changes.'
                      : ar
                        ? 'لا تغييرات.'
                        : 'No changes yet.'}
                </span>
              </div>
            </div>
          ) : (
            /* ── View mode ── */
            <div className="flex items-start gap-5">
              <div className="flex-shrink-0">
                <Avatar
                  avatarUrl={user.avatarUrl}
                  name={user.displayName}
                  className="w-20 h-20 rounded-2xl"
                  initialClassName="text-3xl"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-xl font-black text-[#f3f6ff]">{user.displayName}</h2>
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide"
                    style={{
                      color: role.color,
                      backgroundColor: `${role.color}15`,
                      border: `1px solid ${role.color}33`,
                    }}
                  >
                    {role.label[lang]}
                  </span>
                  {/* The emblem belongs with the level's name, not on the picture. */}
                  <LevelBadge xp={xp} lang={lang} size="md" unframed />
                </div>

                {user.username && (
                  <p className="mt-1 text-sm text-[#00a859]">
                    <span dir="ltr" className="font-mono">
                      @{user.username}
                    </span>
                  </p>
                )}

                <div className="mt-2 flex flex-col gap-1.5 text-sm text-[#9aa5bf] min-w-0">
                  {/* An email address is a single unbreakable token, so on a
                      phone it either truncates or runs out of the card. */}
                  <span className="inline-flex items-center gap-2 min-w-0 max-w-full" dir="ltr">
                    <Mail size={14} className="text-[#8592ad] shrink-0" />
                    <span className="truncate" title={user.email}>{user.email}</span>
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <GraduationCap size={14} className="text-[#8592ad]" />
                    {(() => {
                      const uni = universityLabel(user.university, lang);
                      return uni.isSet ? uni.text : <span className="text-[#8592ad]">{t('profile.notSet')}</span>;
                    })()}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <CalendarDays size={14} className="text-[#8592ad]" /> {t('profile.memberSince')}{' '}
                    {memberSince}
                  </span>
                </div>

                {/* Pulled in by the icons' own padding so the first mark lines up with the text. */}
                <SocialLinksRow links={user.socials} lang={lang} className="mt-2 -ms-2" />

                <p className="mt-3 text-sm text-[#d2d7e3] max-w-lg whitespace-pre-line">
                  {user.bio ? (
                    <span dir="auto">{user.bio}</span>
                  ) : (
                    <span className="text-[#8592ad]">{t('profile.noBio')}</span>
                  )}
                </p>
                {user.bio && (
                  <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-[#8592ad]">
                    {user.showBio ? <Eye size={12} /> : <EyeOff size={12} />}
                    {user.showBio
                      ? ar
                        ? 'تظهر في ملفك العام.'
                        : 'Shown on your public profile.'
                      : ar
                        ? 'مخفية، تظهر لك وحدك.'
                        : 'Hidden, only you can see it.'}
                  </p>
                )}
              </div>

              <div className="flex flex-shrink-0 flex-col items-stretch gap-2">
                <Button variant="outline" size="sm" onClick={startEdit} leftIcon={<Pencil size={14} />}>
                  {t('profile.edit')}
                </Button>
                {profilePath({ id: user._id, username: user.username }) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(profilePath({ id: user._id, username: user.username })!)}
                    leftIcon={<Eye size={14} />}
                  >
                    {ar ? 'ملفي العام' : 'Public profile'}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Level ──
          Public, like the XP it is read from, so it is shown here the way other
          members see it, with how far there is to go to the next one. */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.14, duration: 0.4 }}
        className="relative overflow-hidden rounded-2xl border border-[#263248] bg-[#121a2a] p-6"
      >
        <div
          aria-hidden
          className="absolute -top-16 -end-12 h-52 w-52 rounded-full blur-[80px]"
          style={{ background: `${levelColor(level.level)}24` }}
        />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
          <LevelEmblem
            level={level.level}
            lang={lang}
            size="lg"
            decorative
            className="h-24 w-24 flex-shrink-0 self-center drop-shadow-[0_8px_20px_rgba(0,0,0,0.5)]"
          />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#8592ad]">
              {ar ? 'مستواك' : 'Your level'}
            </p>
            <p className="mt-0.5 flex flex-wrap items-baseline gap-x-2 text-xl font-black leading-tight">
              <span dir="ltr" className="font-mono" style={{ color: levelColor(level.level) }}>
                {level.level.hex}
              </span>
              <span className="text-[#f3f6ff]">{level.level.name[lang]}</span>
              <span dir="ltr" className="text-sm font-bold text-[#9aa5bf]">
                {xp.toLocaleString('en-US')} XP
              </span>
            </p>
            <div className="mt-3 h-1.5 max-w-md overflow-hidden rounded-full bg-[#0a0f18]" dir="ltr">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.round(level.fraction * 100)}%`, background: levelColor(level.level) }}
              />
            </div>
            <p className="mt-1.5 text-xs text-[#8592ad]">
              {level.next ? (
                <>
                  <span dir="ltr">{level.toNext.toLocaleString('en-US')}</span> {ar ? 'نقطة خبرة حتى' : 'XP to'}{' '}
                  <span dir="ltr" className="font-mono">
                    {level.next.hex}
                  </span>{' '}
                  {level.next.name[lang]}
                </>
              ) : ar ? (
                'أعلى مستوى في الأكاديمية'
              ) : (
                'The top level in the Academy'
              )}
            </p>
            <p className="mt-3 inline-flex items-start gap-1.5 text-xs text-[#8592ad]">
              <Eye size={12} className="mt-0.5 flex-shrink-0" />
              {ar
                ? 'مستواك ظاهر لبقية الأعضاء، في ملفك العام وعلى لوحة المتصدرين.'
                : 'Your level is public: other members see it on your profile and the leaderboard.'}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/dashboard', { state: { focus: 'levels' } })}
            className="self-start sm:self-center"
          >
            {ar ? 'كل المستويات' : 'See all levels'}
          </Button>
        </div>
      </motion.div>

      {/* ── Preferences ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28, duration: 0.4 }}
        className="rounded-2xl border border-[#263248] bg-[#121a2a] p-6"
      >
        <h3 className="text-base font-bold text-[#f3f6ff] mb-5">{t('profile.preferences')}</h3>

        <div className="flex items-center justify-between py-3 border-b border-[#1e293b]">
          <span className="inline-flex items-center gap-2 text-sm text-[#d2d7e3]">
            <Globe size={16} className="text-[#8592ad]" /> {t('profile.language')}
          </span>
          <div className="flex items-center gap-1 rounded-lg bg-[#0e1522] border border-[#263248] p-0.5" dir="ltr">
            {(['en', 'ar'] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-3 py-1 touch:min-h-tap touch:px-4 rounded-md text-xs font-bold transition-all select-none ${
                  lang === l ? 'bg-[#007a42] text-white' : 'text-[#9aa5bf] hover:text-[#f3f6ff]'
                }`}
              >
                {l === 'en' ? 'EN' : 'عربي'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 min-w-0">
          <span className="text-sm text-[#9aa5bf]">{user.email}</span>
          <Button variant="outline" size="sm" onClick={logout} leftIcon={<LogOut size={14} />}>
            {t('profile.signOut')}
          </Button>
        </div>
      </motion.div>

      {/* ── Delete account ──
          Its own card, last on the page and away from Sign out: the one
          control here that ends the account rather than the session. */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.36, duration: 0.4 }}
        className="rounded-2xl border border-red-500/25 bg-red-500/[0.04] p-6"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 max-w-xl">
            <h3 className="flex items-center gap-2 text-base font-bold text-[#f3f6ff]">
              <Trash2 size={16} className="text-red-400" />
              {ar ? 'حذف حسابك' : 'Delete your account'}
            </h3>
            {isAdmin ? (
              <p className="mt-2 text-sm leading-relaxed text-[#9aa5bf]">
                {ar
                  ? 'لا يمكن حذف حساب مدير. يجب أن يغيّر مدير آخر دورك أولًا.'
                  : 'Admin accounts cannot be deleted. Another admin has to change your role first.'}
              </p>
            ) : (
              <>
                <p className="mt-2 text-sm leading-relaxed text-[#9aa5bf]">
                  {ar
                    ? `نحتفظ بحسابك ${DELETION_GRACE_DAYS} أيام بعد طلبك تحسّبًا لتغيير رأيك، وتسجيل دخولك مجددًا خلالها يلغي الطلب. بعد ذلك يُحذف ملفك وتقدّمك ونقاطك نهائيًا.`
                    : `We keep your account for ${DELETION_GRACE_DAYS} days after you ask, in case you change your mind, and signing in again during that time cancels the request. After that, your profile, progress and points are deleted for good.`}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[#9aa5bf]">
                  {user.role === 'creator'
                    ? ar
                      ? 'أما التقييمات التي تركتها فتبقى، دون اسمك. وتبقى الدروس التي نشرتها على الأكاديمية كما تنص اتفاقية المُنشِئ، وتُحذف مسودّاتك.'
                      : 'Feedback you left stays, without your name on it. Lessons you published stay on the Academy, as the Creator Agreement sets out, and your drafts are deleted.'
                    : ar
                    ? 'أما التقييمات التي تركتها فتبقى، دون اسمك.'
                    : 'Feedback you left stays, without your name on it.'}
                </p>
              </>
            )}
            <Link
              to="/privacy"
              className="mt-2 inline-block text-xs text-[#9aa5bf] underline underline-offset-2 transition-colors hover:text-[#f3f6ff]"
            >
              {ar ? 'ما الذي يُحذف وما الذي يبقى' : 'What is deleted, and what stays'}
            </Link>
          </div>
          <button
            type="button"
            onClick={() => void askToDelete()}
            disabled={isAdmin || deleting}
            className="flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 touch:min-h-tap text-xs font-bold text-red-400 transition-all hover:border-red-500/60 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            {deleting ? (ar ? 'جارٍ الإرسال...' : 'Sending...') : ar ? 'احذف حسابي' : 'Delete my account'}
          </button>
        </div>
        {deleteError && (
          <p role="alert" className="mt-3 flex items-center gap-1.5 text-sm text-[#ff6b6b]">
            <AlertCircle size={14} className="flex-shrink-0" /> {deleteError}
          </p>
        )}
      </motion.div>
    </div>
  );
};

export default ProfilePage;
