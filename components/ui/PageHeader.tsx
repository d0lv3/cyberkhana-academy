import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
  iconColor?: string;
  /** Render a custom node instead of the icon chip (e.g. a language badge). */
  iconNode?: React.ReactNode;
  backTo?: string;
  backLabel?: string;
  badge?: string;
  /** Right-aligned content (stats, actions). */
  children?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  icon: Icon,
  iconColor = '#00a859',
  iconNode,
  backTo,
  backLabel,
  badge,
  children,
}) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {backTo && (
        <button
          onClick={() => navigate(backTo)}
          className="inline-flex items-center gap-2 text-sm text-[#6e7a94] hover:text-[#d2d7e3] transition-colors mb-4"
        >
          <ArrowLeft size={16} className="rtl-flip" />
          <span>{backLabel ?? 'Back'}</span>
        </button>
      )}

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4 min-w-0">
          {iconNode
            ? iconNode
            : Icon && (
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${iconColor}15`, border: `1px solid ${iconColor}30` }}
                >
                  <Icon size={24} style={{ color: iconColor }} />
                </div>
              )}
          <div className="min-w-0">
            {badge && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 mb-2 rounded-full bg-[#00a859]/10 border border-[#00a859]/20 text-[10px] font-semibold text-[#00a859]">
                {badge}
              </span>
            )}
            <h1 className="text-2xl sm:text-3xl font-black text-[#f3f6ff]">{title}</h1>
            {subtitle && <p className="text-[#9aa5bf] mt-1.5 max-w-2xl">{subtitle}</p>}
          </div>
        </div>

        {children && <div className="flex-shrink-0">{children}</div>}
      </div>
    </motion.div>
  );
};

export default PageHeader;
