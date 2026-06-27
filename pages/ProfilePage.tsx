import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  UserCircle,
  Mail,
  GraduationCap,
  CalendarDays,
  Pencil,
  Check,
  X,
  Award,
  Trophy,
  BookOpen,
  Globe,
  LogOut,
  Code,
  Wifi,
  Monitor,
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/EnhancedButton';
import Input from '../components/ui/EnhancedInput';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { useOverallProgress, getTrackProgress, type TrackKey } from '../services/progressService';
import { getTotalPoints } from '../services/pointsService';
import SkillMatrix from '../components/skills/SkillMatrix';

const TRACK_META: Record<
  TrackKey,
  { icon: React.ElementType; color: string; route: string; title: { en: string; ar: string } }
> = {
  programming: {
    icon: Code,
    color: '#9fef00',
    route: '/fundamentals/programming',
    title: { en: 'Programming', ar: 'البرمجة' },
  },
  networking: {
    icon: Wifi,
    color: '#60a5fa',
    route: '/fundamentals/networking',
    title: { en: 'Networking', ar: 'الشبكات' },
  },
  os: {
    icon: Monitor,
    color: '#f3a43a',
    route: '/fundamentals/operating-systems',
    title: { en: 'Operating Systems', ar: 'أنظمة التشغيل' },
  },
};

const ProfilePage: React.FC = () => {
  const { user, updateUser, logout } = useAuth();
  const { t, lang, setLang } = useLang();
  const navigate = useNavigate();
  const progress = useOverallProgress();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    displayName: user?.displayName ?? '',
    bio: user?.bio ?? '',
    university: user?.university ?? '',
  });

  if (!user) return null;

  const tracks = getTrackProgress();

  const startEdit = () => {
    setForm({
      displayName: user.displayName ?? '',
      bio: user.bio ?? '',
      university: user.university ?? '',
    });
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

  const points = getTotalPoints();
  const stats = [
    { icon: Award, label: t('profile.points'), value: points.toLocaleString('en-US'), color: '#f3c84b' },
    { icon: Trophy, label: t('dashboard.level'), value: `${progress.level}`, color: '#9fef00' },
    {
      icon: BookOpen,
      label: t('profile.lessonsDone'),
      value: `${progress.completedUnits}`,
      color: '#00a859',
    },
    { icon: UserCircle, label: t('dashboard.overall'), value: `${progress.pct}%`, color: '#60a5fa' },
  ];

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
                  <Input
                    label={t('profile.university')}
                    value={form.university}
                    onChange={(e) => setForm((f) => ({ ...f, university: e.target.value }))}
                  />
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

                  <div className="mt-2 flex flex-col gap-1.5 text-sm text-[#9aa5bf]">
                    <span className="inline-flex items-center gap-2" dir="ltr">
                      <Mail size={14} className="text-[#6e7a94]" /> {user.email}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <GraduationCap size={14} className="text-[#6e7a94]" />
                      {user.university || <span className="text-[#6e7a94]">{t('profile.notSet')}</span>}
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

      {/* ── Stat strip ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 + i * 0.06, duration: 0.35 }}
            className="rounded-2xl border border-[#263248] bg-[#121a2a] p-5"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
              style={{ backgroundColor: `${s.color}15`, border: `1px solid ${s.color}30` }}
            >
              <s.icon size={18} style={{ color: s.color }} />
            </div>
            <p className="text-2xl font-black text-[#f3f6ff]" dir="ltr">
              {s.value}
            </p>
            <p className="text-xs text-[#6e7a94] mt-1">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Skill Matrix ── */}
      <SkillMatrix />

      {/* ── Progress by track ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="rounded-2xl border border-[#263248] bg-[#121a2a] p-6"
      >
        <h3 className="text-base font-bold text-[#f3f6ff] mb-5">{t('profile.progressTitle')}</h3>
        <div className="space-y-5">
          {tracks.map((track) => {
            const meta = TRACK_META[track.key];
            const pct = track.total > 0 ? Math.round((track.done / track.total) * 100) : 0;
            return (
              <button
                key={track.key}
                onClick={() => navigate(meta.route)}
                className="w-full text-start group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#d2d7e3] group-hover:text-[#f3f6ff]">
                    <meta.icon size={16} style={{ color: meta.color }} />
                    {meta.title[lang]}
                  </span>
                  <span className="text-xs text-[#6e7a94]" dir="ltr">
                    {track.done}/{track.total} · {pct}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[#0a0f18] overflow-hidden" dir="ltr">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, backgroundColor: meta.color }}
                  />
                </div>
              </button>
            );
          })}
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
