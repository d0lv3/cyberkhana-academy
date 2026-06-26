import React, { useMemo, useState } from 'react';
import { Layers, Search, SearchX } from 'lucide-react';
import EmptyState from '../../components/ui/EmptyState';
import PageHeader from '../../components/ui/PageHeader';
import ModuleCard from '../../components/fundamentals/ModuleCard';
import { useLang } from '../../contexts/LangContext';
import { getAllModules, } from '../../data/modulesData';
import {
  MODULE_DOMAINS,
  MODULE_DOMAIN_META,
  moduleDomain,
  type FundamentalModule,
  type ModuleDomain,
} from '../../data/fundamentalsData';
import type { Difficulty } from '../../types';

const selectCls =
  'bg-[#121a2a] border border-[#263248] rounded-lg px-3 py-2.5 text-xs font-semibold text-[#d2d7e3] focus:outline-none focus:border-[#00a859]/50 transition-colors cursor-pointer';

const DIFFICULTIES: Difficulty[] = ['Beginner', 'Easy', 'Medium', 'Hard', 'Expert'];
const CONTENT_TYPES: FundamentalModule['contentType'][] = ['video', 'text', 'mixed'];

const CONTENT_TYPE_LABELS: Record<FundamentalModule['contentType'], { en: string; ar: string }> = {
  video: { en: 'Video', ar: 'فيديو' },
  text: { en: 'Text', ar: 'نصي' },
  mixed: { en: 'Mixed', ar: 'مختلط' },
};

const ModulesPage: React.FC = () => {
  const { lang, t } = useLang();
  const modules = useMemo(() => getAllModules(), []);

  const [query, setQuery] = useState('');
  const [domain, setDomain] = useState<'all' | ModuleDomain>('all');
  const [difficulty, setDifficulty] = useState<'all' | Difficulty>('all');
  const [contentType, setContentType] = useState<'all' | FundamentalModule['contentType']>('all');

  const hasActiveFilters =
    query.trim() !== '' || domain !== 'all' || difficulty !== 'all' || contentType !== 'all';

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return modules.filter((mod) => {
      if (domain !== 'all' && moduleDomain(mod) !== domain) return false;
      if (difficulty !== 'all' && mod.difficulty !== difficulty) return false;
      if (contentType !== 'all' && mod.contentType !== contentType) return false;
      if (q) {
        const haystack = [
          mod.title.en,
          mod.title.ar,
          mod.description.en,
          mod.description.ar,
          mod.author,
          ...mod.tags,
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [modules, query, domain, difficulty, contentType]);

  const clearFilters = () => {
    setQuery('');
    setDomain('all');
    setDifficulty('all');
    setContentType('all');
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t('sidebar.modules')} subtitle={t('features.modules.desc')} />

      {modules.length === 0 ? (
        <EmptyState
          icon={Layers}
          title={t('common.comingSoon')}
          description={t('common.comingSoonDesc')}
        />
      ) : (
        <>
          {/* ── Search + filters ── */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search
                size={15}
                className="absolute start-3.5 top-1/2 -translate-y-1/2 text-[#4d5a73] pointer-events-none"
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  lang === 'ar' ? 'ابحث في الوحدات، الوسوم...' : 'Search modules, tags...'
                }
                className="w-full bg-[#121a2a] border border-[#263248] rounded-lg ps-10 pe-4 py-2.5 text-sm text-[#d2d7e3] focus:outline-none focus:border-[#00a859]/50 transition-colors placeholder:text-[#3d4a63]"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={domain}
                onChange={(e) => setDomain(e.target.value as typeof domain)}
                className={selectCls}
              >
                <option value="all">{lang === 'ar' ? 'كل الفئات' : 'All categories'}</option>
                {MODULE_DOMAINS.map((d) => (
                  <option key={d} value={d}>
                    {MODULE_DOMAIN_META[d].label[lang]}
                  </option>
                ))}
              </select>

              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as typeof difficulty)}
                className={selectCls}
              >
                <option value="all">{lang === 'ar' ? 'كل المستويات' : 'All levels'}</option>
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>

              <select
                value={contentType}
                onChange={(e) => setContentType(e.target.value as typeof contentType)}
                className={selectCls}
              >
                <option value="all">{lang === 'ar' ? 'كل الأنواع' : 'All types'}</option>
                {CONTENT_TYPES.map((c) => (
                  <option key={c} value={c}>
                    {CONTENT_TYPE_LABELS[c][lang]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* result count */}
          <p className="text-xs text-[#6e7a94]" dir="ltr">
            {filtered.length} / {modules.length}{' '}
            {lang === 'ar' ? 'وحدة' : filtered.length === 1 ? 'module' : 'modules'}
          </p>

          {/* ── Results ── */}
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-14 h-14 rounded-2xl bg-[#121a2a] border border-[#263248] flex items-center justify-center mx-auto mb-4">
                <SearchX size={24} className="text-[#6e7a94]" />
              </div>
              <h3 className="text-base font-bold text-[#f3f6ff] mb-1.5">
                {lang === 'ar' ? 'لا توجد نتائج' : 'No modules match'}
              </h3>
              <p className="text-sm text-[#6e7a94] mb-5">
                {lang === 'ar'
                  ? 'جرّب كلمة بحث أو فلاتر مختلفة.'
                  : 'Try a different search term or filters.'}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm font-semibold text-[#00a859] hover:text-[#9fef00] transition-colors"
                >
                  {lang === 'ar' ? 'مسح الفلاتر' : 'Clear filters'}
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              {filtered.map((mod, i) => (
                <ModuleCard key={mod.id} module={mod} index={i} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ModulesPage;
