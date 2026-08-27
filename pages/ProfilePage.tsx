import React, { useState } from 'react';
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
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/EnhancedButton';
import Input from '../components/ui/EnhancedInput';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import UniversityPicker from '../components/university/UniversityPicker';
import Avatar from '../components/ui/Avatar';
import AvatarPicker from '../components/account/AvatarPicker';
import { universityLabel } from '../data/iraqUniversities';

const BIO_MAX = 500;
const HANDLE_RE = /^[a-zA-Z0-9_]{3,20}$/;

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
      <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md border border-[#263248] bg-[#0e1522] text-[#6e7a94]">
        <Icon size={13} />
      </span>
      <div className="min-w-0">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#9aa5bf]">{title}</h3>
        {hint && <p className="mt-0.5 text-xs text-[#6e7a94]">{hint}</p>}
      </div>
    </div>
    {children}
  </section>
);

const ProfilePage: React.FC = () => {
  const { user, updateUser, updateUsername, logout } = useAuth();
  const { t, lang, setLang } = useLang();
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
  });
  const [saving, setSaving] = useState(false);
  /* The handle is the only field the server can refuse (it must be unique), so
     its rejection has to land on the field rather than as a page-level error. */
  const [handleError, setHandleError] = useState<string | null>(null);

  if (!user) return null;

  const current = {
    displayName: user.displayName ?? '',
    bio: user.bio ?? '',
    university: user.university ?? '',
    avatarUrl: user.avatarUrl ?? '',
    username: user.username ?? '',
  };

  const startEdit = () => {
    setForm(current);
    setHandleError(null);
    setEditing(true);
  };

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const trimmedHandle = form.username.trim();
  const handleChanged = trimmedHandle.toLowerCase() !== current.username.toLowerCase();
  const handleMalformed = trimmedHandle !== '' && !HANDLE_RE.test(trimmedHandle);

  const nameEmpty = form.displayName.trim() === '';
  const bioTooLong = form.bio.length > BIO_MAX;

  const dirty =
    form.displayName.trim() !== current.displayName ||
    form.bio.trim() !== current.bio ||
    form.university.trim() !== current.university ||
    form.avatarUrl !== current.avatarUrl ||
    handleChanged;

  const blocked = nameEmpty || bioTooLong || handleMalformed;

  const save = async () => {
    if (saving || !dirty || blocked) return;
    setSaving(true);
    setHandleError(null);

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

    updateUser({
      displayName: form.displayName.trim(),
      bio: form.bio.trim(),
      university: form.university.trim(),
      avatarUrl: form.avatarUrl,
    });
    setSaving(false);
    setEditing(false);
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

  const roleLabel = user.role === 'admin' ? t('profile.role.admin') : t('profile.role.user');
  const roleColor = user.role === 'admin' ? '#9fef00' : '#00a859';

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
    muted: 'text-[#6e7a94]',
  }[handleState.tone];

  return (
    <div className="space-y-6">
      <PageHeader icon={UserCircle} iconColor="#00a859" title={t('profile.title')} subtitle={t('profile.subtitle')} />

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
                  <p className="mt-0.5 text-xs text-[#6e7a94]">
                    {ar
                      ? 'لا شيء يُحفظ حتى تضغط حفظ.'
                      : 'Nothing is saved until you press Save.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  title={t('profile.cancel')}
                  className="flex h-8 w-8 touch:h-11 touch:w-11 flex-shrink-0 items-center justify-center rounded-lg text-[#6e7a94] transition-colors hover:bg-[#1a2332] hover:text-[#f3f6ff]"
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
                      <span className="absolute inset-y-0 start-0 flex items-center ps-3 text-[#6e7a94] pointer-events-none">
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
                        className={`w-full ps-9 pe-3 py-2.5 rounded-lg bg-[#1a2332] border text-[#f3f6ff] font-mono text-sm placeholder:text-[#3d4a63] focus:outline-none transition-colors ${
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
                          bioTooLong ? 'text-[#ff6b6b]' : 'text-[#6e7a94]'
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
                      className={`w-full bg-[#1a2332] border rounded-lg text-[#f3f6ff] placeholder-[#6e7a94] focus:outline-none focus:ring-2 transition-all p-3 resize-none ${
                        bioTooLong
                          ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                          : 'border-[#263248] focus:ring-[#00a859] focus:border-[#00a859]'
                      }`}
                    />
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
                <span className="text-xs text-[#6e7a94]">
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
              <Avatar
                avatarUrl={user.avatarUrl}
                name={user.displayName}
                className="w-20 h-20 rounded-2xl"
                initialClassName="text-3xl"
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-xl font-black text-[#f3f6ff]">{user.displayName}</h2>
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide"
                    style={{
                      color: roleColor,
                      backgroundColor: `${roleColor}15`,
                      border: `1px solid ${roleColor}33`,
                    }}
                  >
                    {roleLabel}
                  </span>
                </div>

                {user.username && (
                  <p className="mt-1 text-sm font-mono text-[#00a859]" dir="ltr">
                    @{user.username}
                  </p>
                )}

                <div className="mt-2 flex flex-col gap-1.5 text-sm text-[#9aa5bf] min-w-0">
                  {/* An email address is a single unbreakable token, so on a
                      phone it either truncates or runs out of the card. */}
                  <span className="inline-flex items-center gap-2 min-w-0 max-w-full" dir="ltr">
                    <Mail size={14} className="text-[#6e7a94] shrink-0" />
                    <span className="truncate" title={user.email}>{user.email}</span>
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <GraduationCap size={14} className="text-[#6e7a94]" />
                    {(() => {
                      const uni = universityLabel(user.university, lang);
                      return uni.isSet ? uni.text : <span className="text-[#6e7a94]">{t('profile.notSet')}</span>;
                    })()}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <CalendarDays size={14} className="text-[#6e7a94]" /> {t('profile.memberSince')}{' '}
                    {memberSince}
                  </span>
                </div>

                <p className="mt-3 text-sm text-[#d2d7e3] max-w-lg">
                  {user.bio || <span className="text-[#6e7a94]">{t('profile.noBio')}</span>}
                </p>
              </div>

              <Button variant="outline" size="sm" onClick={startEdit} leftIcon={<Pencil size={14} />}>
                {t('profile.edit')}
              </Button>
            </div>
          )}
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
            <Globe size={16} className="text-[#6e7a94]" /> {t('profile.language')}
          </span>
          <div className="flex items-center gap-1 rounded-lg bg-[#0e1522] border border-[#263248] p-0.5" dir="ltr">
            {(['en', 'ar'] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-3 py-1 touch:min-h-tap touch:px-4 rounded-md text-xs font-bold transition-all select-none ${
                  lang === l ? 'bg-[#00a859] text-white' : 'text-[#9aa5bf] hover:text-[#f3f6ff]'
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
    </div>
  );
};

export default ProfilePage;
