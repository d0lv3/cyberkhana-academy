import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, RefreshCw, Ban, RotateCcw, KeyRound, Check, Trophy, Trash2, Clock } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import EnhancedCard from '../../components/ui/EnhancedCard';
import Avatar from '../../components/ui/Avatar';
import { confirmDialog } from '../../components/ui/ConfirmHost';
import ReauthDialog from '../../components/admin/ReauthDialog';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../contexts/AuthContext';
import { useLang } from '../../contexts/LangContext';
import { api } from '../../services/api';
import { CREATOR_PERMISSIONS, PERMISSION_META, type CreatorPermission } from '../../services/permissions';
import { ROLE_META, type Role } from '../../services/roles';

interface AdminUser {
  id: string;
  email: string;
  /** Public handle. Optional: accounts predating handles have none. */
  username?: string;
  displayName: string;
  avatarUrl?: string;
  role: Role;
  /** Effective creator capabilities (server-resolved). */
  permissions?: string[];
  isBanned: boolean;
  createdAt: string;
  lastLoginAt?: string;
  /** Set while the member's own request to delete the account stands. */
  deletionRequestedAt?: string;
  /** When that request is carried out, unless they sign in before then. */
  deletionScheduledFor?: string;
}

const ROLES: Role[] = ['user', 'creator', 'admin'];

/** An action held back until the admin re-confirms with Google. */
type PendingAction =
  | { kind: 'role'; target: AdminUser; role: Role }
  | { kind: 'perms'; target: AdminUser }
  /* Irreversible, so held back like a promotion even though it grants nothing. */
  | { kind: 'delete'; target: AdminUser }
  /* The one action here that is aimed at everybody rather than at a member,
     which is most of why it is confirmed the same way. */
  | { kind: 'resetPoints' };

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
  /** A privilege change awaiting a fresh Google confirmation. Both role and
   *  permission changes go through here — granting admin is the bigger
   *  escalation of the two, so neither is allowed on the session alone. */
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [reauthError, setReauthError] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

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
      (u) =>
        u.email.toLowerCase().includes(q) ||
        u.displayName.toLowerCase().includes(q) ||
        (u.username ?? '').toLowerCase().includes(q)
    );
  }, [users, query]);

  const changeRole = (target: AdminUser, role: Role) => {
    if (role === target.role) return;
    setPending({ kind: 'role', target, role });
    setReauthError(null);
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

  /* Clearing the board is not a privilege change, but it reaches every
     account at once and the old standings are kept nowhere, so it goes through
     the same door: warn plainly, then ask them to prove they are still there. */
  const askResetPoints = async () => {
    const ok = await confirmDialog({
      title: ar ? 'تصفير نقاط الجميع؟' : "Reset everyone's points?",
      message: ar
        ? 'ستعود نقاط كل عضو إلى الصفر في لوحتي الصدارة الكلية والشهرية. لن يفقد أحد تقدّمه: الوحدات المكتملة تبقى مكتملة، وتُحتسب النقاط الجديدة من الآن. الترتيب الحالي لا يمكن استرجاعه.'
        : "Every member drops to zero on both the all-time and the monthly board. Nobody loses progress: completed modules stay completed, and new points count from here. The current standings cannot be recovered.",
      confirmLabel: ar ? 'تصفير النقاط' : 'Reset points',
      tone: 'danger',
    });
    if (!ok) return;
    setPending({ kind: 'resetPoints' });
    setReauthError(null);
  };

  /* Deleting is for good, so it is confirmed twice, like a points reset: a
     plain account of what goes and what stays, then a fresh Google sign-in. */
  const askDelete = async (target: AdminUser) => {
    const creator = target.role === 'creator';
    const ok = await confirmDialog({
      title: ar ? `حذف حساب ${target.displayName}؟` : `Delete ${target.displayName}'s account?`,
      message: ar
        ? `${
            creator ? 'يُحذف الآن ملفه وتقدّمه ونقاطه ومسودّاته غير المنشورة' : 'يُحذف الآن ملفه وتقدّمه ونقاطه'
          }، ولا يمكن التراجع عن ذلك. ${
            creator ? 'وتبقى الدروس التي نشرها متاحة، وتبقى تقييماته دون اسمه.' : 'وتبقى تقييماته دون اسمه.'
          } ويمكنه التسجيل من جديد بحساب Google نفسه، فإن أردت منعه من العودة فاحظره بدلًا من ذلك.`
        : `${
            creator ? 'Their profile, progress, points and unpublished drafts' : 'Their profile, progress and points'
          } are deleted now, and this cannot be undone. ${
            creator
              ? 'Lessons they published stay live, and feedback they left stays without their name.'
              : 'Feedback they left stays without their name.'
          } They can sign up again with the same Google account; to keep someone out, ban them instead.`,
      confirmLabel: ar ? 'حذف الحساب' : 'Delete account',
      tone: 'danger',
    });
    if (!ok) return;
    setPending({ kind: 'delete', target });
    setReauthError(null);
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
    setPending({ kind: 'perms', target });
    setReauthError(null);
  };

  /* Runs once the admin has re-confirmed with Google. The credential is
     minted seconds earlier and the server checks both that it is theirs and
     that it is fresh, so it can't be replayed. */
  const commit = async (credential: string) => {
    if (!pending) return;
    setReauthError(null);

    if (pending.kind === 'resetPoints') {
      setResetting(true);
      try {
        const { affected } = await api.post<{ affected: number }>('/admin/points/reset', {
          credential,
        });
        setPending(null);
        toast(
          'success',
          ar
            ? `تم تصفير النقاط لـ ${affected} عضوًا.`
            : `Points cleared for ${affected} members.`
        );
      } catch (err) {
        // Keep the dialog open so they can retry the confirmation.
        setReauthError(err instanceof Error ? err.message : 'Reset failed');
      } finally {
        setResetting(false);
      }
      return;
    }

    if (pending.kind === 'delete') {
      const { target } = pending;
      setSavingId(target.id);
      try {
        await api.delete(`/admin/users/${target.id}`, { credential });
        setUsers((prev) => prev.filter((u) => u.id !== target.id));
        if (permsOpenId === target.id) setPermsOpenId(null);
        setPending(null);
        toast(
          'success',
          ar ? `تم حذف حساب ${target.displayName}.` : `${target.displayName}'s account was deleted.`
        );
      } catch (err) {
        // Keep the dialog open so they can retry the confirmation.
        setReauthError(err instanceof Error ? err.message : 'Delete failed');
      } finally {
        setSavingId(null);
      }
      return;
    }

    const { target } = pending;
    setSavingId(target.id);
    try {
      const { user: updated } =
        pending.kind === 'role'
          ? await api.patch<{ user: AdminUser }>(`/admin/users/${target.id}/role`, {
              role: pending.role,
              credential,
            })
          : await api.patch<{ user: AdminUser }>(`/admin/users/${target.id}/permissions`, {
              permissions: permsDraft,
              credential,
            });

      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      if (pending.kind === 'perms') setPermsOpenId(null);
      setPending(null);
      toast(
        'success',
        pending.kind === 'role'
          ? ar
            ? `تم تغيير دور ${updated.displayName} إلى ${ROLE_META[updated.role].label.ar}.`
            : `${updated.displayName} is now ${ROLE_META[updated.role].label.en}.`
          : ar
          ? `تم تحديث صلاحيات ${updated.displayName}.`
          : `${updated.displayName}'s permissions updated.`
      );
    } catch (err) {
      // Keep the dialog open so they can retry the confirmation.
      setReauthError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setSavingId(null);
    }
  };

  const fmtDate = (iso?: string) => {
    if (!iso) return '-';
    try {
      return new Date(iso).toLocaleDateString(ar ? 'ar' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '-';
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
            ? 'إدارة أدوار المستخدمين، رقِّ الطلاب إلى منشئي محتوى أو مديرين.'
            : 'Manage user roles, promote students to creators or admins.'
        }
      />

      {/* toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search
            size={15}
            className="absolute start-3.5 top-1/2 -translate-y-1/2 text-[#7c8aa6] pointer-events-none"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              ar ? 'ابحث بالاسم أو المعرّف أو البريد...' : 'Search by name, username or email...'
            }
            className="w-full bg-[#121a2a] border border-[#263248] rounded-lg ps-10 pe-4 py-2.5 text-sm text-[#d2d7e3] focus:outline-none focus:border-[#00a859]/50 transition-colors placeholder:text-[#7c8aa6]"
          />
        </div>
        <button
          onClick={() => void load()}
          className="w-10 h-10 rounded-lg bg-[#121a2a] border border-[#263248] flex items-center justify-center text-[#8390ac] hover:text-[#00a859] hover:border-[#00a859]/40 transition-all flex-shrink-0"
          title={ar ? 'تحديث' : 'Refresh'}
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
        <span className="text-xs text-[#8592ad] flex-shrink-0" dir="ltr">
          {filtered.length} / {users.length}
        </span>
      </div>

      {/* list */}
      {loading ? (
        <EnhancedCard padding="xl" className="text-center">
          <p className="text-sm text-[#8592ad]">{ar ? 'جارٍ التحميل...' : 'Loading members...'}</p>
        </EnhancedCard>
      ) : filtered.length === 0 ? (
        <EnhancedCard padding="xl" className="text-center">
          <p className="text-sm text-[#8592ad]">
            {ar ? 'لا يوجد أعضاء مطابقون.' : 'No members match.'}
          </p>
        </EnhancedCard>
      ) : (
        <EnhancedCard padding="none" className="overflow-hidden">
          <div className="divide-y divide-[#263248]/60">
            {filtered.map((u, i) => {
              const meta = ROLE_META[u.role];
              const isSelf = u.id === me?._id;
              const leaving = !!u.deletionScheduledFor;
              return (
                <React.Fragment key={u.id}>
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.3), duration: 0.3 }}
                  className={`flex flex-wrap items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 min-w-0 ${u.isBanned ? 'opacity-50' : ''}`}
                >
                  {/* avatar */}
                  <Avatar
                    avatarUrl={u.avatarUrl}
                    name={u.displayName}
                    className="w-10 h-10 rounded-full"
                    initialClassName="text-sm"
                  />

                  {/* identity */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#f3f6ff] truncate">
                      {u.displayName}
                      {isSelf && (
                        <span className="text-[#8592ad] font-normal"> {ar ? '(أنت)' : '(you)'}</span>
                      )}
                      {u.isBanned && (
                        <span className="ms-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide bg-red-500/10 border border-red-500/30 text-red-400">
                          <Ban size={8} /> {ar ? 'محظور' : 'Banned'}
                        </span>
                      )}
                      {leaving && (
                        <span className="ms-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide bg-red-500/10 border border-red-500/30 text-red-400">
                          <Clock size={8} /> {ar ? 'طلب الحذف' : 'Deletion requested'}
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-[#8592ad] truncate" dir="ltr">
                      {u.username ? (
                        <span className="font-mono text-[#9aa5bf]">@{u.username}</span>
                      ) : (
                        /* Worth surfacing rather than hiding: a member with no
                           handle cannot be found by one, so sharing a studio
                           tab with them will fail until they claim it. */
                        <span className="italic text-[#7c8aa6]" dir="auto">
                          {ar ? 'بلا معرّف' : 'no username'}
                        </span>
                      )}
                      <span className="mx-1.5 text-[#354562]">·</span>
                      {u.email}
                    </p>
                    {/* The whole story of a request, dates included, on its own
                        line: the badge alone would not say when it goes. */}
                    {leaving && (
                      <p className="mt-1 flex items-start gap-1.5 text-[11px] leading-snug text-red-300">
                        <Clock size={11} className="mt-px flex-shrink-0" />
                        <span>
                          {ar
                            ? `طلب حذف حسابه في ${fmtDate(u.deletionRequestedAt)}، ويُحذف في ${fmtDate(u.deletionScheduledFor)} ما لم يسجّل الدخول قبل ذلك.`
                            : `Asked on ${fmtDate(u.deletionRequestedAt)} to delete their account. It will be deleted on ${fmtDate(u.deletionScheduledFor)} unless they sign in before then.`}
                        </span>
                      </p>
                    )}
                  </div>

                  {/* dates */}
                  <div className="hidden md:block text-end flex-shrink-0">
                    <p className="text-[10px] text-[#7c8aa6]">
                      {ar ? 'انضم' : 'Joined'} {fmtDate(u.createdAt)}
                    </p>
                    <p className="text-[10px] text-[#7c8aa6]">
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
                      className={`w-8 h-8 touch:w-11 touch:h-11 rounded-lg border flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-30 ${
                        permsOpenId === u.id
                          ? 'border-[#f3a43a]/50 text-[#f3a43a] bg-[#f3a43a]/10'
                          : 'border-[#263248] text-[#8592ad] hover:text-[#f3a43a] hover:border-[#f3a43a]/40 hover:bg-[#f3a43a]/10'
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
                    className={`w-8 h-8 touch:w-11 touch:h-11 rounded-lg border flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                      u.isBanned
                        ? 'border-[#00a859]/30 text-[#00a859] hover:bg-[#00a859]/10'
                        : 'border-[#263248] text-[#8592ad] hover:text-red-400 hover:border-red-500/40 hover:bg-red-500/10'
                    }`}
                  >
                    {u.isBanned ? <RotateCcw size={13} /> : <Ban size={13} />}
                  </button>

                  {/* delete account */}
                  <button
                    onClick={() => void askDelete(u)}
                    disabled={isSelf || savingId === u.id || u.role === 'admin'}
                    aria-label={ar ? 'حذف الحساب' : 'Delete account'}
                    title={
                      isSelf
                        ? ar
                          ? 'لا يمكنك حذف حسابك من هنا'
                          : "You can't delete your own account here"
                        : u.role === 'admin'
                        ? ar
                          ? 'خفّض رتبة المدير قبل حذف حسابه'
                          : 'Demote this admin before deleting their account'
                        : leaving
                        ? ar
                          ? 'احذفه الآن'
                          : 'Delete now'
                        : ar
                        ? 'حذف الحساب'
                        : 'Delete account'
                    }
                    className="w-8 h-8 touch:w-11 touch:h-11 rounded-lg border border-[#263248] flex items-center justify-center flex-shrink-0 text-[#8592ad] transition-all hover:text-red-400 hover:border-red-500/40 hover:bg-red-500/10 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Trash2 size={13} />
                  </button>
                </motion.div>

                {/* Creator permissions panel */}
                {permsOpenId === u.id && u.role === 'creator' && (
                  <div className="px-5 pb-4 pt-1 bg-[#0b1019]">
                    <p className="text-[11px] text-[#8592ad] mb-3">
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
                              <span className="block text-[10px] text-[#8592ad] leading-snug">
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

      {/* ── Danger zone ──
          Kept away from the row controls and from Refresh: it is the only
          control on the page that acts on every account at once, and the only
          one that cannot be walked back. */}
      <div className="rounded-xl border border-red-500/25 bg-red-500/[0.04] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-sm font-bold text-[#f3f6ff]">
              <Trophy size={15} className="text-red-400" />
              {ar ? 'تصفير لوحة الصدارة' : 'Reset the leaderboard'}
            </p>
            <p className="mt-1.5 max-w-xl text-[11px] leading-relaxed text-[#8592ad]">
              {ar
                ? 'يعيد نقاط كل الأعضاء إلى الصفر، الكلية والشهرية معًا. لا يفقد أحد تقدّمه: الوحدات المكتملة تبقى مكتملة، وتُحتسب النقاط الجديدة من الآن. لا يمكن التراجع.'
                : 'Takes every member back to zero, on the all-time and the monthly board. Nobody loses progress: completed modules stay completed, and new points count from here. This cannot be undone.'}
            </p>
          </div>
          <button
            onClick={() => void askResetPoints()}
            disabled={resetting}
            className="flex-shrink-0 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-xs font-bold text-red-400 transition-all hover:border-red-500/60 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {resetting
              ? ar
                ? 'جارٍ التصفير...'
                : 'Resetting...'
              : ar
              ? 'تصفير النقاط'
              : 'Reset points'}
          </button>
        </div>
      </div>

      {/* Step-up confirmation for any privilege change */}
      <ReauthDialog
        open={!!pending}
        busy={
          !pending ? false : pending.kind === 'resetPoints' ? resetting : savingId === pending.target.id
        }
        error={reauthError}
        actionLabel={
          !pending
            ? ''
            : pending.kind === 'resetPoints'
            ? ar
              ? 'تصفير نقاط جميع الأعضاء'
              : "Reset every member's points"
            : pending.kind === 'delete'
            ? ar
              ? `حذف حساب ${pending.target.displayName} نهائيًا`
              : `Delete ${pending.target.displayName}'s account permanently`
            : pending.kind === 'role'
            ? ar
              ? `تغيير دور ${pending.target.displayName} إلى ${ROLE_META[pending.role].label.ar}`
              : `Change ${pending.target.displayName} to ${ROLE_META[pending.role].label.en}`
            : ar
            ? `تحديث صلاحيات ${pending.target.displayName} (${permsDraft.length})`
            : `Update ${pending.target.displayName}'s permissions (${permsDraft.length} granted)`
        }
        onCancel={() => {
          setPending(null);
          setReauthError(null);
        }}
        onCredential={commit}
      />
    </div>
  );
};

export default MembersPage;
