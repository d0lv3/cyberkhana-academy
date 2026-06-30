import React, { useEffect, useState } from 'react';
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
import { fundamentalModules } from '../../data/fundamentalsData';
import {
  getCreatorOSModules,
  deleteOSModule,
  saveOSModule,
  fetchAllPublishedModulesForAdmin,
  type AdminPublishedModule,
} from '../../services/creatorDataService';
import { statusOf, authorOf } from '../../services/creatorTypes';

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

  // Admin-only: every published OS module by other authors.
  const [foreign, setForeign] = useState<AdminPublishedModule[]>([]);
  useEffect(() => {
    if (user?.role !== 'admin') return;
    fetchAllPublishedModulesForAdmin()
      .then((items) =>
        setForeign(items.filter((m) => m._bucket === 'os-modules' && m._ownerId !== user._id))
      )
      .catch(() => setForeign([]));
  }, [user, refreshKey]);

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
        <Button
          size="sm"
          leftIcon={<Plus size={14} />}
          onClick={() => navigate('/creators/os-modules/new')}
        >
          {t('studio.newModule')}
        </Button>
      </div>

      {/* Built-in modules */}
      {staticModules.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-[#6e7a94] uppercase tracking-wider">
            {t('studio.builtInModules')}
          </h2>
          {staticModules.map((mod) => (
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
            <Button
              size="sm"
              leftIcon={<Plus size={14} />}
              onClick={() => navigate('/creators/os-modules/new')}
            >
              {t('studio.createModule')}
            </Button>
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

      {/* ── Admin: every published OS module (any author) ── */}
      {user?.role === 'admin' && foreign.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-[#f3a43a]" />
            <h2 className="text-sm font-bold text-[#6e7a94] uppercase tracking-wider">
              {lang === 'ar' ? 'كل وحدات الأنظمة المنشورة' : 'All published OS modules'} ({foreign.length})
            </h2>
          </div>
          <p className="text-xs text-[#6e7a94] -mt-1">
            {lang === 'ar'
              ? 'كمشرف، يمكنك تعديل أي وحدة منشورة. تبقى ملكية المؤلف كما هي.'
              : 'As an admin you can edit any published module. The original author is kept.'}
          </p>

          {foreign.map((mod) => (
            <EnhancedCard key={`${mod._ownerId}-${mod.id}`} padding="none" hoverable className="overflow-hidden group">
              <div className="h-1" style={{ backgroundColor: mod.iconColor }} />
              <div className="flex items-center gap-4 px-5 py-4">
                <div className="w-10 h-10 rounded-lg bg-[#f3a43a]/10 border border-[#f3a43a]/20 flex items-center justify-center flex-shrink-0">
                  <Eye size={16} className="text-[#f3a43a]" />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-[#f3f6ff] truncate">{mod.title.en || t('studio.untitled')}</h3>
                  <p className="text-xs text-[#6e7a94] truncate mt-0.5">{mod.description.en || t('studio.noDescription')}</p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0" dir="ltr">
                  <span className="hidden md:flex text-[10px] font-medium text-[#4d5a73] items-center gap-1">
                    <User size={10} /> {mod._ownerName}
                  </span>
                  <DifficultyBadge difficulty={mod.difficulty} />
                  <StatusBadge status={statusOf(mod)} />

                  <button
                    onClick={() => openAdminEdit(navigate, mod, '/creators/os-modules/edit')}
                    title={lang === 'ar' ? 'تعديل (مشرف)' : 'Edit as admin'}
                    className="w-7 h-7 flex items-center justify-center rounded-md text-[#6e7a94] hover:text-[#f3a43a] hover:bg-[#f3a43a]/10 transition-all"
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
