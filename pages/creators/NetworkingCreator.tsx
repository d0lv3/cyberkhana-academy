import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit3, Trash2, Eye, EyeOff, Clock, Activity, Lock, User, ShieldCheck } from 'lucide-react';
import EnhancedCard from '../../components/ui/EnhancedCard';
import Button from '../../components/ui/EnhancedButton';
import CreatorLayout from '../../components/creators/CreatorLayout';
import StatusBadge from '../../components/creators/StatusBadge';
import { confirmDialog } from '../../components/ui/ConfirmHost';
import { useLang } from '../../contexts/LangContext';
import { useAuth } from '../../contexts/AuthContext';
import { hasPerm } from '../../services/permissions';
import { networkingLessons } from '../../data/networking';
import {
  getCreatorNetworkingLessons,
  deleteNetworkingLesson,
  saveNetworkingLesson,
  fetchAllPublishedNetworkingForAdmin,
  type AdminPublishedNetworkingLesson,
} from '../../services/creatorDataService';
import { statusOf, authorOf, type CreatorNetworkingLesson } from '../../services/creatorTypes';
import { ADMIN_NETWORKING_STASH } from './networkingEditStash';
import { ownerLabel } from './ownerLabel';
import ShareTab from '../../components/creators/ShareTab';
import SharedWithMe, { type SharedGroup } from '../../components/creators/SharedWithMe';
import {
  fetchSharedWithMe,
  saveSharedItem,
  deleteSharedItem,
  BUCKET_LABEL,
} from '../../services/collabService';

/** Stash a foreign lesson + its owner, then open it in the editor (admin mode). */
function openAdminEdit(
  navigate: ReturnType<typeof useNavigate>,
  lesson: AdminPublishedNetworkingLesson
): void {
  const { _ownerId, _ownerName, _bucket, ...clean } = lesson;
  sessionStorage.setItem(
    ADMIN_NETWORKING_STASH,
    JSON.stringify({ id: lesson.id, ownerId: _ownerId, ownerName: _ownerName, lesson: clean })
  );
  navigate(`/creators/networking/edit/${lesson.id}?admin=1`);
}

const NetworkingCreator: React.FC = () => {
  const navigate = useNavigate();
  const { t, lang } = useLang();
  const { user } = useAuth();
  const canCreate = hasPerm(user, 'networking');
  const isAdmin = user?.role === 'admin';
  const [refreshKey, setRefreshKey] = useState(0);

  const creatorLessons = getCreatorNetworkingLessons();

  // Admin-only: every published networking lesson on the platform, this
  // admin's own included — the section below is the one place to see what is
  // actually live, whoever wrote it.
  const [allPublished, setAllPublished] = useState<AdminPublishedNetworkingLesson[]>([]);
  useEffect(() => {
    if (!isAdmin) return;
    fetchAllPublishedNetworkingForAdmin()
      .then(setAllPublished)
      .catch(() => setAllPublished([]));
  }, [isAdmin, refreshKey]);

  const isMine = (lesson: AdminPublishedNetworkingLesson) => lesson._ownerId === user?._id;

  /* ── Lessons another creator has shared with me ── */
  const [shared, setShared] = useState<SharedGroup<CreatorNetworkingLesson>[]>([]);
  const loadShared = useCallback(() => {
    fetchSharedWithMe<CreatorNetworkingLesson>()
      .then((buckets) =>
        setShared(
          buckets
            .filter((b) => b.bucket === 'networking-lessons')
            .map((b) => ({ grantId: b.grantId, owner: b.owner, items: b.items }))
        )
      )
      .catch(() => setShared([]));
  }, []);
  useEffect(loadShared, [loadShared, refreshKey]);

  /** Open a shared lesson in the editor, writing back to its owner's bucket. */
  const editShared = (ownerId: string, lesson: CreatorNetworkingLesson) => {
    const owner = shared.find((g) => g.owner?.id === ownerId)?.owner;
    sessionStorage.setItem(
      ADMIN_NETWORKING_STASH,
      JSON.stringify({
        id: lesson.id,
        ownerId,
        ownerName: owner?.displayName ?? '',
        lesson,
      })
    );
    navigate(`/creators/networking/edit/${lesson.id}?shared=1`);
  };

  const toggleSharedPublish = async (ownerId: string, lesson: CreatorNetworkingLesson) => {
    const next = statusOf(lesson) === 'published' ? 'draft' : 'published';
    await saveSharedItem(ownerId, 'networking-lessons', {
      ...lesson,
      status: next,
      isPublished: next === 'published',
      updatedAt: new Date().toISOString(),
    });
    setRefreshKey((k) => k + 1);
  };

  const deleteShared = async (ownerId: string, lesson: CreatorNetworkingLesson) => {
    const ok = await confirmDialog({
      title: lang === 'ar' ? 'حذف الدرس؟' : 'Delete lesson?',
      message:
        lang === 'ar'
          ? 'سيُحذف هذا الدرس نهائيًا من محتوى مالكه.'
          : "This lesson will be permanently removed from its owner's content.",
      confirmLabel: t('studio.delete'),
    });
    if (!ok) return;
    await deleteSharedItem(ownerId, 'networking-lessons', lesson.id);
    setRefreshKey((k) => k + 1);
  };

  // A built-in is "overridden" once a published lesson shares its id (this
  // admin's own, or another author's). Hide it so it isn't listed twice.
  const overriddenIds = new Set<string>([
    ...creatorLessons.map((l) => l.id),
    ...allPublished.map((l) => l.id),
  ]);
  const visibleStatic = networkingLessons.filter((l) => !overriddenIds.has(l.id));

  /** Open a published lesson: mine goes through the normal own-bucket editor
   * (local-first, so the cache stays in step); anyone else's goes through the
   * server-side admin edit. */
  const editPublished = (lesson: AdminPublishedNetworkingLesson) => {
    if (isMine(lesson)) navigate(`/creators/networking/edit/${lesson.id}`);
    else openAdminEdit(navigate, lesson);
  };

  /** Admin edits a built-in lesson. If an override already exists, edit that;
   * otherwise open the static lesson in copy-on-write mode. */
  const editBuiltin = (id: string) => {
    if (creatorLessons.some((l) => l.id === id)) {
      navigate(`/creators/networking/edit/${id}`);
      return;
    }
    const override = allPublished.find((l) => l.id === id);
    if (override) {
      editPublished(override);
      return;
    }
    navigate(`/creators/networking/edit/${id}?builtin=1`);
  };

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
      {/* New lesson + share this tab (both permission-gated) */}
      {canCreate && (
        <div className="flex justify-end gap-2">
          <ShareTab
            bucket="networking-lessons"
            label={BUCKET_LABEL['networking-lessons'][lang]}
            onChange={() => setRefreshKey((k) => k + 1)}
          />
          <Button
            size="sm"
            leftIcon={<Plus size={14} />}
            onClick={() => navigate('/creators/networking/new')}
          >
            {t('studio.newLesson')}
          </Button>
        </div>
      )}

      {/* Built-in lessons */}
      {visibleStatic.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-[#6e7a94] uppercase tracking-wider">
            {t('studio.builtInLessons')}
          </h2>
          {isAdmin && (
            <p className="text-xs text-[#6e7a94] -mt-1">
              {lang === 'ar'
                ? 'كمشرف، يمكنك تعديل الدروس المدمجة. أول حفظ ينشئ نسخة قابلة للتعديل تحل محل الأصل.'
                : 'As an admin you can edit built-in lessons. The first save creates an editable copy that replaces the original.'}
            </p>
          )}
          {visibleStatic.map((lesson) => (
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
                  {isAdmin && (
                    <button
                      onClick={() => editBuiltin(lesson.id)}
                      title={lang === 'ar' ? 'تعديل (مشرف)' : 'Edit as admin'}
                      className="w-7 h-7 touch:w-11 touch:h-11 flex items-center justify-center rounded-md text-[#6e7a94] hover:text-[#9fef00] hover:bg-[#9fef00]/10 transition-all"
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
            {canCreate && (
              <Button
                size="sm"
                leftIcon={<Plus size={14} />}
                onClick={() => navigate('/creators/networking/new')}
              >
                {t('studio.createLesson')}
              </Button>
            )}
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
                    className="w-7 h-7 touch:w-11 touch:h-11 flex items-center justify-center rounded-md text-[#6e7a94] hover:text-[#00a859] hover:bg-[#00a859]/10 transition-all"
                    title={statusOf(lesson) === 'published' ? t('studio.unpublish') : t('studio.publish')}
                  >
                    {statusOf(lesson) === 'published' ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>

                  <button
                    onClick={() => navigate(`/creators/networking/edit/${lesson.id}`)}
                    className="w-7 h-7 touch:w-11 touch:h-11 flex items-center justify-center rounded-md text-[#6e7a94] hover:text-[#60a5fa] hover:bg-[#60a5fa]/10 transition-all"
                    title={t('studio.edit')}
                  >
                    <Edit3 size={13} />
                  </button>

                  <button
                    onClick={() => handleDelete(lesson.id)}
                    className="w-7 h-7 touch:w-11 touch:h-11 flex items-center justify-center rounded-md text-[#6e7a94] hover:text-red-400 hover:bg-red-500/10 transition-all"
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

      <SharedWithMe
        groups={shared}
        label={BUCKET_LABEL['networking-lessons'][lang]}
        title={(l) => l.title.en || t('studio.untitled')}
        subtitle={(l) => l.description.en || t('studio.noDescription')}
        meta={(l) => (
          <span className="flex items-center gap-1 text-[10px] font-medium text-[#4d5a73]">
            <Clock size={10} /> {l.estimatedMinutes}m
          </span>
        )}
        onEdit={editShared}
        onTogglePublish={toggleSharedPublish}
        onDelete={deleteShared}
        onChange={() => setRefreshKey((k) => k + 1)}
      />

      {/* ── Admin: every published networking lesson (any author, mine too) ── */}
      {isAdmin && allPublished.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-[#f3a43a]" />
            <h2 className="text-sm font-bold text-[#6e7a94] uppercase tracking-wider">
              {lang === 'ar' ? 'كل دروس الشبكات المنشورة' : 'All published networking lessons'} (
              {allPublished.length})
            </h2>
          </div>
          <p className="text-xs text-[#6e7a94] -mt-1">
            {lang === 'ar'
              ? 'كل ما هو منشور على المنصة، بما في ذلك دروسك. يمكنك تعديل أي منها وتبقى ملكية المؤلف كما هي.'
              : "Everything live on the platform, your own lessons included. You can edit any of them; the original author is kept."}
          </p>

          {allPublished.map((lesson) => (
            <EnhancedCard
              key={`${lesson._ownerId}-${lesson.id}`}
              padding="none"
              hoverable
              className="overflow-hidden group"
            >
              <div className="flex items-center gap-4 px-5 py-4">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isMine(lesson)
                      ? 'bg-[#00a859]/10 border border-[#00a859]/20'
                      : 'bg-[#f3a43a]/10 border border-[#f3a43a]/20'
                  }`}
                >
                  <Eye size={16} className={isMine(lesson) ? 'text-[#00a859]' : 'text-[#f3a43a]'} />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-[#f3f6ff] truncate">
                    {lesson.title.en || t('studio.untitled')}
                  </h3>
                  <p className="text-xs text-[#6e7a94] truncate mt-0.5">
                    {lesson.description.en || t('studio.noDescription')}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0" dir="ltr">
                  <span className="hidden md:flex text-[10px] font-medium text-[#4d5a73] items-center gap-1">
                    <User size={10} />{' '}
                    {ownerLabel(lesson._ownerId, lesson._ownerName, user?._id, lang)}
                  </span>
                  <span className="text-[10px] font-medium text-[#4d5a73] flex items-center gap-1">
                    <Clock size={10} /> {lesson.estimatedMinutes}m
                  </span>
                  <StatusBadge status={statusOf(lesson)} />

                  <button
                    onClick={() => editPublished(lesson)}
                    title={
                      isMine(lesson)
                        ? t('studio.edit')
                        : lang === 'ar'
                          ? 'تعديل (مشرف)'
                          : 'Edit as admin'
                    }
                    className={`w-7 h-7 touch:w-11 touch:h-11 flex items-center justify-center rounded-md text-[#6e7a94] transition-all ${
                      isMine(lesson)
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

export default NetworkingCreator;
