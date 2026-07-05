import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Monitor } from 'lucide-react';
import CourseTerminal, { type CourseTerminalHandle } from './CourseTerminal';
import { createNet, randomLanIp, type CyberNet } from '../../services/cyberNet';

export interface TerminalSplitHandle {
  /** Reset every terminal currently shown. */
  reset: () => void;
}

interface TerminalSplitProps {
  user: string;
  /** When true, show two stacked terminals (each its own box on the lab LAN). */
  split: boolean;
  onExit?: () => void;
}

/** A thin label above a split pane showing that box's LAN IP for the nc demo. */
const PaneLabel: React.FC<{ name: string; ip: string }> = ({ name, ip }) => (
  <div className="flex flex-shrink-0 items-center gap-2 border-b border-[#1c2534] bg-[#0d1117] px-3 py-1 text-[11px] text-[#6e7a94]" dir="ltr">
    <Monitor size={12} className="text-[#00c766]" />
    <span className="font-semibold text-[#9aa5bf]">{name}</span>
    <span className="text-[#4b5a72]">·</span>
    <span className="font-mono text-[#00c766]">{ip}</span>
    <span className="text-[#4b5a72]">— use this IP to connect</span>
  </div>
);

/**
 * Renders a single terminal, or — when `split` — two terminals stacked top and
 * bottom. Each split pane gets an independent network address, so you can run
 * the nc reverse-shell demo between them without opening a second tab.
 */
const TerminalSplit = forwardRef<TerminalSplitHandle, TerminalSplitProps>(({ user, split, onExit }, ref) => {
  const singleRef = useRef<CourseTerminalHandle>(null);
  const aRef = useRef<CourseTerminalHandle>(null);
  const bRef = useRef<CourseTerminalHandle>(null);
  const [nets, setNets] = useState<{ a: CyberNet; b: CyberNet } | null>(null);

  useEffect(() => {
    if (!split) { setNets(null); return; }
    const ipA = randomLanIp();
    let ipB = randomLanIp();
    for (let i = 0; i < 20 && ipB === ipA; i++) ipB = randomLanIp();
    const a = createNet(ipA);
    const b = createNet(ipB);
    setNets({ a, b });
    return () => { a.dispose(); b.dispose(); };
  }, [split]);

  useImperativeHandle(ref, () => ({
    reset: () => { singleRef.current?.reset(); aRef.current?.reset(); bRef.current?.reset(); },
  }), []);

  if (split && nets) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex min-h-0 flex-1 flex-col">
          <PaneLabel name="Machine A" ip={nets.a.localIp} />
          <div className="min-h-0 flex-1">
            <CourseTerminal ref={aRef} user={user} net={nets.a} instanceId="split-a" />
          </div>
        </div>
        <div className="h-[3px] flex-shrink-0 bg-[#00a859]/25" />
        <div className="flex min-h-0 flex-1 flex-col">
          <PaneLabel name="Machine B" ip={nets.b.localIp} />
          <div className="min-h-0 flex-1">
            <CourseTerminal ref={bRef} user={user} net={nets.b} instanceId="split-b" />
          </div>
        </div>
      </div>
    );
  }

  return <CourseTerminal ref={singleRef} user={user} onExit={onExit} />;
});

TerminalSplit.displayName = 'TerminalSplit';

export default TerminalSplit;
