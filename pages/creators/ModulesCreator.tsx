import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit3, Trash2, Eye, EyeOff, Clock, Layers, User, Box } from 'lucide-react';
import EnhancedCard from '../../components/ui/EnhancedCard';
import Button from '../../components/ui/EnhancedButton';
import DifficultyBadge from '../../components/ui/DifficultyBadge';
import CreatorLayout from '../../components/creators/CreatorLayout';
import StatusBadge from '../../components/creators/StatusBadge';
import { confirmDialog } from '../../components/ui/ConfirmHost';
import { useLang } from '../../contexts/LangContext';
import { getCreatorStandaloneModules, deleteStandaloneModule, saveStandaloneModule } from '../../services/creatorDataService';
import { statusOf, authorOf } from '../../services/creatorTypes';

const ModulesCreator: React.FC = () => {
  const navigate = useNavigate();
  const { t, lang } = useLang();
  const [refreshKey, setRefreshKey] = useState(0);

  const modules = getCreatorStandaloneModules();

  const handleDelete = async (id: string) => {
    if (
      await confirmDialog({
        title: lang === 'ar' ? 'حذف الوحدة؟' : 'Delete module?',
        message:
          lang === 'ar'
            ? 'ستُحذف هذه الوحدة وكل أقسامها نهائيًا.'
            : 'This module and all its sections will be permanently removed.',
        confirmLabel: t('studio.delete'),
      })
    ) {
      deleteStandaloneModule(id);
      setRefreshKey((k) => k + 1);
    }
  };

  const handleTogglePublish = (mod: any) => {
    const next = statusOf(mod) === 'published' ? 'draft' : 'published';
    saveStandaloneModule({ ...mod, status: next, isPublished: next === 'published' });
    setRefreshKey((k) => k + 1);
  };

  return (
    <CreatorLayout title={t('sidebar.modules')} backTo="/creators" backLabel={t('studio.contentStudio')}>
      <div key={refreshKey} className="space-y-6">
        <div className="flex justify-between items-start gap-4">
          <p className="text-sm text-[#9aa5bf] max-w-lg">
            {lang === 'ar'
              ? 'وحدات مستقلة مقسّمة إلى أقسام تظهر في مركز الوحدات. كل وحدة مقسّمة إلى فصول وأقسام، تمامًا مثل الدورة.'
              : 'Standalone, section-divided modules that appear on the Modules hub. Each module is split into chapters and sections, just like a course.'}
          </p>
          <Button size="sm" leftIcon={<Plus size={14} />} onClick={() => navigate('/creators/modules/new')}>
            {t('studio.newModule')}
          </Button>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-bold text-[#6e7a94] uppercase tracking-wider">
            {t('studio.yourModules')} {modules.length > 0 && `(${modules.length})`}
          </h2>

          {modules.length === 0 ? (
            <EnhancedCard padding="xl" className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#121a2a] border border-[#263248] flex items-center justify-center mx-auto mb-4">
                <Box size={24} className="text-[#34d399]" />
              </div>
              <p className="text-sm text-[#6e7a94] mb-4 max-w-sm mx-auto">
                {lang === 'ar'
                  ? 'لا توجد وحدات بعد. ابنِ أول وحدة مقسّمة إلى أقسام.'
                  : 'No modules yet. Build your first section-divided module.'}
              </p>
              <Button size="sm" leftIcon={<Plus size={14} />} onClick={() => navigate('/creators/modules/new')}>
                {lang === 'ar' ? 'أنشئ أول وحدة لك' : 'Create your first module'}
              </Button>
            </EnhancedCard>
          ) : (
            modules.map((mod) => (
              <EnhancedCard key={mod.id} padding="none" hoverable className="overflow-hidden group">
                <div className="h-1" style={{ backgroundColor: mod.iconColor }} />
                <div className="flex items-center gap-4 px-5 py-4">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      mod.isPublished ? 'bg-[#34d399]/10 border border-[#34d399]/20' : 'bg-[#1a2332] border border-[#263248]'
                    }`}
                  >
                    {mod.isPublished ? <Eye size={16} className="text-[#34d399]" /> : <EyeOff size={16} className="text-[#6e7a94]" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-[#f3f6ff] truncate">{mod.title.en || t('studio.untitled')}</h3>
                    <p className="text-xs text-[#6e7a94] truncate mt-0.5">{mod.description.en || t('studio.noDescription')}</p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0" dir="ltr">
                    <span className="hidden md:flex text-[10px] font-medium text-[#4d5a73] items-center gap-1">
                      <User size={10} /> {authorOf(mod)}
                    </span>
                    <span className="hidden sm:flex text-[10px] text-[#4d5a73] items-center gap-1">
                      <Layers size={10} /> {mod.totalLessons} {t('studio.sectionsLabel')}
                    </span>
                    <span className="hidden sm:flex text-[10px] text-[#4d5a73] items-center gap-1">
                      <Clock size={10} /> {mod.estimatedHours}h
                    </span>
                    <DifficultyBadge difficulty={mod.difficulty} />
                    <StatusBadge status={statusOf(mod)} />

                    <button
                      onClick={() => handleTogglePublish(mod)}
                      title={statusOf(mod) === 'published' ? t('studio.unpublish') : t('studio.publish')}
                      className="w-7 h-7 flex items-center justify-center rounded-md text-[#6e7a94] hover:text-[#00a859] hover:bg-[#00a859]/10 transition-all"
                    >
                      {statusOf(mod) === 'published' ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                    <button
                      onClick={() => navigate(`/creators/modules/edit/${mod.id}`)}
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
      </div>
    </CreatorLayout>
  );
};

export default ModulesCreator;
