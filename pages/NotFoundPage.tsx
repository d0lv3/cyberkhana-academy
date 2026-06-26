import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, LayoutDashboard, BookOpen, Route as RouteIcon } from 'lucide-react';
import Button from '../components/ui/EnhancedButton';
import { useLang } from '../contexts/LangContext';

const MONO = "'JetBrains Mono', 'Fira Code', monospace";

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { lang, isArabic } = useLang();

  const suggestions = [
    { icon: LayoutDashboard, label: { en: 'Dashboard', ar: 'لوحة التحكم' }, to: '/dashboard' },
    { icon: BookOpen, label: { en: 'Fundamentals', ar: 'الأساسيات' }, to: '/fundamentals' },
    { icon: RouteIcon, label: { en: 'Paths', ar: 'المسارات' }, to: '/paths' },
  ];

  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center px-6 py-16 relative overflow-hidden">
      {/* dot grid */}
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: 'radial-gradient(rgba(98,115,143,0.35) 1px, transparent 1px)',
          backgroundSize: '26px 26px',
        }}
      />
      {/* ambient glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[560px] h-[340px] bg-[#00a859]/[0.07] rounded-full blur-[130px]" />
      <div className="absolute bottom-0 right-0 w-[360px] h-[280px] bg-[#9fef00]/[0.04] rounded-full blur-[110px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md text-center"
      >
        {/* glowing 404 */}
        <div className="relative inline-block select-none" dir="ltr">
          <p
            aria-hidden="true"
            className="absolute inset-0 text-[96px] sm:text-[120px] font-black leading-none text-[#9fef00] blur-2xl opacity-25"
            style={{ fontFamily: MONO }}
          >
            404
          </p>
          <p
            className="relative text-[96px] sm:text-[120px] font-black leading-none bg-gradient-to-b from-[#9fef00] via-[#00a859] to-[#007a42] bg-clip-text text-transparent"
            style={{ fontFamily: MONO }}
          >
            404
          </p>
        </div>

        <h1 className="text-xl sm:text-2xl font-black text-[#f3f6ff] mt-5 mb-2">
          {isArabic ? 'هذه الصفحة غير موجودة' : "This page doesn't exist"}
        </h1>
        <p className="text-sm text-[#9aa5bf] mb-8">
          {isArabic
            ? 'ربما تم نقل المحتوى أو إلغاء نشره، أو أن الرابط غير صحيح.'
            : 'The content may have moved or been unpublished, or the link is wrong.'}
        </p>

        {/* terminal trace */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.45 }}
          className="rounded-xl border border-[#263248] bg-[#0a0f18] overflow-hidden text-left shadow-2xl shadow-black/30 mb-8"
          dir="ltr"
        >
          {/* chrome bar */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1a2332] bg-[#0e1626]">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
            </span>
            <span className="text-[10px] text-[#4d5a73]" style={{ fontFamily: MONO }}>
              404.log
            </span>
          </div>

          <div className="px-4 py-3.5 space-y-2 text-xs" style={{ fontFamily: MONO }}>
            <p className="text-[#9aa5bf] truncate">
              <span className="text-[#00a859]">$</span> GET {location.pathname}
            </p>
            <p className="text-[#f87171]">✗ 404 — route not found</p>
            <p className="text-[#9aa5bf]">
              <span className="text-[#00a859]">$</span> suggest --routes
            </p>
            <div className="flex flex-wrap gap-2 pt-0.5 pb-1">
              {suggestions.map((s) => (
                <button
                  key={s.to}
                  onClick={() => navigate(s.to)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-[#263248] bg-[#0d1420] text-[11px] text-[#9aa5bf] hover:text-[#9fef00] hover:border-[#9fef00]/40 transition-all"
                >
                  <s.icon size={11} />
                  {s.label[lang]}
                </button>
              ))}
            </div>
            <p className="text-[#9aa5bf]">
              <span className="text-[#00a859]">$</span>
              <span className="inline-block w-[7px] h-3.5 bg-[#9fef00] ml-1.5 align-middle animate-pulse" />
            </p>
          </div>
        </motion.div>

        <div className="flex items-center justify-center gap-3">
          <Button variant="primary" onClick={() => navigate('/')} leftIcon={<Home size={15} />}>
            {isArabic ? 'العودة للرئيسية' : 'Go home'}
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            leftIcon={<ArrowLeft size={15} className="rtl-flip" />}
          >
            {isArabic ? 'رجوع' : 'Go back'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFoundPage;
