import React from 'react';
import { ChevronRight } from 'lucide-react';

interface ModuleActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  children: React.ReactNode;
}

/** The shared way into a module or programming course. */
const ModuleActionButton: React.FC<ModuleActionButtonProps> = ({
  icon,
  children,
  className = '',
  type = 'button',
  ...props
}) => (
  <button
    type={type}
    className={`group inline-flex items-center justify-center gap-2 rounded-xl border border-[#00a859]/45 bg-[#00a859]/12 px-6 py-3.5 text-sm font-bold text-[#00a859] shadow-lg shadow-[#00a859]/5 backdrop-blur-md transition-all hover:border-[#9fef00]/60 hover:bg-[#00a859]/20 hover:text-[#9fef00] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[#00a859]/45 disabled:hover:bg-[#00a859]/12 disabled:hover:text-[#00a859] ${className}`}
    {...props}
  >
    <span className="flex-shrink-0">{icon}</span>
    <span className="min-w-0 text-center">{children}</span>
    <ChevronRight
      size={15}
      className="rtl-flip flex-shrink-0 transition-transform group-hover:translate-x-0.5"
    />
  </button>
);

export default ModuleActionButton;
