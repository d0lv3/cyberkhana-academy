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
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/EnhancedButton';
import Input from '../components/ui/EnhancedInput';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import UniversityPicker from '../components/university/UniversityPicker';
import { universityLabel } from '../data/iraqUniversities';

const ProfilePage: React.FC = () => {
  const { user, updateUser, updateUsername, logout } = useAuth();
  const { t, lang, setLang } = useLang();
  const ar = lang === 'ar';

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    displayName: user?.displayName ?? '',
    bio: user?.bio ?? '',
    university: user?.university ?? '',
  });

  /* The handle is edited on its own, because it is the one field the server
     can refuse (it must be unique) — so it needs its own error and pending
     state rather than riding along with the optimistic profile save. */
  const [handle, setHandle] = useState('');
  const [handleError, setHandleError] = useState<string | null>(null);
  const [handleSaving, setHandleSaving] = useState(false);
  const [handleSaved, setHandleSaved] = useState(false);

  if (!user) return null;

  const startEdit = () => {
    setForm({
      displayName: user.displayName ?? '',
      bio: user.bio ?? '',
      university: user.university ?? '',
    });
    setHandle(user.username ?? '');
    setHandleError(null);
    setHandleSaved(false);
    setEditing(true);
  };

  const save = () => {
    updateUser({
      displayName: form.displayName.trim() || user.displayName,
      bio: form.bio.trim(),
      university: form.university.trim(),
    });
    setEditing(false);
  };

  const trimmedHandle = handle.trim();
  const handleChanged = trimmedHandle.toLowerCase() !== (user.username ?? '').toLowerCase();
  const handleValid = /^[a-zA-Z0-9_]{3,20}$/.test(trimmedHandle);

  const saveHandle = async () => {
    if (!handleValid || !handleChanged || handleSaving) return;
    setHandleSaving(true);
    setHandleError(null);
    setHandleSaved(false);
    try {
      await updateUsername(trimmedHandle);
      setHandleSaved(true);
    } catch (err) {
      setHandleError(
        err instanceof Error ? err.message : ar ? 'تعذر الحفظ.' : 'Could not save that username.'
      );
    } finally {
      setHandleSaving(false);
    }
  };

  const memberSince = (() => {
    try {
      return new Date(user.createdAt).toLocaleDateString(lang === 'ar' ? 'ar' : 'en-US', {
        year: 'numeric',
        month: 'long',
      });
    } catch {
      return '—';
    }
  })();

  const roleLabel = user.role === 'admin' ? t('profile.role.admin') : t('profile.role.user');
  const roleColor = user.role === 'admin' ? '#9fef00' : '#00a859';

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
          <div className="flex items-start gap-5">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.displayName}
                  className="w-20 h-20 rounded-2xl object-cover border border-[#263248]"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-[#0e1522] border border-[#263248] flex items-center justify-center">
                  <span className="text-3xl font-black text-[#9fef00]">
                    {(user.displayName || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Identity / edit form */}
            <div className="flex-1 min-w-0">
              {editing ? (
                <div className="space-y-3 max-w-md">
                  <Input
                    label={t('profile.displayName')}
                    value={form.displayName}
                    onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                  />

                  {/* Username — saved separately, since only the server can
                      tell us whether the handle is free. */}
                  <div>
                    <label className="block text-sm font-medium text-[#d2d7e3] mb-2">
                      {ar ? 'اسم المستخدم' : 'Username'}
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <span className="absolute inset-y-0 start-0 flex items-center ps-3 text-[#6e7a94] pointer-events-none">
                          <AtSign size={15} />
                        </span>
                        <input
                          value={handle}
                          onChange={(e) => {
                            setHandle(e.target.value);
                            setHandleError(null);
                            setHandleSaved(false);
                          }}
                          placeholder="sara_hunts"
                          dir="ltr"
                          maxLength={20}
                          className="w-full ps-9 pe-3 py-2.5 rounded-lg bg-[#1a2332] border border-[#263248] text-[#f3f6ff] font-mono text-sm placeholder:text-[#3d4a63] focus:outline-none focus:border-[#00a859] transition-colors"
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={saveHandle}
                        disabled={!handleValid || !handleChanged || handleSaving}
                      >
                        {handleSaving
                          ? ar ? 'جارٍ...' : 'Saving...'
                          : ar ? 'حفظ' : 'Save'}
                      </Button>
                    </div>
                    <p
                      className={`mt-1.5 text-xs ${
                        handleError
                          ? 'text-[#ff6b6b]'
                          : handleSaved
                          ? 'text-[#00a859]'
                          : trimmedHandle && !handleValid
                          ? 'text-[#f3a43a]'
                          : 'text-[#6e7a94]'
                      }`}
                    >
                      {handleError
                        ? handleError
                        : handleSaved
                        ? ar ? 'تم تحديث اسم المستخدم.' : 'Username updated.'
                        : trimmedHandle && !handleValid
                        ? ar
                          ? '3 إلى 20 حرفا: أحرف وأرقام وشرطة سفلية فقط.'
                          : '3–20 characters: letters, numbers and underscores only.'
                        : ar
                        ? 'اسمك العام — يظهر في لوحة المتصدرين.'
                        : 'Your public handle — shown on the leaderboard.'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#d2d7e3] mb-2">
                      {t('profile.bio')}
                    </label>
                    <textarea
                      value={form.bio}
                      onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                      placeholder={t('profile.bioPlaceholder')}
                      rows={3}
                      className="w-full bg-[#1a2332] border border-[#263248] rounded-lg text-[#f3f6ff] placeholder-[#6e7a94] focus:outline-none focus:ring-2 focus:ring-[#00a859] focus:border-[#00a859] transition-all p-3 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#d2d7e3] mb-2">
                      {t('profile.university')}
                    </label>
                    <UniversityPicker
                      value={form.university}
                      onSelect={(v) => setForm((f) => ({ ...f, university: v }))}
                      lang={lang}
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <Button variant="primary" size="sm" onClick={save} leftIcon={<Check size={15} />}>
                      {t('profile.save')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditing(false)}
                      leftIcon={<X size={15} />}
                    >
                      {t('profile.cancel')}
                    </Button>
                  </div>
                </div>
              ) : (
                <>
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

                  <div className="mt-2 flex flex-col gap-1.5 text-sm text-[#9aa5bf]">
                    <span className="inline-flex items-center gap-2" dir="ltr">
                      <Mail size={14} className="text-[#6e7a94]" /> {user.email}
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
                </>
              )}
            </div>

            {/* Edit toggle */}
            {!editing && (
              <Button variant="outline" size="sm" onClick={startEdit} leftIcon={<Pencil size={14} />}>
                {t('profile.edit')}
              </Button>
            )}
          </div>
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
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                  lang === l ? 'bg-[#00a859] text-white' : 'text-[#9aa5bf] hover:text-[#f3f6ff]'
                }`}
              >
                {l === 'en' ? 'EN' : 'عربي'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4">
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
