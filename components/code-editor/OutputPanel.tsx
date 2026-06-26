import React from 'react';
import { ChevronRight, AlertTriangle, Clock, Trash2 } from 'lucide-react';

interface OutputPanelProps {
  output: string;
  error?: string;
  durationMs?: number;
  isRunning: boolean;
  onClear: () => void;
}

const OutputPanel: React.FC<OutputPanelProps> = ({
  output,
  error,
  durationMs,
  isRunning,
  onClear,
}) => {
  const hasContent = output || error;

  return (
    <div className="flex flex-col h-full bg-[#080c14] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-t border-[#151d2e] bg-[#0b1019]">
        <div className="flex items-center gap-2">
          <ChevronRight size={11} className="text-[#2d3748]" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#2d3748]">
            Output
          </span>
          {durationMs !== undefined && !isRunning && hasContent && (
            <span className="flex items-center gap-1 text-[9px] text-[#2d3748] font-mono">
              <Clock size={8} /> {durationMs}ms
            </span>
          )}
        </div>
        {hasContent && (
          <button
            onClick={onClear}
            className="text-[#2d3748] hover:text-[#4d5a73] transition-colors p-0.5"
            title="Clear"
          >
            <Trash2 size={11} />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-3 py-2.5 custom-scrollbar font-mono text-[13px] leading-relaxed">
        {isRunning && (
          <div className="flex items-center gap-2 text-[#4d5a73]">
            <div className="w-2.5 h-2.5 border-[1.5px] border-[#00a859] border-t-transparent rounded-full animate-spin" />
            <span className="text-[11px]">Running...</span>
          </div>
        )}

        {!isRunning && !hasContent && (
          <p className="text-[#2d3748] text-[11px]">
            Run your code to see output here.
          </p>
        )}

        {!isRunning && output && (
          <pre className="text-[#b4bcd0] whitespace-pre-wrap break-words">{output}</pre>
        )}

        {!isRunning && error && (
          <div className={output ? 'mt-2' : ''}>
            <div className="flex items-center gap-1.5 mb-1">
              <AlertTriangle size={11} className="text-[#ef4444]" />
              <span className="text-[9px] font-bold uppercase tracking-widest text-[#ef4444]">
                Error
              </span>
            </div>
            <pre className="text-[#ef4444]/80 whitespace-pre-wrap break-words text-[12px]">
              {error}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default OutputPanel;
