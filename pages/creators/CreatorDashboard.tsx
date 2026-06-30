import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wifi,
  Code,
  Monitor,
  Plus,
  ChevronDown,
  FileText,
  CheckCircle2,
  Clock4,
  FileEdit,
  Layers,
  Search,
  ArrowUpRight,
  Sparkles,
  PenTool,
  Route,
  Box,
} from 'lucide-react';
import EnhancedCard from '../../components/ui/EnhancedCard';
import StatusBadge from '../../components/creators/StatusBadge';
import { useAuth } from '../../contexts/AuthContext';
import { useLang } from '../../contexts/LangContext';
import {
  getStudioStats,
  getAllCreatorContent,
} from '../../services/creatorDataService';
import type { ContentStatus, StudioContentItem } from '../../services/creatorTypes';

type Lang = 'en' | 'ar';

/* ── Relative time ── */
function timeAgo(iso: string, lang: Lang): string {
  if (!iso) return '—';
  const ar = lang === 'ar';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return ar ? 'الآن' : 'just now';
  if (mins < 60) return ar ? `منذ ${mins} د` : `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return ar ? `منذ ${hrs} س` : `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return ar ? `منذ ${days} ي` : `${days}d ago`;
  return new Date(iso).toLocaleDateString(ar ? 'ar' : 'en-US');
}

type FilterKey = 'all' | ContentStatus;

const CreatorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, lang } = useLang();

  const stats = useMemo(() => getStudioStats(), []);
  const allContent = useMemo(() => getAllCreatorContent(), []);

  const [filter, setFilter] = useState<FilterKey>('all');
  const [query, setQuery] = useState('');
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const createMenuRef = useRef<HTMLDivElement>(null);

  // Close the create menu on outside click / Escape.
  useEffect(() => {
    if (!createMenuOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (createMenuRef.current && !createMenuRef.current.contains(e.target as Node)) {
        setCreateMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCreateMenuOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [createMenuOpen]);

  const filtered = useMemo(() => {
    return allContent
      .filter((c) => (filter === 'all' ? true : c.status === filter))
      .filter((c) =>
        query.trim() === ''
          ? true
          : `${c.title} ${c.subtitle ?? ''} ${c.kindLabel}`
              .toLowerCase()
              .includes(query.toLowerCase())
      )
      .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
  }, [allContent, filter, query]);

  const creatorName = user?.displayName || 'Creator';
  const roleLabel = user?.role === 'admin' ? t('studio.adminRole') : t('studio.creatorRole');

  /* ── Pipeline tiles ── */
  const pipeline: {
    key: FilterKey;
    label: string;
    value: number;
    icon: React.ElementType;
    color: string;
  }[] = [
    { key: 'all', label: t('studio.total'), value: stats.total, icon: Layers, color: '#9fef00' },
    { key: 'published', label: t('studio.published'), value: stats.byStatus.published, icon: CheckCircle2, color: '#00a859' },
    { key: 'in_review', label: t('studio.inReview'), value: stats.byStatus.in_review, icon: Clock4, color: '#f3a43a' },
    { key: 'draft', label: t('studio.drafts'), value: stats.byStatus.draft, icon: FileEdit, color: '#6e7a94' },
  ];

  /* ── Content type create cards ── */
  const contentTypes = [
    {
      icon: Wifi,
      title: lang === 'ar' ? 'درس شبكات' : 'Networking Lesson',
      description:
        lang === 'ar'
          ? 'شرح بصيغة ماركداون مقترن بمحاكاة تفاعلية لتدفق الحزم.'
          : 'Markdown explainer paired with an interactive packet-flow simulation.',
      color: '#60a5fa',
      manageRoute: '/creators/networking',
      newRoute: '/creators/networking/new',
      count: stats.byKind.networking,
    },
    {
      icon: Code,
      title: lang === 'ar' ? 'محتوى برمجي' : 'Programming Content',
      description:
        lang === 'ar'
          ? 'دروس وتحديات برمجية مُقيّمة مع بيئة بايثون حية.'
          : 'Lessons and graded coding challenges with a live Python environment.',
      color: '#9fef00',
      manageRoute: '/creators/programming',
      newRoute: '/creators/programming',
      count: stats.byKind.programming,
    },
    {
      icon: Box,
      title: lang === 'ar' ? 'وحدة' : 'Module',
      description:
        lang === 'ar'
          ? 'وحدة مستقلة مقسّمة إلى أقسام لمركز الوحدات — ماركداون مقسّم إلى فصول.'
          : 'A standalone, section-divided module for the Modules hub — markdown split into chapters.',
      color: '#34d399',
      manageRoute: '/creators/modules',
      newRoute: '/creators/modules/new',
      count: stats.byKind.modules,
    },
    {
      icon: Monitor,
      title: lang === 'ar' ? 'وحدة نظام تشغيل' : 'OS Module',
      description:
        lang === 'ar'
          ? 'وحدة مقسّمة إلى أقسام تظهر في أساسيات أنظمة التشغيل (واختياريًا مركز الوحدات).'
          : 'Section-divided module that surfaces in OS Fundamentals (and optionally the Modules hub).',
      color: '#f3a43a',
      manageRoute: '/creators/os-modules',
      newRoute: '/creators/os-modules/new',
      count: stats.byKind.os,
    },
    {
      icon: Route,
      title: lang === 'ar' ? 'مسار تعليمي' : 'Learning Path',
      description:
        lang === 'ar'
          ? 'رتّب الوحدات والدروس في منهج موجّه يركّز على المسار المهني.'
          : 'Sequence modules and lessons into a guided, career-focused curriculum.',
      color: '#a78bfa',
      manageRoute: '/creators/paths',
      newRoute: '/creators/paths/new',
      count: stats.byKind.paths,
    },
  ];

  const TYPE_ICON: Record<StudioContentItem['kind'], React.ElementType> = {
    networking: Wifi,
    'programming-concept': Code,
    'programming-module': Code,
    'os-module': Monitor,
    module: Box,
    path: Route,
  };

  return (
    <div className="space-y-8">
      {/* ─── Identity header ─── */}
      <EnhancedCard padding="none" glowColor="green" className="relative">
        <div className="relative px-6 py-6 sm:px-8 sm:py-7">
          {/* Decorative gradient (clipped to the card's rounded top corners) */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-t-2xl">
            <div
              className="absolute inset-0 opacity-[0.07]"
              style={{
                background:
                  'radial-gradient(600px circle at 12% -20%, #00a859, transparent 45%), radial-gradient(500px circle at 90% 120%, #9fef00, transparent 40%)',
              }}
            />
          </div>
          <div className="relative flex flex-col sm:flex-row sm:items-center gap-5 justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#0e1522] border border-[#263248] flex items-center justify-center flex-shrink-0">
                <span className="text-2xl font-black text-[#9fef00]">
                  {creatorName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#00a859]/10 border border-[#00a859]/25 text-[#00a859]">
                    <PenTool size={10} /> {roleLabel}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-[#f3f6ff] leading-tight">
                  {t('studio.contentStudio')}
                </h1>
                <p className="text-sm text-[#9aa5bf] mt-0.5">
                  {t('studio.welcomeBack')}, {creatorName} — {t('studio.welcomeLine')}
                </p>
              </div>
            </div>

            <div className="relative flex-shrink-0" ref={createMenuRef}>
              <button
                onClick={() => setCreateMenuOpen((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={createMenuOpen}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-[#0d1117] bg-[#00a859] hover:bg-[#00934e] transition-colors"
              >
                <Plus size={16} /> {t('studio.createContent')}
                <ChevronDown
                  size={15}
                  className={`transition-transform ${createMenuOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {createMenuOpen && (
                <div
                  role="menu"
                  className="absolute end-0 z-30 mt-2 w-72 rounded-xl border border-[#263248] bg-[#0e1522] p-1.5 shadow-xl shadow-black/50"
                >
                  {contentTypes.map((type) => (
                    <button
                      key={type.title}
                      role="menuitem"
                      onClick={() => {
                        setCreateMenuOpen(false);
                        navigate(type.newRoute);
                      }}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-start transition-colors hover:bg-[#172033]"
                    >
                      <span
                        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
                        style={{ backgroundColor: `${type.color}15`, border: `1px solid ${type.color}30` }}
                      >
                        <type.icon size={15} style={{ color: type.color }} />
                      </span>
                      <span className="text-sm font-semibold text-[#e5e9f0]">{type.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pipeline tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 border-t border-[#263248] divide-x divide-[#263248] overflow-hidden rounded-b-2xl">
          {pipeline.map((tile) => {
            const active = filter === tile.key;
            return (
              <button
                key={tile.label}
                onClick={() => setFilter(tile.key)}
                className={`relative flex items-center gap-3 px-5 py-4 text-left transition-colors ${
                  active ? 'bg-[#121a2a]' : 'hover:bg-[#101826]'
                }`}
              >
                {active && <span className="absolute top-0 left-0 w-full h-0.5" style={{ backgroundColor: tile.color }} />}
                <span
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${tile.color}15`, border: `1px solid ${tile.color}30` }}
                >
                  <tile.icon size={16} style={{ color: tile.color }} />
                </span>
                <span>
                  <span className="block text-xl font-black text-[#f3f6ff] leading-none" dir="ltr">
                    {tile.value}
                  </span>
                  <span className="block text-[11px] text-[#6e7a94] mt-1">{tile.label}</span>
                </span>
              </button>
            );
          })}
        </div>
      </EnhancedCard>

      {/* ─── Create new ─── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={15} className="text-[#9fef00]" />
          <h2 className="text-sm font-bold text-[#d2d7e3] uppercase tracking-wider">{t('studio.createNew')}</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {contentTypes.map((type) => (
            <EnhancedCard
              key={type.title}
              padding="lg"
              hoverable
              onClick={() => navigate(type.manageRoute)}
              className="group relative overflow-hidden"
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${type.color}15`, border: `1px solid ${type.color}30` }}
                >
                  <type.icon size={24} style={{ color: type.color }} />
                </div>
                <span className="text-[11px] font-semibold text-[#6e7a94]">
                  {type.count} {type.count === 1 ? t('studio.item') : t('studio.items')}
                </span>
              </div>
              <h3 className="text-base font-bold text-[#f3f6ff] mb-1.5">{type.title}</h3>
              <p className="text-xs text-[#9aa5bf] leading-relaxed mb-5">{type.description}</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(type.newRoute);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#00a859] hover:text-[#00c267] transition-colors"
                >
                  <Plus size={13} /> {t('studio.new')}
                </button>
                <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-medium text-[#6e7a94] group-hover:text-[#d2d7e3] transition-colors">
                  {t('studio.manage')} <ArrowUpRight size={12} />
                </span>
              </div>
            </EnhancedCard>
          ))}
        </div>
      </div>

      {/* ─── Your Content ─── */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <FileText size={15} className="text-[#60a5fa]" />
            <h2 className="text-sm font-bold text-[#d2d7e3] uppercase tracking-wider">{t('studio.yourContent')}</h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter tabs */}
            <div className="flex items-center bg-[#0b1019] border border-[#263248] rounded-lg p-0.5" dir="ltr">
              {(['all', 'published', 'in_review', 'draft'] as FilterKey[]).map((f) => {
                const labels: Record<FilterKey, string> = {
                  all: t('studio.all'),
                  published: t('studio.published'),
                  in_review: t('studio.review'),
                  draft: t('studio.drafts'),
                };
                return (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-2.5 py-1.5 rounded-md text-[11px] font-semibold transition-colors ${
                      filter === f ? 'bg-[#1a2332] text-[#f3f6ff]' : 'text-[#6e7a94] hover:text-[#d2d7e3]'
                    }`}
                  >
                    {labels[f]}
                  </button>
                );
              })}
            </div>

            {/* Search */}
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#4d5a73]" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('studio.search')}
                className="w-40 bg-[#0b1019] border border-[#263248] rounded-lg pl-8 pr-3 py-2 text-xs text-[#d2d7e3] focus:outline-none focus:border-[#00a859]/50 transition-colors placeholder:text-[#3d4a63]"
                dir="ltr"
              />
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EnhancedCard padding="xl" className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#121a2a] border border-[#263248] flex items-center justify-center mx-auto mb-4">
              <PenTool size={24} className="text-[#6e7a94]" />
            </div>
            <h3 className="text-base font-bold text-[#f3f6ff] mb-1.5">
              {allContent.length === 0 ? t('studio.startCreating') : t('studio.nothingMatches')}
            </h3>
            <p className="text-sm text-[#6e7a94] max-w-sm mx-auto mb-5">
              {allContent.length === 0 ? t('studio.emptyHint') : t('studio.tryDifferent')}
            </p>
            {allContent.length === 0 && (
              <button
                onClick={() => navigate('/creators/networking/new')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-[#0d1117] bg-[#00a859] hover:bg-[#00934e] transition-colors"
              >
                <Plus size={15} /> {t('studio.createFirstLesson')}
              </button>
            )}
          </EnhancedCard>
        ) : (
          <EnhancedCard padding="none" className="overflow-hidden">
            <div className="divide-y divide-[#263248]/60">
              {filtered.map((item) => {
                const TypeIcon = TYPE_ICON[item.kind];
                return (
                  <button
                    key={`${item.kind}-${item.id}`}
                    onClick={() => navigate(item.editPath)}
                    className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-[#121a2a]/60 transition-colors text-left group"
                  >
                    <span
                      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${item.accent}12`, border: `1px solid ${item.accent}26` }}
                    >
                      <TypeIcon size={15} style={{ color: item.accent }} />
                    </span>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#f3f6ff] truncate group-hover:text-[#00a859] transition-colors">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-[#6e7a94] truncate" dir="ltr">
                        {item.kindLabel}
                        {item.subtitle ? ` · ${item.subtitle}` : ''}
                      </p>
                    </div>

                    <span className="hidden md:block text-[11px] text-[#6e7a94] flex-shrink-0">
                      {item.author}
                    </span>
                    <span className="hidden sm:block text-[11px] text-[#4d5a73] flex-shrink-0 w-16 text-right" dir="ltr">
                      {timeAgo(item.updatedAt, lang)}
                    </span>
                    <StatusBadge status={item.status} />
                  </button>
                );
              })}
            </div>
          </EnhancedCard>
        )}
      </div>
    </div>
  );
};

export default CreatorDashboard;
