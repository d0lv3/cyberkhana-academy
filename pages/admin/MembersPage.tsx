import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, ShieldCheck, PenTool, GraduationCap, RefreshCw, Ban, RotateCcw, KeyRound, Check } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import EnhancedCard from '../../components/ui/EnhancedCard';
import { confirmDialog } from '../../components/ui/ConfirmHost';
import ReauthDialog from '../../components/admin/ReauthDialog';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../contexts/AuthContext';
import { useLang } from '../../contexts/LangContext';
import { api } from '../../services/api';
import { CREATOR_PERMISSIONS, PERMISSION_META, type CreatorPermission } from '../../services/permissions';

type Role = 'user' | 'creator' | 'admin';

interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  role: Role;
  /** Effective creator capabilities (server-resolved). */
  permissions?: string[];
  isBanned: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

const ROLE_META: Record<Role, { color: string; icon: React.ElementType; label: { en: string; ar: string } }> = {
  admin: { color: '#9fef00', icon: ShieldCheck, label: { en: 'Admin', ar: 'مدير' } },
  creator: { color: '#f3a43a', icon: PenTool, label: { en: 'Creator', ar: 'منشئ محتوى' } },
  user: { color: '#62738f', icon: GraduationCap, label: { en: 'Student', ar: 'طالب' } },
};

const ROLES: Role[] = ['user', 'creator', 'admin'];

const MembersPage: React.FC = () => {
  const { user: me } = useAuth();
  const { lang } = useLang();
  const { toast, ToastContainer } = useToast();
  const ar = lang === 'ar';

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  /** Which creator's permission panel is open, and the toggles being edited. */
  const [permsOpenId, setPermsOpenId] = useState<string | null>(null);
  const [permsDraft, setPermsDraft] = useState<CreatorPermission[]>([]);
  /** Pending permission change awaiting a fresh Google confirmation. */
  const [reauthTarget, setReauthTarget] = useState<AdminUser | null>(null);
  const [reauthError, setReauthError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const { users: list } = await api.get<{ users: AdminUser[] }>('/admin/users');
      setUsers(list);
    } catch {
      toast('error', ar ? 'تعذر تحميل الأعضاء.' : 'Could not load members.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) => u.email.toLowerCase().includes(q) || u.displayName.toLowerCase().includes(q)
    );
  }, [users, query]);

  const changeRole = async (target: AdminUser, role: Role) => {
    if (role === target.role) return;
    setSavingId(target.id);
    try {
      const { user: updated } = await api.patch<{ user: AdminUser }>(
        `/admin/users/${target.id}/role`,
        { role }
      );
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      toast(
        'success',
        ar
          ? `تم تغيير دور ${updated.displayName} إلى ${ROLE_META[updated.role].label.ar}.`
          : `${updated.displayName} is now ${ROLE_META[updated.role].label.en}.`
      );
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Role update failed');
    } finally {
      setSavingId(null);
    }
  };

  const toggleBan = async (target: AdminUser) => {
    const banning = !target.isBanned;
    if (banning) {
      const ok = await confirmDialog({
        title: ar ? `حظر ${target.displayName}؟` : `Ban ${target.displayName}?`,
        message: ar
          ? 'لن يتمكن من تسجيل الدخول أو استخدام المنصة حتى يُرفع الحظر.'
          : "They won't be able to sign in or use the platform until unbanned.",
        confirmLabel: ar ? 'حظر' : 'Ban',
      });
      if (!ok) return;
    }
    setSavingId(target.id);
    try {
      const { user: updated } = await api.patch<{ user: AdminUser }>(
        `/admin/users/${target.id}/ban`,
        { banned: banning }
      );
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      toast(
        'success',
        banning
          ? ar
            ? `تم حظر ${updated.displayName}.`
            : `${updated.displayName} is banned.`
          : ar
          ? `تم رفع الحظر عن ${updated.displayName}.`
          : `${updated.displayName} is unbanned.`
      );
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Ban update failed');
    } finally {
      setSavingId(null);
    }
  };

  const togglePermsPanel = (target: AdminUser) => {
    if (permsOpenId === target.id) {
      setPermsOpenId(null);
      return;
    }
    setPermsOpenId(target.id);
    setPermsDraft(
      (target.permissions ?? []).filter((p): p is CreatorPermission =>
        (CREATOR_PERMISSIONS as readonly string[]).includes(p)
      )
    );
  };

  /* Saving permissions is gated behind a fresh Google confirmation, so the
     click only opens the dialog — the write happens once we hold a credential. */
  const savePerms = (target: AdminUser) => {
    setReauthTarget(target);
    setReauthError(null);
  };

  const commitPerms = async (credential: string) => {
    const target = reauthTarget;
    if (!target) return;
    setSavingId(target.id);
    setReauthError(null);
    try {
      const { user: updated } = await api.patch<{ user: AdminUser }>(
        `/admin/users/${target.id}/permissions`,
        { permissions: permsDraft, credential }
      );
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      setPermsOpenId(null);
      setReauthTarget(null);
      toast(
        'success',
        ar
          ? `تم تحديث صلاحيات ${updated.displayName}.`
          : `${updated.displayName}'s permissions updated.`
      );
    } catch (err) {
      // Keep the dialog open so they can retry the confirmation.
      setReauthError(err instanceof Error ? err.message : 'Permission update failed');
    } finally {
      setSavingId(null);
    }
  };

  const fmtDate = (iso?: string) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString(ar ? 'ar' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '—';
    }
  };

  return (
    <div className="space-y-6">
      <ToastContainer />
      <PageHeader
        icon={Users}
        iconColor="#9fef00"
        title={ar ? 'الأعضاء' : 'Members'}
        subtitle={
          ar
            ? 'إدارة أدوار المستخدمين — رقِّ الطلاب إلى منشئي محتوى أو مديرين.'
            : 'Manage user roles — promote students to creators or admins.'
        }
      />

      {/* toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search
            size={15}
            className="absolute start-3.5 top-1/2 -translate-y-1/2 text-[#4d5a73] pointer-events-none"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={ar ? 'ابحث بالاسم أو البريد...' : 'Search by name or email...'}
            className="w-full bg-[#121a2a] border border-[#263248] rounded-lg ps-10 pe-4 py-2.5 text-sm text-[#d2d7e3] focus:outline-none focus:border-[#00a859]/50 transition-colors placeholder:text-[#3d4a63]"
          />
        </div>
        <button
          onClick={() => void load()}
          className="w-10 h-10 rounded-lg bg-[#121a2a] border border-[#263248] flex items-center justify-center text-[#8390ac] hover:text-[#00a859] hover:border-[#00a859]/40 transition-all flex-shrink-0"
          title={ar ? 'تحديث' : 'Refresh'}
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
        <span className="text-xs text-[#6e7a94] flex-shrink-0" dir="ltr">
          {filtered.length} / {users.length}
        </span>
      </div>

      {/* list */}
      {loading ? (
        <EnhancedCard padding="xl" className="text-center">
          <p className="text-sm text-[#6e7a94]">{ar ? 'جارٍ التحميل...' : 'Loading members...'}</p>
        </EnhancedCard>
      ) : filtered.length === 0 ? (
        <EnhancedCard padding="xl" className="text-center">
          <p className="text-sm text-[#6e7a94]">
            {ar ? 'لا يوجد أعضاء مطابقون.' : 'No members match.'}
          </p>
        </EnhancedCard>
      ) : (
        <EnhancedCard padding="none" className="overflow-hidden">
          <div className="divide-y divide-[#263248]/60">
            {filtered.map((u, i) => {
              const meta = ROLE_META[u.role];
              const isSelf = u.id === me?._id;
              return (
                <React.Fragment key={u.id}>
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.3), duration: 0.3 }}
                  className={`flex items-center gap-4 px-5 py-3.5 ${u.isBanned ? 'opacity-50' : ''}`}
                >
                  {/* avatar */}
                  {u.avatarUrl ? (
                    <img
                      src={u.avatarUrl}
                      alt={u.displayName}
                      className="w-10 h-10 rounded-full object-cover border border-[#263248] flex-shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#0e1522] border border-[#263248] flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-black text-[#9fef00]">
                        {u.displayName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}

                  {/* identity */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#f3f6ff] truncate">
                      {u.displayName}
                      {isSelf && (
                        <span className="text-[#6e7a94] font-normal"> {ar ? '(أنت)' : '(you)'}</span>
                      )}
                      {u.isBanned && (
                        <span className="ms-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide bg-red-500/10 border border-red-500/30 text-red-400">
                          <Ban size={8} /> {ar ? 'محظور' : 'Banned'}
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-[#6e7a94] truncate" dir="ltr">
                      {u.email}
                    </p>
                  </div>

                  {/* dates */}
                  <div className="hidden md:block text-end flex-shrink-0">
                    <p className="text-[10px] text-[#4d5a73]">
                      {ar ? 'انضم' : 'Joined'} {fmtDate(u.createdAt)}
                    </p>
                    <p className="text-[10px] text-[#4d5a73]">
                      {ar ? 'آخر دخول' : 'Last login'} {fmtDate(u.lastLoginAt)}
                    </p>
                  </div>

                  {/* role pill */}
                  <span
                    className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0"
                    style={{
                      color: meta.color,
                      backgroundColor: `${meta.color}15`,
                      border: `1px solid ${meta.color}33`,
                    }}
                  >
                    <meta.icon size={10} />
                    {meta.label[lang]}
                  </span>

                  {/* role select */}
                  <select
                    value={u.role}
                    disabled={isSelf || savingId === u.id}
                    onChange={(e) => void changeRole(u, e.target.value as Role)}
                    title={isSelf ? (ar ? 'لا يمكنك تغيير دورك' : "You can't change your own role") : undefined}
                    className="bg-[#0a0f18] border border-[#263248] rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#d2d7e3] focus:outline-none focus:border-[#00a859]/50 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_META[r].label[lang]}
                      </option>
                    ))}
                  </select>

                  {/* creator permissions */}
                  {u.role === 'creator' && (
                    <button
                      onClick={() => togglePermsPanel(u)}
                      disabled={savingId === u.id}
                      title={ar ? 'الصلاحيات' : 'Permissions'}
                      className={`w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-30 ${
                        permsOpenId === u.id
                          ? 'border-[#f3a43a]/50 text-[#f3a43a] bg-[#f3a43a]/10'
                          : 'border-[#263248] text-[#6e7a94] hover:text-[#f3a43a] hover:border-[#f3a43a]/40 hover:bg-[#f3a43a]/10'
                      }`}
                    >
                      <KeyRound size={13} />
                    </button>
                  )}

                  {/* ban / unban */}
                  <button
                    onClick={() => void toggleBan(u)}
                    disabled={isSelf || savingId === u.id || (u.role === 'admin' && !u.isBanned)}
                    title={
                      isSelf
                        ? ar
                          ? 'لا يمكنك حظر نفسك'
                          : "You can't ban yourself"
                        : u.role === 'admin' && !u.isBanned
                        ? ar
                          ? 'خفّض رتبة المدير قبل حظره'
                          : 'Demote this admin before banning'
                        : u.isBanned
                        ? ar
                          ? 'رفع الحظر'
                          : 'Unban'
                        : ar
                        ? 'حظر'
                        : 'Ban'
                    }
                    className={`w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                      u.isBanned
                        ? 'border-[#00a859]/30 text-[#00a859] hover:bg-[#00a859]/10'
                        : 'border-[#263248] text-[#6e7a94] hover:text-red-400 hover:border-red-500/40 hover:bg-red-500/10'
                    }`}
                  >
                    {u.isBanned ? <RotateCcw size={13} /> : <Ban size={13} />}
                  </button>
                </motion.div>

                {/* Creator permissions panel */}
                {permsOpenId === u.id && u.role === 'creator' && (
                  <div className="px-5 pb-4 pt-1 bg-[#0b1019]">
                    <p className="text-[11px] text-[#6e7a94] mb-3">
                      {ar
                        ? 'حدد ما يمكن لهذا المنشئ إنشاؤه. تُطبَّق الصلاحيات فورًا على الاستوديو والخادم.'
                        : 'Choose what this creator can author. Applies immediately in the studio and on the server.'}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {CREATOR_PERMISSIONS.map((perm) => {
                        const on = permsDraft.includes(perm);
                        const meta = PERMISSION_META[perm];
                        return (
                          <button
                            key={perm}
                            type="button"
                            onClick={() =>
                              setPermsDraft((prev) =>
                                on ? prev.filter((p) => p !== perm) : [...prev, perm]
                              )
                            }
                            className={`flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-start transition-all ${
                              on
                                ? 'border-[#00a859]/40 bg-[#00a859]/10'
                                : 'border-[#263248] bg-[#121a2a] hover:border-[#354562]'
                            }`}
                          >
                            <span
                              className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border ${
                                on ? 'bg-[#00a859] border-[#00a859]' : 'border-[#3a4864]'
                              }`}
                            >
                              {on && <Check size={11} className="text-white" />}
                            </span>
                            <span className="min-w-0">
                              <span className={`block text-xs font-bold ${on ? 'text-[#00a859]' : 'text-[#d2d7e3]'}`}>
                                {meta.label[lang]}
                              </span>
                              <span className="block text-[10px] text-[#6e7a94] leading-snug">
                                {meta.hint[lang]}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={() => void savePerms(u)}
                        disabled={savingId === u.id}
                        className="px-4 py-2 rounded-lg text-xs font-bold text-[#0d1117] bg-[#00a859] hover:bg-[#00934e] transition-colors disabled:opacity-50"
                      >
                        {savingId === u.id ? (ar ? 'جارٍ الحفظ...' : 'Saving...') : ar ? 'حفظ الصلاحيات' : 'Save permissions'}
                      </button>
                      <button
                        onClick={() => setPermsOpenId(null)}
                        className="px-4 py-2 rounded-lg text-xs font-semibold text-[#9aa5bf] hover:text-[#d2d7e3] transition-colors"
                      >
                        {ar ? 'إلغاء' : 'Cancel'}
                      </button>
                    </div>
                  </div>
                )}
                </React.Fragment>
              );
            })}
          </div>
        </EnhancedCard>
      )}

      {/* Step-up confirmation for permission changes */}
      <ReauthDialog
        open={!!reauthTarget}
        busy={savingId === reauthTarget?.id}
        error={reauthError}
        actionLabel={
          reauthTarget
            ? ar
              ? `تحديث صلاحيات ${reauthTarget.displayName} (${permsDraft.length})`
              : `Update ${reauthTarget.displayName}'s permissions (${permsDraft.length} granted)`
            : ''
        }
        onCancel={() => {
          setReauthTarget(null);
          setReauthError(null);
        }}
        onCredential={commitPerms}
      />
    </div>
  );
};

export default MembersPage;
