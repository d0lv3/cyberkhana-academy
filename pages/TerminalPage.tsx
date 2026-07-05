import React, { useRef, useState } from 'react';
import { TerminalSquare, RotateCcw, Rows2, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import TerminalSplit, { type TerminalSplitHandle } from '../components/terminal/TerminalSplit';
import { confirmDialog } from '../components/ui/ConfirmHost';
import BrandLogo from '../components/ui/BrandLogo';

/** Full-screen standalone terminal — the target of the dock's "open in new tab". */
const TerminalPage: React.FC = () => {
  const { user } = useAuth();
  const firstName = (user?.displayName ?? 'user').trim().split(/\s+/)[0] || 'user';
  const termRef = useRef<TerminalSplitHandle>(null);
  // Start split when opened as `#/terminal?split=1`.
  const [split, setSplit] = useState(() => {
    try { return new URLSearchParams(window.location.hash.split('?')[1] || '').get('split') === '1'; }
    catch { return false; }
  });

  const handleReset = async () => {
    const ok = await confirmDialog({
      title: 'Reset terminal?',
      message: 'This clears the sandbox filesystem, variables, and history back to the starting state.',
      confirmLabel: 'Reset',
    });
    if (ok) termRef.current?.reset();
  };

  const close = () => {
    if (window.opener) window.close();
    else window.location.hash = '#/dashboard';
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-[#0a0e14]">
      <div className="flex items-center justify-between border-b border-[#263248] bg-[#0d1117] px-4 py-2.5">
        <div className="flex items-center gap-3">
          <a
            href="#/dashboard"
            title="CyberKhana Academy"
            aria-label="CyberKhana Academy home"
            className="flex items-center transition-opacity hover:opacity-80"
          >
            <BrandLogo variant="mark" loading="eager" className="h-7 w-7 object-contain" />
          </a>
          <span className="h-5 w-px bg-[#263248]" aria-hidden />
          <div className="flex items-center gap-2 text-sm font-semibold text-[#c9d3e0]">
            <TerminalSquare size={15} className="text-[#00c766]" />
            <span dir="ltr">{firstName}@cyberkhana — practice shell</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSplit((s) => !s)}
            title={split ? 'Back to one terminal' : 'Split into two terminals for the nc reverse-shell demo'}
            aria-pressed={split}
            className={`inline-flex items-center gap-1.5 text-xs transition-colors ${split ? 'text-[#00c766]' : 'text-[#6e7a94] hover:text-[#00c766]'}`}
          >
            <Rows2 size={13} /> {split ? 'Single view' : 'Split'}
          </button>
          <button onClick={handleReset} className="inline-flex items-center gap-1.5 text-xs text-[#6e7a94] transition-colors hover:text-[#c9d3e0]">
            <RotateCcw size={13} /> Reset
          </button>
          <button onClick={close} className="inline-flex items-center gap-1.5 text-xs text-[#6e7a94] transition-colors hover:text-[#c9d3e0]">
            <X size={13} /> Close
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <TerminalSplit ref={termRef} user={firstName} split={split} />
      </div>
    </div>
  );
};

export default TerminalPage;
