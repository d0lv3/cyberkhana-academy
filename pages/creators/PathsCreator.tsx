import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit3, Trash2, Eye, EyeOff, Clock, ListChecks, User, Route } from 'lucide-react';
import EnhancedCard from '../../components/ui/EnhancedCard';
import Button from '../../components/ui/EnhancedButton';
import DifficultyBadge from '../../components/ui/DifficultyBadge';
import CreatorLayout from '../../components/creators/CreatorLayout';
import StatusBadge from '../../components/creators/StatusBadge';
import { confirmDialog } from '../../components/ui/ConfirmHost';
import { useLang } from '../../contexts/LangContext';
import { useAuth } from '../../contexts/AuthContext';
import { hasPerm } from '../../services/permissions';
import { getCreatorPaths, deletePath, savePath } from '../../services/creatorDataService';
import { statusOf, authorOf, type CreatorPath } from '../../services/creatorTypes';
import ShareTab from '../../components/creators/ShareTab';
import SharedWithMe, { type SharedGroup } from '../../components/creators/SharedWithMe';
import {
  fetchSharedWithMe,
  saveSharedItem,
  deleteSharedItem,
  BUCKET_LABEL,
} from '../../services/collabService';
import { SHARED_PATH_STASH } from './sharedPathStash';
import { coverImageSrc } from '../../data/fundamentalsData';

const PathsCreator: React.FC = () => {
  const navigate = useNavigate();
  const { t, lang } = useLang();
  const { user } = useAuth();
  const canCreate = hasPerm(user, 'paths');
  const [refreshKey, setRefreshKey] = useState(0);

  const paths = getCreatorPaths();

  /* ── Paths another creator has shared with me ── */
  const [shared, setShared] = useState<SharedGroup<CreatorPath>[]>([]);
  const loadShared = useCallback(() => {
    fetchSharedWithMe<CreatorPath>()
      .then((buckets) =>
        setShared(
          buckets
            .filter((b) => b.bucket === 'paths')
            .map((b) => ({ grantId: b.grantId, owner: b.owner, items: b.items }))
        )
      )
      .catch(() => setShared([]));
  }, []);
  useEffect(loadShared, [loadShared, refreshKey]);

  const editShared = (ownerId: string, path: CreatorPath) => {
    const owner = shared.find((g) => g.owner?.id === ownerId)?.owner;
    sessionStorage.setItem(
      SHARED_PATH_STASH,
      JSON.stringify({ id: path.id, ownerId, ownerName: owner?.displayName ?? '', path })
    );
    navigate(`/creators/paths/edit/${path.id}?shared=1`);
  };

  const toggleSharedPublish = async (ownerId: string, path: CreatorPath) => {
    const next = statusOf(path) === 'published' ? 'draft' : 'published';
    await saveSharedItem(ownerId, 'paths', {
      ...path,
      status: next,
      isPublished: next === 'published',
      updatedAt: new Date().toISOString(),
    });
    setRefreshKey((k) => k + 1);
  };

  const deleteShared = async (ownerId: string, path: CreatorPath) => {
    const ok = await confirmDialog({
      title: lang === 'ar' ? 'حذف المسار؟' : 'Delete path?',
      message:
        lang === 'ar'
          ? 'سيُحذف هذا المسار نهائيًا من محتوى مالكه.'
          : "This path will be permanently removed from its owner's content.",
      confirmLabel: t('studio.delete'),
    });
    if (!ok) return;
    await deleteSharedItem(ownerId, 'paths', path.id);
    setRefreshKey((k) => k + 1);
  };

  const handleDelete = async (id: string) => {
    if (
      await confirmDialog({
        title: lang === 'ar' ? 'حذف المسار؟' : 'Delete path?',
        message:
          lang === 'ar'
            ? 'سيُحذف هذا المسار التعليمي نهائيًا. المحتوى الذي يرتبط به لن يتأثّر.'
            : 'This learning path will be permanently removed. The content it links to is not affected.',
        confirmLabel: t('studio.delete'),
      })
    ) {
      deletePath(id);
      setRefreshKey((k) => k + 1);
    }
  };

  const handleTogglePublish = (path: any) => {
    const next = statusOf(path) === 'published' ? 'draft' : 'published';
    savePath({ ...path, status: next, isPublished: next === 'published' });
    setRefreshKey((k) => k + 1);
  };

  return (
    <CreatorLayout
      title={lang === 'ar' ? 'مسارات التعلم' : 'Learning Paths'}
      backTo="/creators"
      backLabel={t('studio.contentStudio')}
    >
      <div key={refreshKey} className="space-y-6">
        <div className="flex justify-between items-start gap-4">
          <p className="text-sm text-[#9aa5bf] max-w-lg">
            {lang === 'ar'
              ? 'رتّب الوحدات والدروس والتحديات الموجودة في منهج موجّه. المسارات المنشورة تظهر في صفحة المسارات لجميع الطلاب.'
              : 'Sequence existing modules, lessons, and challenges into a guided curriculum. Published paths appear on the Paths page for all students.'}
          </p>
          {canCreate && (
            <div className="flex items-center gap-2">
              <ShareTab
                bucket="paths"
                label={BUCKET_LABEL.paths[lang]}
                onChange={() => setRefreshKey((k) => k + 1)}
              />
              <Button size="sm" leftIcon={<Plus size={14} />} onClick={() => navigate('/creators/paths/new')}>
                {t('studio.newPath')}
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-bold text-[#8592ad] uppercase tracking-wider">
            {t('studio.yourPaths')} {paths.length > 0 && `(${paths.length})`}
          </h2>

          {paths.length === 0 ? (
            <EnhancedCard padding="xl" className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#121a2a] border border-[#263248] flex items-center justify-center mx-auto mb-4">
                <Route size={24} className="text-[#a78bfa]" />
              </div>
              <p className="text-sm text-[#8592ad] mb-4 max-w-sm mx-auto">
                {lang === 'ar'
                  ? 'لا توجد مسارات بعد. اجمع أفضل محتواك في مسار يركّز على المهنة.'
                  : 'No paths yet. Bundle your best content into a career-focused track.'}
              </p>
              {canCreate && (
                <Button size="sm" leftIcon={<Plus size={14} />} onClick={() => navigate('/creators/paths/new')}>
                  {lang === 'ar' ? 'أنشئ أول مسار لك' : 'Create your first path'}
                </Button>
              )}
            </EnhancedCard>
          ) : (
            paths.map((path) => (
              <EnhancedCard key={path.id} padding="none" hoverable className="overflow-hidden group">
                <div className="h-1" style={{ backgroundColor: path.color }} />
                <div className="flex items-center gap-4 px-5 py-4">
                  {path.coverImage ? (
                    <div
                      className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border"
                      style={{ borderColor: `${path.color}30` }}
                    >
                      <img src={coverImageSrc(path.coverImage)} alt="" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${path.color}15`, border: `1px solid ${path.color}30` }}
                    >
                      <Route size={16} style={{ color: path.color }} />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-[#f3f6ff] truncate">
                      {path.title.en || t('studio.untitled')}
                    </h3>
                    <p className="text-xs text-[#8592ad] truncate mt-0.5">
                      {path.description.en || t('studio.noDescription')}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0" dir="ltr">
                    <span className="hidden md:flex text-[10px] font-medium text-[#7c8aa6] items-center gap-1">
                      <User size={10} /> {authorOf(path)}
                    </span>
                    <span className="hidden sm:flex text-[10px] text-[#7c8aa6] items-center gap-1">
                      <ListChecks size={10} /> {path.steps.length} {t('studio.stepsLabel')}
                    </span>
                    <span className="hidden sm:flex text-[10px] text-[#7c8aa6] items-center gap-1">
                      <Clock size={10} /> {path.estimatedHours}h
                    </span>
                    <DifficultyBadge difficulty={path.difficulty} />
                    <StatusBadge status={statusOf(path)} />

                    <button
                      onClick={() => handleTogglePublish(path)}
                      title={statusOf(path) === 'published' ? t('studio.unpublish') : t('studio.publish')}
                      className="w-7 h-7 touch:w-11 touch:h-11 flex items-center justify-center rounded-md text-[#8592ad] hover:text-[#00a859] hover:bg-[#00a859]/10 transition-all"
                    >
                      {statusOf(path) === 'published' ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                    <button
                      onClick={() => navigate(`/creators/paths/edit/${path.id}`)}
                      className="w-7 h-7 touch:w-11 touch:h-11 flex items-center justify-center rounded-md text-[#8592ad] hover:text-[#60a5fa] hover:bg-[#60a5fa]/10 transition-all"
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(path.id)}
                      className="w-7 h-7 touch:w-11 touch:h-11 flex items-center justify-center rounded-md text-[#8592ad] hover:text-red-400 hover:bg-red-500/10 transition-all"
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
          label={BUCKET_LABEL.paths[lang]}
          title={(p) => p.title.en || t('studio.untitled')}
          subtitle={(p) => p.description.en || t('studio.noDescription')}
          accent={(p) => p.color}
          meta={(p) => <DifficultyBadge difficulty={p.difficulty} />}
          onEdit={editShared}
          onTogglePublish={toggleSharedPublish}
          onDelete={deleteShared}
          onChange={() => setRefreshKey((k) => k + 1)}
        />
      </div>
    </CreatorLayout>
  );
};

export default PathsCreator;
