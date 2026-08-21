import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit3, Trash2, Eye, EyeOff, Clock, Layers, Lock, User, ShieldCheck } from 'lucide-react';
import EnhancedCard from '../../components/ui/EnhancedCard';
import Button from '../../components/ui/EnhancedButton';
import DifficultyBadge from '../../components/ui/DifficultyBadge';
import CreatorLayout from '../../components/creators/CreatorLayout';
import StatusBadge from '../../components/creators/StatusBadge';
import { confirmDialog } from '../../components/ui/ConfirmHost';
import { useLang } from '../../contexts/LangContext';
import { useAuth } from '../../contexts/AuthContext';
import { fundamentalModules, type FundamentalModule } from '../../data/fundamentalsData';
import { builtinToEditableModule } from '../../data/builtinCourse';
import {
  getCreatorOSModules,
  deleteOSModule,
  saveOSModule,
  fetchAllPublishedModulesForAdmin,
  type AdminPublishedModule,
} from '../../services/creatorDataService';
import { statusOf, authorOf, type CreatorFundamentalModule } from '../../services/creatorTypes';
import { hasPerm } from '../../services/permissions';
import { ownerLabel } from './ownerLabel';
import ShareTab from '../../components/creators/ShareTab';
import SharedWithMe, { type SharedGroup } from '../../components/creators/SharedWithMe';
import {
  fetchSharedWithMe,
  saveSharedItem,
  deleteSharedItem,
  BUCKET_LABEL,
} from '../../services/collabService';

/** Stash a foreign module + its owner, then open it in the editor (admin mode). */
function openAdminEdit(
  navigate: ReturnType<typeof useNavigate>,
  mod: AdminPublishedModule,
  editRoute: string
): void {
  const { _ownerId, _ownerName, _bucket, ...clean } = mod;
  sessionStorage.setItem(
    'academy-admin-module-edit',
    JSON.stringify({ id: mod.id, ownerId: _ownerId, ownerName: _ownerName, bucket: _bucket, module: clean })
  );
  navigate(`${editRoute}/${mod.id}?admin=1`);
}

const OSModulesCreator: React.FC = () => {
  const navigate = useNavigate();
  const { t, lang } = useLang();
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  const staticModules = fundamentalModules.filter((m) => m.category === 'operating-systems');
  const creatorModules = getCreatorOSModules();
  const canCreate = hasPerm(user, 'os-modules');

  // Admin-only: every published OS module on the platform, this admin's own
  // included — one place to see what is actually live.
  const [allPublished, setAllPublished] = useState<AdminPublishedModule[]>([]);
  useEffect(() => {
    if (user?.role !== 'admin') return;
    fetchAllPublishedModulesForAdmin()
      .then((items) => setAllPublished(items.filter((m) => m._bucket === 'os-modules')))
      .catch(() => setAllPublished([]));
  }, [user, refreshKey]);

  const isMine = (mod: AdminPublishedModule) => mod._ownerId === user?._id;

  /* ── Modules another creator has shared with me ── */
  const [shared, setShared] = useState<SharedGroup<CreatorFundamentalModule>[]>([]);
  const loadShared = useCallback(() => {
    fetchSharedWithMe<CreatorFundamentalModule>()
      .then((buckets) =>
        setShared(
          buckets
            .filter((b) => b.bucket === 'os-modules')
            .map((b) => ({ grantId: b.grantId, owner: b.owner, items: b.items }))
        )
      )
      .catch(() => setShared([]));
  }, []);
  useEffect(loadShared, [loadShared, refreshKey]);

  /** Open a shared module in the editor, writing back to its owner's bucket. */
  const editShared = (ownerId: string, mod: CreatorFundamentalModule) => {
    const owner = shared.find((g) => g.owner?.id === ownerId)?.owner;
    sessionStorage.setItem(
      'academy-admin-module-edit',
      JSON.stringify({
        id: mod.id,
        ownerId,
        ownerName: owner?.displayName ?? '',
        bucket: 'os-modules',
        module: mod,
      })
    );
    navigate(`/creators/os-modules/edit/${mod.id}?shared=1`);
  };

  const toggleSharedPublish = async (ownerId: string, mod: CreatorFundamentalModule) => {
    const next = statusOf(mod) === 'published' ? 'draft' : 'published';
    await saveSharedItem(ownerId, 'os-modules', {
      ...mod,
      status: next,
      isPublished: next === 'published',
      updatedAt: new Date().toISOString(),
    });
    setRefreshKey((k) => k + 1);
  };

  const deleteShared = async (ownerId: string, mod: CreatorFundamentalModule) => {
    const ok = await confirmDialog({
      title: lang === 'ar' ? 'حذف الوحدة؟' : 'Delete module?',
      message:
        lang === 'ar'
          ? 'ستُحذف هذه الوحدة نهائيًا من محتوى مالكها.'
          : "This module will be permanently removed from its owner's content.",
      confirmLabel: t('studio.delete'),
    });
    if (!ok) return;
    await deleteSharedItem(ownerId, 'os-modules', mod.id);
    setRefreshKey((k) => k + 1);
  };

  /** Mine edits through the normal own-bucket editor (local-first, so the
   * cache stays in step); anyone else's goes through the server-side admin edit. */
  const editPublished = (mod: AdminPublishedModule) => {
    if (isMine(mod)) navigate(`/creators/os-modules/edit/${mod.id}`);
    else openAdminEdit(navigate, mod, '/creators/os-modules/edit');
  };

  const handleDelete = async (id: string) => {
    if (
      await confirmDialog({
        title: lang === 'ar' ? 'حذف وحدة النظام؟' : 'Delete OS module?',
        message:
          lang === 'ar'
            ? 'ستُحذف هذه الوحدة وكل أقسامها نهائيًا.'
            : 'This module and all its sections will be permanently removed.',
        confirmLabel: t('studio.delete'),
      })
    ) {
      deleteOSModule(id);
      setRefreshKey((k) => k + 1);
    }
  };

  const handleTogglePublish = (mod: any) => {
    const next = statusOf(mod) === 'published' ? 'draft' : 'published';
    saveOSModule({ ...mod, status: next, isPublished: next === 'published' });
    setRefreshKey((k) => k + 1);
  };

  const isAdmin = user?.role === 'admin';

  // A built-in is "overridden" once a published creator module shares its id
  // (this admin's own, or any other author's). Hide it so it isn't listed twice.
  const overriddenIds = new Set<string>([
    ...creatorModules.map((m) => m.id),
    ...allPublished.map((m) => m.id),
  ]);
  const visibleStatic = staticModules.filter((m) => !overriddenIds.has(m.id));

  /** Admin edits a built-in course. If an override already exists, edit that;
   * otherwise convert the static course and open it in copy-on-write mode. */
  const editBuiltin = (mod: FundamentalModule) => {
    const own = creatorModules.find((m) => m.id === mod.id);
    if (own) {
      navigate(`/creators/os-modules/edit/${mod.id}`);
      return;
    }
    const override = allPublished.find((m) => m.id === mod.id);
    if (override) {
      editPublished(override);
      return;
    }
    sessionStorage.setItem(
      'academy-builtin-module-edit',
      JSON.stringify({ id: mod.id, module: builtinToEditableModule(mod) })
    );
    navigate(`/creators/os-modules/edit/${mod.id}?builtin=1`);
  };

  return (
    <CreatorLayout
      title={lang === 'ar' ? 'أنظمة التشغيل والوحدات' : 'OS & Modules'}
      backTo="/creators"
      backLabel={t('studio.contentStudio')}
    >
      <div className="flex justify-between items-start">
        <p className="text-sm text-[#9aa5bf] max-w-lg">
          {lang === 'ar'
            ? 'الوحدات المُنشأة هنا تظهر في صفحة أساسيات أنظمة التشغيل وصفحة الوحدات معًا.'
            : 'Modules created here appear in both the Operating Systems fundamentals page and the Modules page.'}
        </p>
        {canCreate && (
          <div className="flex items-center gap-2">
            <ShareTab
              bucket="os-modules"
              label={BUCKET_LABEL['os-modules'][lang]}
              onChange={() => setRefreshKey((k) => k + 1)}
            />
            <Button
              size="sm"
              leftIcon={<Plus size={14} />}
              onClick={() => navigate('/creators/os-modules/new')}
            >
              {t('studio.newModule')}
            </Button>
          </div>
        )}
      </div>

      {/* Built-in modules */}
      {visibleStatic.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-[#6e7a94] uppercase tracking-wider">
            {t('studio.builtInModules')}
          </h2>
          {isAdmin && (
            <p className="text-xs text-[#6e7a94] -mt-1">
              {lang === 'ar'
                ? 'كمشرف، يمكنك تعديل الدورات المدمجة. أول حفظ ينشئ نسخة قابلة للتعديل تحل محل الأصل.'
                : 'As an admin you can edit built-in courses. The first save creates an editable copy that replaces the original.'}
            </p>
          )}
          {visibleStatic.map((mod) => (
            <EnhancedCard key={mod.id} padding="none" className="overflow-hidden">
              <div className="h-1" style={{ backgroundColor: mod.iconColor }} />
              <div className="flex items-center gap-4 px-5 py-4">
                <div className="w-10 h-10 rounded-lg bg-[#1a2332] border border-[#263248] flex items-center justify-center flex-shrink-0">
                  <Lock size={16} className="text-[#6e7a94]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-[#f3f6ff] truncate">{mod.title.en}</h3>
                  <p className="text-xs text-[#6e7a94] truncate mt-0.5">{mod.description.en}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0" dir="ltr">
                  <DifficultyBadge difficulty={mod.difficulty} />
                  <span className="text-[10px] text-[#4d5a73] flex items-center gap-1">
                    <Clock size={10} /> {mod.estimatedHours}h
                  </span>
                  <span className="text-[10px] text-[#4d5a73] flex items-center gap-1">
                    <Layers size={10} /> {mod.totalLessons} {t('studio.lessonsLabel')}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1a2332] border border-[#263248] text-[#6e7a94]">
                    {t('studio.builtIn')}
                  </span>
                  {isAdmin && (
                    <button
                      onClick={() => editBuiltin(mod)}
                      title={lang === 'ar' ? 'تعديل (مشرف)' : 'Edit as admin'}
                      className="w-7 h-7 flex items-center justify-center rounded-md text-[#6e7a94] hover:text-[#9fef00] hover:bg-[#9fef00]/10 transition-all"
                    >
                      <Edit3 size={13} />
                    </button>
                  )}
                </div>
              </div>
            </EnhancedCard>
          ))}
        </div>
      )}

      {/* Creator modules */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-[#6e7a94] uppercase tracking-wider">
          {t('studio.yourModules')} {creatorModules.length > 0 && `(${creatorModules.length})`}
        </h2>

        {creatorModules.length === 0 ? (
          <EnhancedCard padding="xl" className="text-center">
            <p className="text-sm text-[#6e7a94] mb-4">
              {lang === 'ar'
                ? 'لا توجد وحدات مخصصة بعد. أنشئ أول وحدة نظام تشغيل لك!'
                : 'No custom modules yet. Create your first OS module!'}
            </p>
            {canCreate && (
              <Button
                size="sm"
                leftIcon={<Plus size={14} />}
                onClick={() => navigate('/creators/os-modules/new')}
              >
                {t('studio.createModule')}
              </Button>
            )}
          </EnhancedCard>
        ) : (
          creatorModules.map((mod) => (
            <EnhancedCard key={mod.id} padding="none" hoverable className="overflow-hidden group">
              <div className="h-1" style={{ backgroundColor: mod.iconColor }} />
              <div className="flex items-center gap-4 px-5 py-4">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    mod.isPublished
                      ? 'bg-[#00a859]/10 border border-[#00a859]/20'
                      : 'bg-[#1a2332] border border-[#263248]'
                  }`}
                >
                  {mod.isPublished ? (
                    <Eye size={16} className="text-[#00a859]" />
                  ) : (
                    <EyeOff size={16} className="text-[#6e7a94]" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-[#f3f6ff] truncate">
                    {mod.title.en || t('studio.untitled')}
                  </h3>
                  <p className="text-xs text-[#6e7a94] truncate mt-0.5">
                    {mod.description.en || t('studio.noDescription')}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="hidden md:flex text-[10px] font-medium text-[#4d5a73] items-center gap-1">
                    <User size={10} /> {authorOf(mod)}
                  </span>
                  <DifficultyBadge difficulty={mod.difficulty} />

                  <StatusBadge status={statusOf(mod)} />

                  {mod.showInModules && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#60a5fa]/10 border border-[#60a5fa]/20 text-[#60a5fa]">
                      {t('studio.inModules')}
                    </span>
                  )}

                  <button
                    onClick={() => handleTogglePublish(mod)}
                    className="w-7 h-7 flex items-center justify-center rounded-md text-[#6e7a94] hover:text-[#00a859] hover:bg-[#00a859]/10 transition-all"
                  >
                    {statusOf(mod) === 'published' ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>

                  <button
                    onClick={() => navigate(`/creators/os-modules/edit/${mod.id}`)}
                    className="w-7 h-7 flex items-center justify-center rounded-md text-[#6e7a94] hover:text-[#60a5fa] hover:bg-[#60a5fa]/10 transition-all"
                  >
                    <Edit3 size={13} />
                  </button>

                  <button
                    onClick={() => handleDelete(mod.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-md text-[#6e7a94] hover:text-red-400 hover:bg-red-500/10 transition-all"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </EnhancedCard>
          ))
        )}
      </div>

      <SharedWithMe
        groups={shared}
        label={BUCKET_LABEL['os-modules'][lang]}
        title={(m) => m.title.en || t('studio.untitled')}
        subtitle={(m) => m.description.en || t('studio.noDescription')}
        accent={(m) => m.iconColor}
        meta={(m) => <DifficultyBadge difficulty={m.difficulty} />}
        onEdit={editShared}
        onTogglePublish={toggleSharedPublish}
        onDelete={deleteShared}
        onChange={() => setRefreshKey((k) => k + 1)}
      />

      {/* ── Admin: every published OS module (any author) ── */}
      {user?.role === 'admin' && allPublished.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-[#f3a43a]" />
            <h2 className="text-sm font-bold text-[#6e7a94] uppercase tracking-wider">
              {lang === 'ar' ? 'كل وحدات الأنظمة المنشورة' : 'All published OS modules'} ({allPublished.length})
            </h2>
          </div>
          <p className="text-xs text-[#6e7a94] -mt-1">
            {lang === 'ar'
              ? 'كمشرف، يمكنك تعديل أي وحدة منشورة. تبقى ملكية المؤلف كما هي.'
              : 'As an admin you can edit any published module. The original author is kept.'}
          </p>

          {allPublished.map((mod) => (
            <EnhancedCard key={`${mod._ownerId}-${mod.id}`} padding="none" hoverable className="overflow-hidden group">
              <div className="h-1" style={{ backgroundColor: mod.iconColor }} />
              <div className="flex items-center gap-4 px-5 py-4">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isMine(mod)
                      ? 'bg-[#00a859]/10 border border-[#00a859]/20'
                      : 'bg-[#f3a43a]/10 border border-[#f3a43a]/20'
                  }`}
                >
                  <Eye size={16} className={isMine(mod) ? 'text-[#00a859]' : 'text-[#f3a43a]'} />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-[#f3f6ff] truncate">{mod.title.en || t('studio.untitled')}</h3>
                  <p className="text-xs text-[#6e7a94] truncate mt-0.5">{mod.description.en || t('studio.noDescription')}</p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0" dir="ltr">
                  <span className="hidden md:flex text-[10px] font-medium text-[#4d5a73] items-center gap-1">
                    <User size={10} /> {ownerLabel(mod._ownerId, mod._ownerName, user?._id, lang)}
                  </span>
                  <DifficultyBadge difficulty={mod.difficulty} />
                  <StatusBadge status={statusOf(mod)} />

                  <button
                    onClick={() => editPublished(mod)}
                    title={isMine(mod) ? t('studio.edit') : lang === 'ar' ? 'تعديل (مشرف)' : 'Edit as admin'}
                    className={`w-7 h-7 flex items-center justify-center rounded-md text-[#6e7a94] transition-all ${
                      isMine(mod)
                        ? 'hover:text-[#60a5fa] hover:bg-[#60a5fa]/10'
                        : 'hover:text-[#f3a43a] hover:bg-[#f3a43a]/10'
                    }`}
                  >
                    <Edit3 size={13} />
                  </button>
                </div>
              </div>
            </EnhancedCard>
          ))}
        </div>
      )}
    </CreatorLayout>
  );
};

export default OSModulesCreator;
