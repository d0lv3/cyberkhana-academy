import React from 'react';
import { Difficulty } from '../../types';

interface DifficultyBadgeProps {
  difficulty: Difficulty;
  className?: string;
}

const colorMap: Record<Difficulty, string> = {
  Beginner: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  Easy: 'bg-green-500/15 text-green-400 border-green-500/25',
  Medium: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
  Hard: 'bg-orange-500/15 text-orange-400 border-orange-500/25',
  Expert: 'bg-red-500/15 text-red-400 border-red-500/25',
};

const DifficultyBadge: React.FC<DifficultyBadgeProps> = ({ difficulty, className = '' }) => {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${colorMap[difficulty]} ${className}`}
    >
      {difficulty}
    </span>
  );
};

export default DifficultyBadge;
