import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Target, Globe, ShieldCheck, Lock, Sparkles } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import CardArt from '../../components/fundamentals/CardArt';
import PathCard from '../../components/paths/PathCard';
import { useLang } from '../../contexts/LangContext';
import { getPublishedCreatorPaths } from '../../services/creatorDataService';

const PathsPage: React.FC = () => {
  const { t, lang } = useLang();
  const publishedPaths = getPublishedCreatorPaths();

  const paths = [
    {
      icon: Shield,
      color: '#00a859',
      title: { en: 'SOC Analyst', ar: 'محلل مركز العمليات الأمنية' },
      desc: {
        en: 'Monitoring, log analysis, and incident response — the blue-team starting point.',
        ar: 'المراقبة وتحليل السجلات والاستجابة للحوادث — نقطة انطلاق الفريق الأزرق.',
      },
      modules: 8,
    },
    {
      icon: Target,
      color: '#f87171',
      title: { en: 'Penetration Tester', ar: 'مختبر اختراق' },
      desc: {
        en: 'Offensive security: reconnaissance, exploitation, and reporting.',
        ar: 'الأمن الهجومي: الاستطلاع والاستغلال وإعداد التقارير.',
      },
      modules: 10,
    },
    {
      icon: Globe,
      color: '#60a5fa',
      title: { en: 'Web Application Security', ar: 'أمن تطبيقات الويب' },
      desc: {
        en: 'Find and fix the OWASP Top 10 across real web applications.',
        ar: 'اكتشف وعالج أهم 10 ثغرات OWASP في تطبيقات ويب حقيقية.',
      },
      modules: 7,
    },
    {
      icon: ShieldCheck,
      color: '#a78bfa',
      title: { en: 'Network Defender', ar: 'مدافع الشبكات' },
      desc: {
        en: 'Harden infrastructure, segment networks, and detect intrusions.',
        ar: 'تحصين البنية التحتية وتقسيم الشبكات واكتشاف الاختراقات.',
      },
      modules: 6,
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader title={t('sidebar.paths')} subtitle={t('features.paths.desc')} />

      {/* Published creator paths */}
      {publishedPaths.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {publishedPaths.map((p, i) => (
            <PathCard key={p.id} path={p} index={i} />
          ))}
        </div>
      )}

      {publishedPaths.length === 0 && (
        <>
      {/* Coming soon banner */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-2xl border border-[#263248] bg-[#121a2a] p-5 flex items-center gap-4"
      >
        <div className="absolute -top-16 -right-10 w-56 h-56 bg-[#00a859]/8 rounded-full blur-[80px]" />
        <div className="relative z-10 w-11 h-11 rounded-xl bg-[#00a859]/10 border border-[#00a859]/20 flex items-center justify-center flex-shrink-0">
          <Sparkles size={20} className="text-[#00a859]" />
        </div>
        <div className="relative z-10">
          <p className="text-sm font-bold text-[#f3f6ff]">
            {lang === 'ar' ? 'المسارات قادمة قريبًا' : 'Learning Paths are coming soon'}
          </p>
          <p className="text-xs text-[#9aa5bf] mt-0.5">
            {lang === 'ar'
              ? 'هذه هي المسارات المهنية التي نعمل على بنائها لك.'
              : "Here's a preview of the career tracks we're building for you."}
          </p>
        </div>
      </motion.div>

      {/* Preview path cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {paths.map((path, i) => (
          <motion.div
            key={path.title.en}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.08, duration: 0.4 }}
            className="group relative overflow-hidden rounded-2xl border border-[#263248] bg-[#121a2a]"
          >
            <CardArt kind="path" color={path.color} className="opacity-70" />

            {/* Readability scrims */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#080c14] via-[#080c14]/65 to-transparent" />
            <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-[#080c14]/70 to-transparent" />

            <div className="relative flex min-h-[190px] flex-col p-5">
              {/* Top badges */}
              <div className="flex items-start justify-between gap-2">
                <span
                  className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold backdrop-blur-sm"
                  style={{
                    color: path.color,
                    backgroundColor: `${path.color}1f`,
                    borderColor: `${path.color}55`,
                  }}
                >
                  <path.icon size={12} /> {lang === 'ar' ? 'مسار' : 'Track'}
                </span>
                <span className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-black/55 px-2 py-0.5 text-xs font-semibold text-[#cbd3e1] backdrop-blur-sm">
                  <Lock size={11} /> {lang === 'ar' ? 'قريباً' : 'Soon'}
                </span>
              </div>

              {/* Bottom block */}
              <div className="mt-auto pt-8">
                <h3 className="text-lg font-bold text-[#f3f6ff]">{path.title[lang]}</h3>
                <p className="mt-1.5 line-clamp-2 text-sm text-[#aab3c7]">{path.desc[lang]}</p>
                <div className="mt-4 text-[11px] font-medium text-[#9aa5bf]" dir="ltr">
                  {path.modules} {lang === 'ar' ? 'وحدة' : 'modules'}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
        </>
      )}
    </div>
  );
};

export default PathsPage;
