import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit3, Trash2, Eye, EyeOff, Clock, Activity, Lock, User } from 'lucide-react';
import EnhancedCard from '../../components/ui/EnhancedCard';
import Button from '../../components/ui/EnhancedButton';
import CreatorLayout from '../../components/creators/CreatorLayout';
import StatusBadge from '../../components/creators/StatusBadge';
import { confirmDialog } from '../../components/ui/ConfirmHost';
import { useLang } from '../../contexts/LangContext';
import { networkingLessons } from '../../data/networking';
import {
  getCreatorNetworkingLessons,
  deleteNetworkingLesson,
  saveNetworkingLesson,
} from '../../services/creatorDataService';
import { statusOf, authorOf } from '../../services/creatorTypes';

const NetworkingCreator: React.FC = () => {
  const navigate = useNavigate();
  const { t, lang } = useLang();
  const [refreshKey, setRefreshKey] = React.useState(0);

  const creatorLessons = getCreatorNetworkingLessons();

  const handleDelete = async (id: string) => {
    if (
      await confirmDialog({
        title: lang === 'ar' ? 'حذف الدرس؟' : 'Delete lesson?',
        message:
          lang === 'ar'
            ? 'سيُحذف درس الشبكات هذا ومحاكاته نهائيًا.'
            : 'This networking lesson and its simulation will be permanently removed.',
        confirmLabel: t('studio.delete'),
      })
    ) {
      deleteNetworkingLesson(id);
      setRefreshKey((k) => k + 1);
    }
  };

  const handleTogglePublish = (lesson: any) => {
    const next = statusOf(lesson) === 'published' ? 'draft' : 'published';
    saveNetworkingLesson({ ...lesson, status: next, isPublished: next === 'published' });
    setRefreshKey((k) => k + 1);
  };

  return (
    <CreatorLayout
      title={lang === 'ar' ? 'دروس الشبكات' : 'Networking Lessons'}
      backTo="/creators"
      backLabel={t('studio.contentStudio')}
    >
      {/* New lesson button */}
      <div className="flex justify-end">
        <Button
          size="sm"
          leftIcon={<Plus size={14} />}
          onClick={() => navigate('/creators/networking/new')}
        >
          {t('studio.newLesson')}
        </Button>
      </div>

      {/* Built-in lessons */}
      {networkingLessons.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-[#6e7a94] uppercase tracking-wider">
            {t('studio.builtInLessons')}
          </h2>
          {networkingLessons.map((lesson) => (
            <EnhancedCard key={lesson.id} padding="none" className="overflow-hidden">
              <div className="flex items-center gap-4 px-5 py-4">
                <div className="w-10 h-10 rounded-lg bg-[#60a5fa]/10 border border-[#60a5fa]/20 flex items-center justify-center flex-shrink-0">
                  <Lock size={16} className="text-[#60a5fa]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-[#f3f6ff] truncate">
                    {lesson.title.en}
                  </h3>
                  <p className="text-xs text-[#6e7a94] truncate mt-0.5">
                    {lesson.description.en}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0" dir="ltr">
                  <span className="text-[10px] font-medium text-[#4d5a73] flex items-center gap-1">
                    <Clock size={10} /> {lesson.estimatedMinutes}m
                  </span>
                  <span className="text-[10px] font-medium text-[#4d5a73] flex items-center gap-1">
                    <Activity size={10} /> {lesson.simulation.steps.length} {t('studio.stepsLabel')}
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

      {/* Creator lessons */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-[#6e7a94] uppercase tracking-wider">
          {t('studio.yourLessons')} {creatorLessons.length > 0 && `(${creatorLessons.length})`}
        </h2>

        {creatorLessons.length === 0 ? (
          <EnhancedCard padding="xl" className="text-center">
            <p className="text-sm text-[#6e7a94] mb-4">
              {lang === 'ar'
                ? 'لا توجد دروس مخصصة بعد. أنشئ أول درس شبكات لك!'
                : 'No custom lessons yet. Create your first networking lesson!'}
            </p>
            <Button
              size="sm"
              leftIcon={<Plus size={14} />}
              onClick={() => navigate('/creators/networking/new')}
            >
              {t('studio.createLesson')}
            </Button>
          </EnhancedCard>
        ) : (
          creatorLessons.map((lesson) => (
            <EnhancedCard key={lesson.id} padding="none" hoverable className="overflow-hidden group">
              <div className="flex items-center gap-4 px-5 py-4">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    statusOf(lesson) === 'published'
                      ? 'bg-[#00a859]/10 border border-[#00a859]/20'
                      : 'bg-[#1a2332] border border-[#263248]'
                  }`}
                >
                  {statusOf(lesson) === 'published' ? (
                    <Eye size={16} className="text-[#00a859]" />
                  ) : (
                    <EyeOff size={16} className="text-[#6e7a94]" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-[#f3f6ff] truncate">
                    {lesson.title.en || t('studio.untitled')}
                  </h3>
                  <p className="text-xs text-[#6e7a94] truncate mt-0.5">
                    {lesson.description.en || t('studio.noDescription')}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="hidden md:flex text-[10px] font-medium text-[#4d5a73] items-center gap-1">
                    <User size={10} /> {authorOf(lesson)}
                  </span>
                  <span className="text-[10px] font-medium text-[#4d5a73] flex items-center gap-1">
                    <Clock size={10} /> {lesson.estimatedMinutes}m
                  </span>

                  <StatusBadge status={statusOf(lesson)} />

                  <button
                    onClick={() => handleTogglePublish(lesson)}
                    className="w-7 h-7 flex items-center justify-center rounded-md text-[#6e7a94] hover:text-[#00a859] hover:bg-[#00a859]/10 transition-all"
                    title={statusOf(lesson) === 'published' ? t('studio.unpublish') : t('studio.publish')}
                  >
                    {statusOf(lesson) === 'published' ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>

                  <button
                    onClick={() => navigate(`/creators/networking/edit/${lesson.id}`)}
                    className="w-7 h-7 flex items-center justify-center rounded-md text-[#6e7a94] hover:text-[#60a5fa] hover:bg-[#60a5fa]/10 transition-all"
                    title={t('studio.edit')}
                  >
                    <Edit3 size={13} />
                  </button>

                  <button
                    onClick={() => handleDelete(lesson.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-md text-[#6e7a94] hover:text-red-400 hover:bg-red-500/10 transition-all"
                    title={t('studio.delete')}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </EnhancedCard>
          ))
        )}
      </div>
    </CreatorLayout>
  );
};

export default NetworkingCreator;
