import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  ShieldAlert,
  Building2,
  Radar,
  ClipboardList,
  Layers,
  PenTool,
  ArrowLeft,
  BadgeCheck,
  Languages,
  FlaskConical,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLang } from '../../contexts/LangContext';

/* ─── CyberSecurity 101 ───
 * The summit of the Fundamentals roadmap. A structured curriculum covering
 * the foundations a Security+ (SY0-701) candidate is expected to know,
 * organized by the exam's five domains. Lessons attach here as creators
 * publish security modules.
 */

interface Domain {
  num: string;
  icon: React.ElementType;
  color: string;
  title: { en: string; ar: string };
  desc: { en: string; ar: string };
  topics: { en: string; ar: string }[];
}

const DOMAINS: Domain[] = [
  {
    num: '01',
    icon: ShieldCheck,
    color: '#00a859',
    title: { en: 'General Security Concepts', ar: 'مفاهيم الأمن العامة' },
    desc: {
      en: 'The vocabulary and mental models everything else builds on.',
      ar: 'المصطلحات والنماذج الذهنية التي يُبنى عليها كل ما يأتي بعدها.',
    },
    topics: [
      { en: 'CIA Triad', ar: 'ثلاثية CIA' },
      { en: 'AAA & Zero Trust', ar: 'AAA وانعدام الثقة' },
      { en: 'Security Controls', ar: 'الضوابط الأمنية' },
      { en: 'Cryptography Basics', ar: 'أساسيات التشفير' },
      { en: 'Hashing & PKI', ar: 'التجزئة و PKI' },
      { en: 'Digital Certificates', ar: 'الشهادات الرقمية' },
    ],
  },
  {
    num: '02',
    icon: ShieldAlert,
    color: '#f87171',
    title: { en: 'Threats, Vulnerabilities & Mitigations', ar: 'التهديدات والثغرات والتخفيف' },
    desc: {
      en: 'Know the enemy: who attacks, how they get in, and how to shut the door.',
      ar: 'اعرف الخصم: من يهاجم، كيف يتسلل، وكيف تُغلق الباب في وجهه.',
    },
    topics: [
      { en: 'Threat Actors', ar: 'الجهات المهاجمة' },
      { en: 'Malware Types', ar: 'أنواع البرمجيات الخبيثة' },
      { en: 'Social Engineering', ar: 'الهندسة الاجتماعية' },
      { en: 'Phishing', ar: 'التصيّد' },
      { en: 'Vulnerabilities & Zero-days', ar: 'الثغرات وهجمات اليوم صفر' },
      { en: 'Mitigation Techniques', ar: 'تقنيات التخفيف' },
    ],
  },
  {
    num: '03',
    icon: Building2,
    color: '#60a5fa',
    title: { en: 'Security Architecture', ar: 'هندسة الأمن' },
    desc: {
      en: 'Designing networks, clouds, and systems that are hard to break.',
      ar: 'تصميم شبكات وأنظمة سحابية يصعب اختراقها.',
    },
    topics: [
      { en: 'Network Segmentation', ar: 'تقسيم الشبكات' },
      { en: 'Firewalls & IDS/IPS', ar: 'الجدران النارية و IDS/IPS' },
      { en: 'Cloud Security', ar: 'أمن السحابة' },
      { en: 'IoT & OT Security', ar: 'أمن إنترنت الأشياء و OT' },
      { en: 'Resilience & Backups', ar: 'المرونة والنسخ الاحتياطي' },
      { en: 'Secure Protocols', ar: 'البروتوكولات الآمنة' },
    ],
  },
  {
    num: '04',
    icon: Radar,
    color: '#9fef00',
    title: { en: 'Security Operations', ar: 'العمليات الأمنية' },
    desc: {
      en: 'The day-to-day of defending: monitoring, responding, and recovering.',
      ar: 'العمل اليومي للدفاع: المراقبة والاستجابة والتعافي.',
    },
    topics: [
      { en: 'SIEM & Monitoring', ar: 'SIEM والمراقبة' },
      { en: 'Incident Response', ar: 'الاستجابة للحوادث' },
      { en: 'Digital Forensics', ar: 'التحليل الجنائي الرقمي' },
      { en: 'System Hardening', ar: 'تقوية الأنظمة' },
      { en: 'Identity & Access Mgmt', ar: 'إدارة الهوية والوصول' },
      { en: 'Automation & SOAR', ar: 'الأتمتة و SOAR' },
    ],
  },
  {
    num: '05',
    icon: ClipboardList,
    color: '#a78bfa',
    title: { en: 'Security Program Management', ar: 'إدارة البرامج الأمنية' },
    desc: {
      en: 'Governance, risk, and compliance — security as an organization-wide discipline.',
      ar: 'الحوكمة والمخاطر والامتثال — الأمن كمنهج على مستوى المؤسسة.',
    },
    topics: [
      { en: 'Governance & Policies', ar: 'الحوكمة والسياسات' },
      { en: 'Risk Management', ar: 'إدارة المخاطر' },
      { en: 'Compliance & Audits', ar: 'الامتثال والتدقيق' },
      { en: 'Third-party Risk', ar: 'مخاطر الأطراف الثالثة' },
      { en: 'Security Awareness', ar: 'التوعية الأمنية' },
    ],
  },
];

const CyberSecurity101Page: React.FC = () => {
  const navigate = useNavigate();
  const { lang } = useLang();
  const { user } = useAuth();
  const isCreator = user?.role === 'creator' || user?.role === 'admin';

  return (
    <div className="space-y-6">
      {/* ── Back to the roadmap ── */}
      <button
        onClick={() => navigate('/fundamentals')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6e7a94] hover:text-[#00a859] transition-colors"
      >
        <ArrowLeft size={14} className="rtl:rotate-180" />
        {lang === 'ar' ? 'العودة إلى خارطة الأساسيات' : 'Back to the Fundamentals roadmap'}
      </button>

      {/* ── Hero ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative overflow-hidden rounded-2xl border border-[#00a859]/30 bg-[#0d1525] p-7 sm:p-9"
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(540px circle at 85% 0%, rgba(0,168,89,0.16), transparent 55%), radial-gradient(420px circle at 0% 100%, rgba(159,239,0,0.07), transparent 50%)',
          }}
        />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-[#00a859]/12 border border-[#00a859]/35 flex items-center justify-center flex-shrink-0">
            <ShieldCheck size={32} className="text-[#00a859]" />
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-bold tracking-[0.25em] text-[#00a859] uppercase mb-1" dir="ltr">
              {lang === 'ar' ? 'القمة' : 'THE SUMMIT'}
            </p>
            <h1 className="text-2xl sm:text-3xl font-black text-[#f3f6ff]">
              {lang === 'ar' ? 'الأمن السيبراني 101' : 'CyberSecurity 101'}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-[#9aa5bf]">
              {lang === 'ar'
                ? 'كل ما بنيته في البرمجة وأنظمة التشغيل والشبكات يلتقي هنا. منهج تأسيسي يغطي المعرفة التي تتوقعها شهادة +CompTIA Security، مقسّم على نطاقات الامتحان الخمسة.'
                : 'Everything you built in Programming, Operating Systems, and Networking converges here. A foundation curriculum covering the knowledge expected for CompTIA Security+, organized by the exam’s five domains.'}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                { icon: BadgeCheck, label: lang === 'ar' ? 'متوافق مع +Security' : 'Security+ aligned' },
                { icon: Languages, label: lang === 'ar' ? 'عربي وإنجليزي' : 'Arabic & English' },
                { icon: FlaskConical, label: lang === 'ar' ? 'تطبيقي' : 'Hands-on' },
              ].map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#263248] bg-[#0a121f] px-3 py-1 text-[11px] font-semibold text-[#c4cad6]"
                >
                  <Icon size={12} className="text-[#00a859]" /> {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── The five domains ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {DOMAINS.map((domain, i) => {
          const Icon = domain.icon;
          return (
            <motion.div
              key={domain.num}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.07, duration: 0.4 }}
              className={`rounded-2xl border border-[#263248] bg-[#121a2a] p-6 ${i === 4 ? 'lg:col-span-2' : ''}`}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${domain.color}14`, border: `1px solid ${domain.color}33` }}
                >
                  <Icon size={20} style={{ color: domain.color }} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-0.5" style={{ color: domain.color }} dir="ltr">
                    {lang === 'ar' ? `النطاق ${domain.num}` : `DOMAIN ${domain.num}`}
                  </p>
                  <h3 className="text-base font-bold text-[#f3f6ff]">{domain.title[lang]}</h3>
                  <p className="mt-1 text-sm text-[#9aa5bf]">{domain.desc[lang]}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {domain.topics.map((topic) => (
                  <span
                    key={topic.en}
                    className="rounded-md border border-[#263248] bg-[#0e1522] px-2 py-1 text-[11px] font-medium text-[#8b98ae]"
                  >
                    {topic[lang]}
                  </span>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── Where the lessons live ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="rounded-2xl border border-[#263248] bg-[#121a2a] p-6 flex flex-col sm:flex-row sm:items-center gap-4"
      >
        <div className="flex-1">
          <h3 className="text-sm font-bold text-[#f3f6ff]">
            {lang === 'ar' ? 'الدروس تُنشر هنا تباعًا' : 'Lessons are rolling out'}
          </h3>
          <p className="mt-1 text-xs text-[#9aa5bf]">
            {lang === 'ar'
              ? 'وحدات الأمن السيبراني التي ينشرها صنّاع المحتوى تظهر في مركز الوحدات — صفِّ حسب الفئة (هجومي / دفاعي / عام) للعثور عليها.'
              : 'Security modules published by creators surface in the Modules hub — filter by category (Offensive / Defensive / General) to find them.'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => navigate('/modules')}
            className="inline-flex items-center gap-2 rounded-xl bg-[#00a859] px-4 py-2.5 text-sm font-bold text-[#0d1117] hover:bg-[#00934e] transition-colors"
          >
            <Layers size={15} /> {lang === 'ar' ? 'تصفح الوحدات' : 'Browse Modules'}
          </button>
          {isCreator && (
            <button
              onClick={() => navigate('/creators')}
              className="inline-flex items-center gap-2 rounded-xl border border-[#263248] bg-[#0e1522] px-4 py-2.5 text-sm font-bold text-[#d2d7e3] hover:border-[#00a859]/40 hover:text-[#00a859] transition-colors"
            >
              <PenTool size={15} /> {lang === 'ar' ? 'أنشئ درسًا' : 'Create a lesson'}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default CyberSecurity101Page;
