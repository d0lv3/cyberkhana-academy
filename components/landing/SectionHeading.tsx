import React from 'react';
import { motion } from 'framer-motion';
import { DISPLAY_FONT_STYLE } from './displayFont';

interface SectionHeadingProps {
  heading: string;
  subtitle?: string;
  align?: 'center' | 'start';
}

/** Landing section header — display heading + subtitle with a consistent entrance. */
const SectionHeading: React.FC<SectionHeadingProps> = ({ heading, subtitle, align = 'center' }) => {
  const centered = align === 'center';
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className={centered ? 'text-center' : 'text-start'}
    >
      <h2
        style={DISPLAY_FONT_STYLE}
        className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-[#f3f6ff]"
      >
        {heading}
      </h2>

      {subtitle && (
        <p
          className={`mt-4 text-base sm:text-lg text-[#9aa5bf] ${
            centered ? 'mx-auto max-w-2xl' : 'max-w-2xl'
          }`}
        >
          {subtitle}
        </p>
      )}
    </motion.div>
  );
};

export default SectionHeading;
