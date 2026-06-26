import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useLang } from '../../contexts/LangContext';

/** Count-up that starts when the element scrolls into view. */
function useCountUp(target: number, duration = 1800) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setStarted(true);
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    const startTime = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [started, target, duration]);

  return { count, ref };
}

const StatCell: React.FC<{ value: number; suffix: string; label: string }> = ({ value, suffix, label }) => {
  const { count, ref } = useCountUp(value);
  return (
    <div ref={ref} className="text-center p-6">
      <div
        className="font-mono text-4xl md:text-5xl font-bold text-[#9fef00] tabular-nums"
        style={{ textShadow: '0 0 24px rgba(159,239,0,0.28)' }}
        dir="ltr"
      >
        {count}
        {suffix}
      </div>
      <div className="text-[#9aa5bf] text-xs md:text-sm mt-2 uppercase tracking-wider font-semibold">
        {label}
      </div>
    </div>
  );
};

const StatsBand: React.FC = () => {
  const { t } = useLang();

  const stats = [
    { value: 3, suffix: '', label: t('landing.stats.tracks') },
    { value: 40, suffix: '+', label: t('landing.stats.lessons') },
    { value: 2, suffix: '', label: t('landing.stats.languages') },
    { value: 100, suffix: '%', label: t('landing.stats.handson') },
  ];

  return (
    <section className="relative py-16 md:py-20 bg-[#0d1117] overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[640px] h-[280px] bg-[#00a859]/[0.05] rounded-full blur-[110px]" />
      <div className="relative z-10 max-w-5xl mx-auto px-6">
        {/* hairline-framed stat row */}
        <div className="hairline" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-2 divide-y divide-[#1a2332] md:divide-y-0 md:divide-x md:divide-[#1a2332]"
        >
          {stats.map((s) => (
            <StatCell key={s.label} value={s.value} suffix={s.suffix} label={s.label} />
          ))}
        </motion.div>
        <div className="hairline" />
      </div>
    </section>
  );
};

export default StatsBand;
