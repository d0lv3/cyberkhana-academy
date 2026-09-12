import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, GraduationCap, Layers, Route } from 'lucide-react';
import { useLang } from '../../contexts/LangContext';

/* ─── The three stages, in order ───
 *
 * Shown to a learner who has not started, because the Academy's shape is not
 * obvious from a navigation list: Fundamentals teach the ground, Modules go
 * deep on one subject, Paths put modules in the order a job needs them. Said
 * once, here, so the rest of the interface can stop explaining itself.
 */

const STAGES = [
  {
    to: '/fundamentals',
    icon: GraduationCap,
    color: '#00a859',
    title: { en: 'Fundamentals', ar: 'الأساسيات' },
    body: {
      en: 'Programming, networking and operating systems. The ground everything else stands on.',
      ar: 'البرمجة والشبكات وأنظمة التشغيل. الأرض التي يقوم عليها كل ما بعدها.',
    },
  },
  {
    to: '/modules',
    icon: Layers,
    color: '#60a5fa',
    title: { en: 'Modules', ar: 'الوحدات' },
    body: {
      en: 'One security subject at a time, with its lessons, its quizzes and its lab.',
      ar: 'موضوع أمني واحد في كل مرة، بدروسه واختباراته ومختبره.',
    },
  },
  {
    to: '/paths',
    icon: Route,
    color: '#a78bfa',
    title: { en: 'Career paths', ar: 'المسارات المهنية' },
    body: {
      en: 'Modules arranged into a job: SOC analyst, penetration tester, and more.',
      ar: 'وحدات مرتبة على شكل مهنة: محلل مركز عمليات، مختبر اختراق، وغيرهما.',
    },
  },
];

const JourneyMap: React.FC = () => {
  const { lang } = useLang();
  const navigate = useNavigate();
  const ar = lang === 'ar';

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12, duration: 0.4 }}
      aria-label={ar ? 'رحلتك في الأكاديمية' : 'Your journey through the Academy'}
    >
      <h2 className="mb-3 px-1 text-xs font-bold uppercase tracking-[0.14em] text-[#8592ad]">
        {ar ? 'كيف تسير الأكاديمية' : 'How the Academy runs'}
      </h2>

      <ol className="grid gap-3 md:grid-cols-3 md:gap-5">
        {STAGES.map((stage, i) => {
          const Icon = stage.icon;
          return (
            <li key={stage.to} className="relative">
              <button
                onClick={() => navigate(stage.to)}
                className="group h-full w-full rounded-2xl border border-[#263248] bg-[#121a2a] p-4 text-start transition-all hover:-translate-y-0.5 hover:border-[#00a859]/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00a859]/50"
              >
                {/* The number sits above the name rather than beside it: three
                    of these share a row on a tablet, and a name that has to
                    fit next to a number is a name that gets cut in half. */}
                <div className="flex items-center gap-2.5">
                  <span
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${stage.color}15`, border: `1px solid ${stage.color}30` }}
                  >
                    <Icon size={15} style={{ color: stage.color }} />
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#7c8aa6]" dir="ltr">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>
                <p className="mt-2.5 text-sm font-bold leading-snug text-[#f3f6ff]">{stage.title[lang]}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-[#8592ad]">{stage.body[lang]}</p>
              </button>

              {/* The step onward, drawn between the cards rather than written
                  into the copy: a bare arrow inside Arabic text reverses on
                  screen and points the wrong way. */}
              {i < STAGES.length - 1 && (
                <ChevronRight
                  aria-hidden
                  size={16}
                  className="rtl-flip absolute -end-3.5 top-1/2 hidden -translate-y-1/2 text-[#33415e] md:block"
                />
              )}
            </li>
          );
        })}
      </ol>
    </motion.section>
  );
};

export default JourneyMap;
