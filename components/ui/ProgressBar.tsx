import React from 'react';

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  color?: 'green' | 'neon' | 'blue' | 'gold';
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

const colorMap = {
  green: 'bg-[#00a859]',
  neon: 'bg-[#9fef00]',
  blue: 'bg-blue-500',
  gold: 'bg-[#f3a43a]',
};

const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  className = '',
  color = 'green',
  showLabel = false,
  size = 'md',
}) => {
  const percentage = Math.min(Math.round((value / max) * 100), 100);

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs text-[#9aa5bf]">Progress</span>
          <span className="text-xs font-semibold text-[#d2d7e3]">{percentage}%</span>
        </div>
      )}
      <div dir="ltr" className={`w-full bg-[#1a2332] rounded-full overflow-hidden ${size === 'sm' ? 'h-1.5' : 'h-2.5'}`}>
        <div
          className={`${colorMap[color]} rounded-full transition-all duration-500 ease-out ${size === 'sm' ? 'h-1.5' : 'h-2.5'}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
