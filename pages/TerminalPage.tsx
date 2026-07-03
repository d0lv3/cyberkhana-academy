import React, { useRef } from 'react';
import { TerminalSquare, RotateCcw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import CourseTerminal, { type CourseTerminalHandle } from '../components/terminal/CourseTerminal';
import { confirmDialog } from '../components/ui/ConfirmHost';

/** Full-screen standalone terminal — the target of the dock's "open in new tab". */
const TerminalPage: React.FC = () => {
  const { user } = useAuth();
  const firstName = (user?.displayName ?? 'user').trim().split(/\s+/)[0] || 'user';
  const termRef = useRef<CourseTerminalHandle>(null);

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
        <div className="flex items-center gap-2 text-sm font-semibold text-[#c9d3e0]">
          <TerminalSquare size={16} className="text-[#00c766]" />
          <span dir="ltr">{firstName}@cyberkhana — practice shell</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={handleReset} className="inline-flex items-center gap-1.5 text-xs text-[#6e7a94] transition-colors hover:text-[#c9d3e0]">
            <RotateCcw size={13} /> Reset
          </button>
          <button onClick={close} className="text-xs text-[#6e7a94] transition-colors hover:text-[#c9d3e0]">
            Close
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <CourseTerminal ref={termRef} user={firstName} />
      </div>
    </div>
  );
};

export default TerminalPage;
