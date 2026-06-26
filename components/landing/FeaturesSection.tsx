import React from 'react';
import { motion } from 'framer-motion';
import { useLang } from '../../contexts/LangContext';
import SectionHeading from './SectionHeading';
import SpotlightCard from './SpotlightCard';
import { FundamentalsIcon, ModulesIcon, PathsIcon } from './Feature3DIcons';

const hexToRgb = (hex: string): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
};

const FeaturesSection: React.FC = () => {
  const { t } = useLang();

  const features = [
    { Icon: FundamentalsIcon, title: t('features.fundamentals.title'), description: t('features.fundamentals.desc'), color: '#00a859' },
    { Icon: ModulesIcon, title: t('features.modules.title'), description: t('features.modules.desc'), color: '#9fef00' },
    { Icon: PathsIcon, title: t('features.paths.title'), description: t('features.paths.desc'), color: '#60a5fa' },
  ];

  return (
    <section className="relative px-6 py-24 md:py-32 bg-[#0d1117] overflow-hidden">
      {/* ambient color wash so the frosted-glass cards have something to blur */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/3 left-[12%] w-72 h-72 rounded-full bg-[#00a859]/15 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-[#9fef00]/10 blur-[130px]" />
        <div className="absolute bottom-1/4 right-[12%] w-72 h-72 rounded-full bg-[#60a5fa]/15 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        <SectionHeading heading={t('features.heading')} subtitle={t('features.subtitle')} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          {features.map((feature, index) => {
            const rgb = hexToRgb(feature.color);
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.12 }}
                className="h-full"
              >
                <SpotlightCard
                  spotlightColor={`rgba(${rgb},0.22)`}
                  className="group h-full rounded-2xl border border-white/10 bg-white/[0.04] p-8 shadow-lg shadow-black/20 backdrop-blur-xl transition-all duration-300 hover:bg-white/[0.06] hover:shadow-xl hover:shadow-black/40"
                >
                  {/* hover border that lights up in the card's accent */}
                  <div
                    className="pointer-events-none absolute inset-0 rounded-2xl border opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{ borderColor: `rgba(${rgb},0.55)` }}
                  />

                  <div className="relative z-10">
                    <div className="mb-5 h-20 w-20 origin-center transition-transform duration-500 ease-out group-hover:-translate-y-1 group-hover:scale-[1.18]">
                      <feature.Icon color={feature.color} size={80} />
                    </div>
                    <h3 className="text-xl font-bold text-[#f3f6ff] mb-3">{feature.title}</h3>
                    <p className="text-[#9aa5bf] text-sm leading-relaxed">{feature.description}</p>
                  </div>
                </SpotlightCard>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
