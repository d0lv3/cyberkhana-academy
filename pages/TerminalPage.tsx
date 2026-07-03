import React from 'react';
import { TerminalSquare } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import CourseTerminal from '../components/terminal/CourseTerminal';

/** Full-screen standalone terminal — the target of the dock's "open in new tab". */
const TerminalPage: React.FC = () => {
  const { user } = useAuth();
  const firstName = (user?.displayName ?? 'user').trim().split(/\s+/)[0] || 'user';

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
        <button onClick={close} className="text-xs text-[#6e7a94] transition-colors hover:text-[#c9d3e0]">
          Close
        </button>
      </div>
      <div className="min-h-0 flex-1">
        <CourseTerminal user={firstName} />
      </div>
    </div>
  );
};

export default TerminalPage;
