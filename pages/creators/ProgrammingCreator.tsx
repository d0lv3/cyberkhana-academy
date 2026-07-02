import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit3, Trash2, BookOpen, Trophy, ChevronDown, ChevronRight, Eye, EyeOff, Image, Lock } from 'lucide-react';
import EnhancedCard from '../../components/ui/EnhancedCard';
import Button from '../../components/ui/EnhancedButton';
import CreatorLayout from '../../components/creators/CreatorLayout';
import StatusBadge from '../../components/creators/StatusBadge';
import CoverImageUploader from '../../components/creators/CoverImageUploader';
import { confirmDialog } from '../../components/ui/ConfirmHost';
import { useLang } from '../../contexts/LangContext';
import { useAuth } from '../../contexts/AuthContext';
import { hasPerm } from '../../services/permissions';
import { getProgrammingLanguages } from '../../data/programming';
import {
  getCreatorProgrammingPatches,
  getCreatorLanguages,
  deleteProgrammingLanguage,
  deleteProgrammingConcept,
  deleteProgrammingModule,
  saveProgrammingModule,
  saveProgrammingLanguage,
  saveProgrammingLanguageCoverSvg,
} from '../../services/creatorDataService';
import { statusOf, type CreatorMeta } from '../../services/creatorTypes';
import type { ProgrammingLanguage, ProgrammingModule } from '../../data/programming/types';

type DisplayModule = ProgrammingModule & Partial<CreatorMeta>;

/** Short glyph drawn on the language card art. Matches LanguageCard. */
const glyphFor = (l: Pick<ProgrammingLanguage, 'slug' | 'name'>): string =>
  l.slug === 'python' ? 'Py' : l.slug === 'c' ? 'C' : l.slug === 'bash' ? '$_' : l.name.slice(0, 2);

const ProgrammingCreator: React.FC = () => {
  const navigate = useNavigate();
  const { t, lang: uiLang } = useLang();
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [coverOpen, setCoverOpen] = useState<Record<string, boolean>>({});

  // Capability gates — the admin grants these per creator.
  const canProgramming = hasPerm(user, 'programming');
  const canLanguages = hasPerm(user, 'programming-languages');

  const patches = getCreatorProgrammingPatches();

  // Catalog languages (static + published creator languages) + my own DRAFT
  // languages, which the public merge hides until published.
  const publishedLanguages = getProgrammingLanguages();
  const listedSlugs = new Set(publishedLanguages.map((l) => l.slug));
  const draftLanguages: ProgrammingLanguage[] = getCreatorLanguages()
    .filter((d) => !listedSlugs.has(d.slug))
    .map((d) => ({
      id: d.slug,
      slug: d.slug,
      name: d.name,
      color: d.color || '#9fef00',
      available: true,
      description: d.description ?? { en: '', ar: '' },
      coverSvg: patches.find((p) => p.languageSlug === d.slug)?.languageCoverSvg,
      modules: [],
    }));
  const languages = [...publishedLanguages, ...draftLanguages];

  /** My own definition for this language, when I created it. */
  const ownLanguageDef = (slug: string) => patches.find((p) => p.languageSlug === slug)?.newLanguage;

  const handleToggleLanguagePublish = (slug: string) => {
    const def = ownLanguageDef(slug);
    if (!def) return;
    const next = statusOf(def) === 'published' ? 'draft' : 'published';
    saveProgrammingLanguage({ ...def, status: next, isPublished: next === 'published' });
    setRefreshKey((k) => k + 1);
  };

  const handleDeleteLanguage = async (slug: string, name: string) => {
    if (
      await confirmDialog({
        title: uiLang === 'ar' ? `حذف لغة ${name}؟` : `Delete ${name}?`,
        message:
          uiLang === 'ar'
            ? 'ستُحذف هذه اللغة وكل وحداتها ودروسها نهائيًا.'
            : 'This language and ALL of its modules and lessons will be permanently removed.',
        confirmLabel: t('studio.delete'),
      })
    ) {
      deleteProgrammingLanguage(slug);
      setRefreshKey((k) => k + 1);
    }
  };

  const toggleExpand = (key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleDeleteConcept = async (langSlug: string, modSlug: string, conceptId: string) => {
    if (
      await confirmDialog({
        title: uiLang === 'ar' ? 'حذف المفهوم؟' : 'Delete concept?',
        message:
          uiLang === 'ar'
            ? 'سيُحذف هذا الدرس/التحدي نهائيًا.'
            : 'This lesson/challenge will be permanently removed.',
        confirmLabel: t('studio.delete'),
      })
    ) {
      deleteProgrammingConcept(langSlug, modSlug, conceptId);
      setRefreshKey((k) => k + 1);
    }
  };

  const handleDeleteModule = async (langSlug: string, moduleId: string) => {
    if (
      await confirmDialog({
        title: uiLang === 'ar' ? 'حذف الوحدة؟' : 'Delete module?',
        message:
          uiLang === 'ar'
            ? 'ستُحذف هذه الوحدة وكل مفاهيمها نهائيًا.'
            : 'This module and all of its concepts will be permanently removed.',
        confirmLabel: t('studio.delete'),
      })
    ) {
      deleteProgrammingModule(langSlug, moduleId);
      setRefreshKey((k) => k + 1);
    }
  };

  // Get creator concepts for a given lang+module
  const getCreatorConcepts = (langSlug: string, moduleSlug: string) => {
    const patch = patches.find((p) => p.languageSlug === langSlug);
    return patch?.newConcepts[moduleSlug] || [];
  };

  // Check if a module is creator-made
  const isCreatorModule = (langSlug: string, moduleId: string) => {
    const patch = patches.find((p) => p.languageSlug === langSlug);
    return patch?.newModules.some((m) => m.id === moduleId) || false;
  };

  // Modules to display in the studio: merged (published) + the creator's own
  // drafts (which the consumer merge hides until published).
  const getDisplayModules = (langSlug: string, mergedModules: ProgrammingModule[]): DisplayModule[] => {
    const patch = patches.find((p) => p.languageSlug === langSlug);
    const existingIds = new Set(mergedModules.map((m) => m.id));
    const drafts = (patch?.newModules ?? []).filter((m) => !existingIds.has(m.id));
    return [...mergedModules, ...drafts].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  };

  const handleToggleModulePublish = (langSlug: string, mod: any) => {
    const next = statusOf(mod) === 'published' ? 'draft' : 'published';
    saveProgrammingModule(langSlug, { ...mod, status: next, isPublished: next === 'published' });
    setRefreshKey((k) => k + 1);
  };

  const handleSaveCover = (langSlug: string, svg: string) => {
    saveProgrammingLanguageCoverSvg(langSlug, svg);
    setRefreshKey((k) => k + 1);
  };

  return (
    <CreatorLayout
      title={uiLang === 'ar' ? 'محتوى برمجي' : 'Programming Content'}
      backTo="/creators"
      backLabel={t('studio.contentStudio')}
    >
      <div className="space-y-6">
        {canLanguages && (
          <div className="flex justify-between items-start gap-4">
            <p className="text-sm text-[#9aa5bf] max-w-lg">
              {uiLang === 'ar'
                ? 'يمكنك إنشاء لغات برمجة جديدة في الكتالوج، ثم إضافة الوحدات والدروس إليها.'
                : 'You can create new programming languages in the catalog, then fill them with modules and lessons.'}
            </p>
            <Button
              size="sm"
              leftIcon={<Plus size={14} />}
              onClick={() => navigate('/creators/programming/new-language')}
            >
              {uiLang === 'ar' ? 'لغة جديدة' : 'New Language'}
            </Button>
          </div>
        )}

        {languages.map((lang) => (
          <EnhancedCard key={lang.id} padding="none" className="overflow-hidden">
            {/* Language header */}
            <div className="h-1" style={{ backgroundColor: lang.color }} />
            <div className="px-5 py-4 border-b border-[#263248]">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-black"
                    style={{
                      backgroundColor: `${lang.color}15`,
                      border: `1px solid ${lang.color}30`,
                      color: lang.color,
                    }}
                  >
                    {glyphFor(lang)}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#f3f6ff] flex items-center gap-2">
                      {lang.name}
                      {!lang.available && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#6e7a94]">
                          <Lock size={10} /> {uiLang === 'ar' ? 'قريباً' : 'Coming Soon'}
                        </span>
                      )}
                    </h2>
                    <p className="text-xs text-[#6e7a94]">
                      {lang.available
                        ? `${getDisplayModules(lang.slug, lang.modules).length} ${t('studio.modulesLabel')}`
                        : uiLang === 'ar'
                          ? 'الغلاف قابل للتعديل'
                          : 'Cover art editable'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Own creator language: lifecycle + edit + delete */}
                  {(() => {
                    const def = ownLanguageDef(lang.slug);
                    if (!def || !canLanguages) return null;
                    return (
                      <div className="flex items-center gap-1.5" dir="ltr">
                        <StatusBadge status={statusOf(def)} />
                        <button
                          onClick={() => handleToggleLanguagePublish(lang.slug)}
                          title={statusOf(def) === 'published' ? t('studio.unpublish') : t('studio.publish')}
                          className="w-7 h-7 flex items-center justify-center rounded-md text-[#6e7a94] hover:text-[#00a859] hover:bg-[#00a859]/10 transition-all"
                        >
                          {statusOf(def) === 'published' ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                        <button
                          onClick={() => navigate(`/creators/programming/edit-language/${lang.slug}`)}
                          title={uiLang === 'ar' ? 'تعديل اللغة' : 'Edit language'}
                          className="w-7 h-7 flex items-center justify-center rounded-md text-[#6e7a94] hover:text-[#60a5fa] hover:bg-[#60a5fa]/10 transition-all"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteLanguage(lang.slug, lang.name)}
                          title={uiLang === 'ar' ? 'حذف اللغة' : 'Delete language'}
                          className="w-7 h-7 flex items-center justify-center rounded-md text-[#6e7a94] hover:text-red-400 hover:bg-red-500/10 transition-all"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    );
                  })()}
                  {(canProgramming || canLanguages) && (
                    <Button
                      size="sm"
                      variant="ghost"
                      leftIcon={<Image size={12} />}
                      onClick={() => setCoverOpen((p) => ({ ...p, [lang.slug]: !p[lang.slug] }))}
                    >
                      {uiLang === 'ar' ? 'الغلاف' : 'Cover'}
                    </Button>
                  )}
                  {lang.available && canProgramming && (
                    <Button
                      size="sm"
                      variant="secondary"
                      leftIcon={<Plus size={12} />}
                      onClick={() => navigate(`/creators/programming/new-module/${lang.slug}`)}
                    >
                      {t('studio.addModule')}
                    </Button>
                  )}
                </div>
              </div>

              {/* Cover-art editor */}
              {(coverOpen[lang.slug] ?? false) && (
                <div className="mt-4 pt-4 border-t border-[#263248]">
                  <CoverImageUploader
                    value={lang.coverSvg ?? ''}
                    onChange={(cover) => handleSaveCover(lang.slug, cover)}
                    accent={lang.color}
                    label={uiLang === 'ar' ? 'غلاف اللغة' : 'Language Cover'}
                    shownOn={uiLang === 'ar' ? 'بطاقة اللغة' : 'the language card'}
                  />
                </div>
              )}
            </div>

            {/* Modules — available languages only */}
            {lang.available && (
            <div className="divide-y divide-[#263248]/50">
              {getDisplayModules(lang.slug, lang.modules).map((mod) => {
                const key = `${lang.slug}-${mod.slug}`;
                const isExpanded = expanded[key] ?? false;
                const creatorConcepts = getCreatorConcepts(lang.slug, mod.slug);
                const isCreatorMod = isCreatorModule(lang.slug, mod.id);

                return (
                  <div key={mod.id}>
                    {/* Module row */}
                    <button
                      onClick={() => toggleExpand(key)}
                      className="w-full flex items-center gap-3 px-5 py-3 hover:bg-[#182235]/50 transition-colors text-left"
                    >
                      {isExpanded ? (
                        <ChevronDown size={14} className="text-[#6e7a94] flex-shrink-0" />
                      ) : (
                        <ChevronRight size={14} className="text-[#6e7a94] flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-semibold text-[#d2d7e3]">
                          {mod.title.en}
                        </span>
                        <span className="text-xs text-[#4d5a73] ml-2">
                          {mod.concepts.length} {t('studio.conceptsLabel')}
                          {creatorConcepts.length > 0 && (
                            <span className="text-[#00a859]"> + {creatorConcepts.length} {t('studio.customLabel')}</span>
                          )}
                        </span>
                      </div>
                      {isCreatorMod && (
                        <div className="flex items-center gap-1.5 flex-shrink-0" dir="ltr">
                          <StatusBadge status={statusOf(mod)} />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleModulePublish(lang.slug, mod);
                            }}
                            title={statusOf(mod) === 'published' ? t('studio.unpublish') : t('studio.publish')}
                            className="w-6 h-6 flex items-center justify-center rounded text-[#4d5a73] hover:text-[#00a859] transition-colors"
                          >
                            {statusOf(mod) === 'published' ? <EyeOff size={12} /> : <Eye size={12} />}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/creators/programming/edit-module/${lang.slug}/${mod.id}`);
                            }}
                            title={t('studio.editModule')}
                            className="w-6 h-6 flex items-center justify-center rounded text-[#4d5a73] hover:text-[#60a5fa] transition-colors"
                          >
                            <Edit3 size={12} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteModule(lang.slug, mod.id);
                            }}
                            className="w-6 h-6 flex items-center justify-center rounded text-[#4d5a73] hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                    </button>

                    {/* Concepts */}
                    {isExpanded && (
                      <div className="bg-[#0a0f18] border-t border-[#263248]/50">
                        {/* Static concepts */}
                        {mod.concepts.map((concept) => (
                          <div
                            key={concept.id}
                            className="flex items-center gap-3 px-8 py-2.5 border-b border-[#263248]/30"
                          >
                            {concept.type === 'challenge' ? (
                              <Trophy size={12} className="text-[#f3a43a] flex-shrink-0" />
                            ) : (
                              <BookOpen size={12} className="text-[#6e7a94] flex-shrink-0" />
                            )}
                            <span className="text-xs text-[#c4cad6] flex-1 truncate">
                              {concept.title.en}
                            </span>
                            <span className="text-[10px] text-[#4d5a73] flex-shrink-0">
                              {(concept as any).isCreatorContent
                                ? uiLang === 'ar'
                                  ? 'مخصص'
                                  : 'Custom'
                                : t('studio.builtIn')}
                            </span>
                            {(concept as any).isCreatorContent && (
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <button
                                  onClick={() =>
                                    navigate(
                                      `/creators/programming/${lang.slug}/${mod.slug}/${concept.slug}`
                                    )
                                  }
                                  className="w-6 h-6 flex items-center justify-center rounded text-[#4d5a73] hover:text-[#60a5fa] transition-colors"
                                >
                                  <Edit3 size={11} />
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteConcept(lang.slug, mod.slug, concept.id)
                                  }
                                  className="w-6 h-6 flex items-center justify-center rounded text-[#4d5a73] hover:text-red-400 transition-colors"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}

                        {/* Creator concepts not yet in merged list */}
                        {creatorConcepts
                          .filter((cc) => !mod.concepts.some((c) => c.id === cc.id))
                          .map((concept) => (
                            <div
                              key={concept.id}
                              className="flex items-center gap-3 px-8 py-2.5 border-b border-[#263248]/30"
                            >
                              {concept.type === 'challenge' ? (
                                <Trophy size={12} className="text-[#f3a43a] flex-shrink-0" />
                              ) : (
                                <BookOpen size={12} className="text-[#6e7a94] flex-shrink-0" />
                              )}
                              <span className="text-xs text-[#c4cad6] flex-1 truncate">
                                {concept.title.en}
                              </span>
                              <StatusBadge status={statusOf(concept)} />
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <button
                                  onClick={() =>
                                    navigate(
                                      `/creators/programming/${lang.slug}/${mod.slug}/${concept.slug}`
                                    )
                                  }
                                  className="w-6 h-6 flex items-center justify-center rounded text-[#4d5a73] hover:text-[#60a5fa] transition-colors"
                                >
                                  <Edit3 size={11} />
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteConcept(lang.slug, mod.slug, concept.id)
                                  }
                                  className="w-6 h-6 flex items-center justify-center rounded text-[#4d5a73] hover:text-red-400 transition-colors"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            </div>
                          ))}

                        {/* Add concept button */}
                        {canProgramming && (
                          <button
                            onClick={() =>
                              navigate(`/creators/programming/new-concept/${lang.slug}/${mod.slug}`)
                            }
                            className="flex items-center gap-1.5 px-8 py-2.5 text-xs font-medium text-[#6e7a94] hover:text-[#00a859] transition-colors w-full"
                          >
                            <Plus size={12} /> {t('studio.addConcept')}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            )}
          </EnhancedCard>
        ))}
      </div>
    </CreatorLayout>
  );
};

export default ProgrammingCreator;
