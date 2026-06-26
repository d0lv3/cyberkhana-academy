import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useLang } from '../../contexts/LangContext';
import Button from '../ui/EnhancedButton';
import { DISPLAY_FONT_STYLE } from './displayFont';

interface CTASectionProps {
  onGetStarted: () => void;
}

const CTASection: React.FC<CTASectionProps> = ({ onGetStarted }) => {
  const { t } = useLang();

  return (
    <section className="relative px-6 py-24 md:py-28 bg-[#0d1117] overflow-hidden">
      {/* glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-[#00a859]/[0.07] rounded-full blur-[130px]" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative z-10 max-w-3xl mx-auto text-center"
      >
        <h2 style={DISPLAY_FONT_STYLE} className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-[#f3f6ff] leading-tight">
          {t('cta.heading')}
        </h2>
        <p className="text-[#9aa5bf] text-base sm:text-lg mt-5 max-w-xl mx-auto">
          {t('cta.subtitle')}
        </p>
        <div className="mt-9 flex justify-center">
          <Button variant="neon" size="xl" onClick={onGetStarted} rightIcon={<ArrowRight size={20} />}>
            {t('cta.button')}
          </Button>
        </div>
      </motion.div>
    </section>
  );
};

export default CTASection;
