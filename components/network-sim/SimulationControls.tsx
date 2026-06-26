import React from 'react';
import {
  SkipBack,
  SkipForward,
  Play,
  Pause,
  RotateCcw,
} from 'lucide-react';

interface SimulationControlsProps {
  currentStep: number;
  totalSteps: number;
  isAnimating: boolean;
  isPlaying: boolean;
  stepTitle: string;
  stepDescription: string;
  onPrevious: () => void;
  onNext: () => void;
  onTogglePlay: () => void;
  onReset: () => void;
}

const SimulationControls: React.FC<SimulationControlsProps> = ({
  currentStep,
  totalSteps,
  isAnimating,
  isPlaying,
  stepTitle,
  stepDescription,
  onPrevious,
  onNext,
  onTogglePlay,
  onReset,
}) => {
  const isFirst = currentStep <= 0;
  const isLast = currentStep >= totalSteps - 1;

  return (
    <div className="flex flex-col gap-3">
      {/* Step info */}
      <div className="px-1">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#6e7a94]">
            Step {currentStep + 1} of {totalSteps}
          </span>
        </div>
        <h4 className="text-sm font-semibold text-[#f3f6ff] leading-snug">
          {stepTitle}
        </h4>
        <p className="text-xs text-[#9aa5bf] mt-1 leading-relaxed">
          {stepDescription}
        </p>
      </div>

      {/* Progress dots */}
      <div className="flex items-center gap-1 px-1" dir="ltr">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <span
            key={i}
            className={`h-1 rounded-full transition-all duration-300 ${
              i === currentStep
                ? 'bg-[#00a859] w-5'
                : i < currentStep
                ? 'bg-[#00a859]/40 w-2'
                : 'bg-[#263248] w-2'
            }`}
          />
        ))}
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={onReset}
          disabled={isFirst && !isPlaying}
          className="p-2 rounded-lg text-[#6e7a94] hover:text-[#d2d7e3] hover:bg-[#1a2332] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Reset"
        >
          <RotateCcw size={16} />
        </button>

        <button
          onClick={onPrevious}
          disabled={isFirst || isAnimating}
          className="p-2 rounded-lg text-[#6e7a94] hover:text-[#d2d7e3] hover:bg-[#1a2332] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Previous step"
        >
          <SkipBack size={16} />
        </button>

        <button
          onClick={onTogglePlay}
          disabled={isLast && !isPlaying}
          className={`p-2.5 rounded-lg transition-all ${
            isPlaying
              ? 'bg-[#00a859]/15 text-[#00a859] border border-[#00a859]/30'
              : 'bg-[#1a2332] text-[#d2d7e3] border border-[#263248] hover:border-[#00a859]/30 hover:text-[#00a859]'
          } disabled:opacity-30 disabled:cursor-not-allowed`}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
        </button>

        <button
          onClick={onNext}
          disabled={isLast || isAnimating}
          className="p-2 rounded-lg text-[#6e7a94] hover:text-[#d2d7e3] hover:bg-[#1a2332] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Next step"
        >
          <SkipForward size={16} />
        </button>
      </div>
    </div>
  );
};

export default SimulationControls;
