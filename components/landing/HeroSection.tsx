import React, { useState, useEffect } from 'react';
import { motion, type Variants } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useLang } from '../../contexts/LangContext';
import Button from '../ui/EnhancedButton';
import HeroShowcase from './HeroShowcase';
import { DISPLAY_FONT_STYLE } from './displayFont';

interface HeroSectionProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 22 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.13 + 0.1, duration: 0.7, ease: 'easeOut' },
  }),
};

function useTypewriter(
  words: readonly string[],
  typingSpeed = 90,
  deletingSpeed = 45,
  pauseDuration = 1600
) {
  const [text, setText] = useState('');
  const [wordIndex, setWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentWord = words[wordIndex % words.length];
    const timeout = setTimeout(
      () => {
        if (!isDeleting) {
          setText(currentWord.slice(0, text.length + 1));
          if (text.length + 1 === currentWord.length) {
            setTimeout(() => setIsDeleting(true), pauseDuration);
            return;
          }
        } else {
          setText(currentWord.slice(0, text.length - 1));
          if (text.length - 1 === 0) {
            setIsDeleting(false);
            setWordIndex((prev) => (prev + 1) % words.length);
          }
        }
      },
      isDeleting ? deletingSpeed : typingSpeed
    );
    return () => clearTimeout(timeout);
  }, [text, isDeleting, wordIndex, words, typingSpeed, deletingSpeed, pauseDuration]);

  return text;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onGetStarted, onLogin }) => {
  const { t, isArabic } = useLang();

  const words = isArabic
    ? ['أساسيات الأمن السيبراني', 'اختبار الاختراق', 'الفريق الأزرق', 'الفريق الأحمر', 'أمن الشبكات', 'تحليل البرمجيات الخبيثة']
    : ['Cybersecurity Essentials', 'Penetration Testing', 'Blue Teaming', 'Red Teaming', 'Network Security', 'Malware Analysis'];
  const typed = useTypewriter(words);

  // First line plain, last line in the brand gradient
  const headlineLines = t('hero.headline').split('\n');

  return (
    <section className="relative min-h-screen w-full flex items-center px-6 py-28 lg:py-0 overflow-hidden bg-[#0d1117]">
      {/* Neon grid */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(159,239,0,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(159,239,0,0.35) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />
      {/* Ambient glows */}
      <div className="absolute top-1/4 -left-32 w-[560px] h-[560px] bg-[#00a859]/5 rounded-full blur-[140px]" />
      <div className="absolute bottom-0 right-0 w-[480px] h-[480px] bg-[#9fef00]/[0.04] rounded-full blur-[120px]" />
      {/* Fade to base */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0d1117]" />
      {/* Film grain + vignette for depth */}
      <div className="absolute inset-0 grain-overlay opacity-[0.035] mix-blend-soft-light pointer-events-none" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 38%, transparent 55%, rgba(5,8,14,0.6) 100%)' }}
      />

      <div className="relative z-10 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-14 lg:gap-10 items-center">
        {/* ── Copy ── */}
        <div className="flex flex-col items-center lg:items-start text-center lg:text-start">
          {/* Headline — last line carries the brand gradient */}
          <motion.h1
            custom={0}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            style={DISPLAY_FONT_STYLE}
            className="text-4xl sm:text-5xl xl:text-6xl font-black tracking-tight text-[#f3f6ff] leading-[1.1] mb-6"
          >
            {headlineLines.map((line, i) =>
              i === headlineLines.length - 1 && headlineLines.length > 1 ? (
                <span
                  key={i}
                  className="block bg-gradient-to-r from-[#00a859] via-[#9fef00] to-[#00a859] bg-clip-text text-transparent pb-1"
                >
                  {line}
                </span>
              ) : (
                <span key={i} className="block">
                  {line}
                </span>
              )
            )}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            custom={1}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="text-lg sm:text-xl text-[#9aa5bf] max-w-xl mb-5"
          >
            {t('hero.subtitle')}
          </motion.p>

          {/* Typewriter — framed as a terminal prompt */}
          <motion.div
            custom={2}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="flex items-center gap-2 text-base md:text-lg text-[#6e7a94] h-8 mb-9"
          >
            <span className="font-mono text-[#00a859]" dir="ltr">$</span>
            <span>{t('hero.learn')} </span>
            <span className="text-[#9fef00] font-semibold">{typed}</span>
            <span className="inline-block w-[2px] h-5 bg-[#9fef00] align-middle animate-pulse" />
          </motion.div>

          {/* CTAs */}
          <motion.div
            custom={3}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="flex flex-col sm:flex-row items-center gap-4"
          >
            <Button variant="neon" size="xl" onClick={onGetStarted} rightIcon={<ArrowRight size={20} />}>
              {t('hero.cta')}
            </Button>
            <Button variant="outline" size="xl" onClick={onLogin}>
              {t('hero.cta.login')}
            </Button>
          </motion.div>

        </div>

        {/* ── Live product showcase ── */}
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.45, duration: 0.8, ease: 'easeOut' }}
        >
          <HeroShowcase />
        </motion.div>
      </div>

    </section>
  );
};

export default HeroSection;
