import React from 'react';
import { motion } from 'framer-motion';
import { Network, TerminalSquare, Languages } from 'lucide-react';
import { useLang } from '../../contexts/LangContext';
import SectionHeading from './SectionHeading';

const WhyAcademy: React.FC = () => {
  const { t } = useLang();

  const items = [
    { icon: Network, title: t('why.sim.title'), desc: t('why.sim.desc'), color: '#60a5fa' },
    { icon: TerminalSquare, title: t('why.code.title'), desc: t('why.code.desc'), color: '#9fef00' },
    { icon: Languages, title: t('why.lang.title'), desc: t('why.lang.desc'), color: '#00a859' },
  ];

  return (
    <section className="relative px-6 py-24 md:py-32 bg-[#0a0f18] border-y border-[#1a2332] overflow-hidden">
      {/* faint grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto">
        <SectionHeading heading={t('why.heading')} subtitle={t('why.subtitle')} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 mt-16">
          {items.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.12 }}
              className="text-center md:text-start"
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 mx-auto md:mx-0"
                style={{ backgroundColor: `${item.color}14`, border: `1px solid ${item.color}33` }}
              >
                <item.icon size={30} style={{ color: item.color }} />
              </div>
              <h3 className="text-xl font-bold text-[#f3f6ff] mb-3">{item.title}</h3>
              <p className="text-[#9aa5bf] text-sm leading-relaxed max-w-sm mx-auto md:mx-0">
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyAcademy;
