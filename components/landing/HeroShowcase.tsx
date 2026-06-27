import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Maximize2 } from 'lucide-react';
import DeviceIcon from '../network-sim/DeviceIcon';
import InteractiveTerminal from './InteractiveTerminal';
import MatrixRain from './MatrixRain';

const MONO = "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace";
const CYCLE = 7; // seconds — one full request/response loop

/** A node in the mini topology. */
const Node: React.FC<{ left: string; type: 'laptop' | 'router' | 'server'; label: string; ip: string }> = ({
  left,
  type,
  label,
  ip,
}) => (
  <div
    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center"
    style={{ left }}
  >
    <DeviceIcon type={type} size={52} />
    <span className="mt-1 text-[10px] font-bold text-[#aab4c8]">{label}</span>
    <span className="text-[8.5px] text-[#5f6e86]" style={{ fontFamily: MONO }}>
      {ip}
    </span>
  </div>
);

/** Terminal output line that appears at `start` (0–1 of the cycle). */
const TermLine: React.FC<{ start: number; children: React.ReactNode }> = ({ start, children }) => (
  <motion.p
    initial={{ opacity: 0 }}
    animate={{ opacity: [0, 0, 1, 1, 0] }}
    transition={{ duration: CYCLE, times: [0, start, start + 0.04, 0.93, 1], repeat: Infinity }}
    className="leading-relaxed whitespace-nowrap"
  >
    {children}
  </motion.p>
);

/**
 * Self-playing product demo for the landing hero: a miniature of the real
 * network simulator (zones, devices, NAT packet flow) with a floating
 * terminal — the Academy's two signature surfaces, animating on loop.
 */
const HeroShowcase: React.FC = () => {
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [surprise, setSurprise] = useState(false);
  const [anchor, setAnchor] = useState({ top: 0, left: 0 });
  const termBtnRef = useRef<HTMLButtonElement>(null);

  const openTerminal = () => {
    const r = termBtnRef.current?.getBoundingClientRect();
    if (r) setAnchor({ top: r.top, left: r.left });
    setTerminalOpen(true);
  };

  return (
    <div className="relative w-full max-w-[540px] mx-auto pb-16" dir="ltr">
      {/* Ambient glow behind the stack */}
      <div className="absolute -inset-6 bg-[#00a859]/10 rounded-full blur-[90px]" />

      {/* ── Main card: mini network simulation ── */}
      <div
        className="relative rounded-2xl border border-[#263248] bg-[#0b1019] shadow-2xl shadow-black/40 overflow-hidden"
      >
        {/* Window chrome */}
        <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-[#1a2332] bg-[#0d1117]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#2c3a54]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#2c3a54]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#2c3a54]" />
          <span className="ml-2 text-[10px] font-semibold text-[#4d5a73]" style={{ fontFamily: MONO }}>
            ip-addressing.sim
          </span>
        </div>

        {/* Canvas */}
        <div className="relative h-[240px]">
          {/* Dot grid */}
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage: 'radial-gradient(#2c3a54 1.1px, transparent 1.1px)',
              backgroundSize: '22px 22px',
            }}
          />

          {/* Zones */}
          <div className="absolute left-[3.5%] top-[9%] bottom-[9%] w-[57%] rounded-xl border border-dashed border-[#00a859]/40 bg-[#00a859]/[0.05]">
            <span
              className="absolute top-2 left-3 text-[8.5px] font-bold tracking-[0.18em] text-[#00a859]/80"
              style={{ fontFamily: MONO }}
            >
              HOME NETWORK
            </span>
          </div>
          <div className="absolute right-[3.5%] top-[9%] bottom-[9%] w-[28%] rounded-xl border border-dashed border-[#62738f]/40 bg-[#62738f]/[0.05]">
            <span
              className="absolute top-2 left-3 text-[8.5px] font-bold tracking-[0.18em] text-[#8b98ae]/80"
              style={{ fontFamily: MONO }}
            >
              INTERNET
            </span>
          </div>

          {/* Link line */}
          <div className="absolute left-[15%] right-[15%] top-1/2 h-[2px] -translate-y-1/2 bg-[#45556f]/70 rounded-full" />

          {/* Devices */}
          <Node left="15%" type="laptop" label="You" ip="192.168.1.10" />
          <Node left="50%" type="router" label="Router" ip="192.168.1.1" />
          <Node left="85%" type="server" label="Web Server" ip="93.184.216.34" />

          {/* Request packet (neon, L→R) */}
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ left: ['15%', '50%', '85%'], opacity: [0, 1, 1, 1, 0, 0] }}
            transition={{
              left: { duration: CYCLE, times: [0.04, 0.22, 0.42], repeat: Infinity, ease: 'easeInOut' },
              opacity: { duration: CYCLE, times: [0, 0.05, 0.1, 0.38, 0.44, 1], repeat: Infinity },
            }}
            className="absolute top-[34%] -translate-x-1/2 px-2 py-0.5 rounded-full bg-[#9fef00] text-[#0d1117] text-[9px] font-black shadow-lg shadow-[#9fef00]/30"
            style={{ fontFamily: MONO }}
          >
            GET /
          </motion.span>

          {/* Response packet (green, R→L) */}
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ left: ['85%', '50%', '15%'], opacity: [0, 0, 1, 1, 1, 0] }}
            transition={{
              left: { duration: CYCLE, times: [0.55, 0.73, 0.92], repeat: Infinity, ease: 'easeInOut' },
              opacity: { duration: CYCLE, times: [0, 0.54, 0.59, 0.88, 0.94, 1], repeat: Infinity },
            }}
            className="absolute top-[34%] -translate-x-1/2 px-2 py-0.5 rounded-full bg-[#00a859] text-white text-[9px] font-black shadow-lg shadow-[#00a859]/30"
            style={{ fontFamily: MONO }}
          >
            200 OK
          </motion.span>

          {/* NAT annotation above the router */}
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0, 1, 1, 0, 0], y: [4, 4, 0, 0, 4, 4] }}
            transition={{ duration: CYCLE, times: [0, 0.18, 0.24, 0.36, 0.42, 1], repeat: Infinity }}
            className="absolute left-1/2 top-[13%] -translate-x-1/2 px-2 py-0.5 rounded border border-[#00a859]/40 bg-[#0f1f15] text-[#00a859] text-[8.5px] font-bold whitespace-nowrap"
            style={{ fontFamily: MONO }}
          >
            NAT → 203.0.113.5
          </motion.span>
        </div>
      </div>

      {/* ── Floating terminal card — click to open the interactive shell ── */}
      <button
        ref={termBtnRef}
        type="button"
        onClick={openTerminal}
        className={`group absolute -bottom-2 -left-2 sm:-left-8 w-[230px] text-left rounded-xl border border-[#263248] bg-[#080c14] shadow-2xl shadow-black/50 overflow-hidden cursor-pointer transition-all hover:border-[#9fef00]/50 hover:shadow-[0_0_24px_rgba(159,239,0,0.18)] hover:-translate-y-0.5 ${terminalOpen ? 'invisible' : ''}`}
      >
        <div className="flex items-center gap-1.5 px-3 py-2 border-b border-[#151d2e] bg-[#0b1019]">
          <span className="w-2 h-2 rounded-full bg-[#2c3a54]" />
          <span className="w-2 h-2 rounded-full bg-[#2c3a54]" />
          <span className="ml-1.5 text-[9px] font-semibold text-[#4d5a73]" style={{ fontFamily: MONO }}>
            terminal
          </span>
          <span className="ml-auto inline-flex items-center gap-1 text-[8.5px] font-medium text-[#6e7a94] group-hover:text-[#9fef00] transition-colors">
            <Maximize2 size={9} /> # click me
          </span>
        </div>
        <div className="px-3.5 py-3 text-[10.5px]" style={{ fontFamily: MONO }}>
          <TermLine start={0.06}>
            <span className="text-[#00a859]">$</span> <span className="text-[#d2d7e3]">nmap -sV 192.168.1.1</span>
          </TermLine>
          <TermLine start={0.26}>
            <span className="text-[#8b98ae]">22/tcp</span> <span className="text-[#9fef00]">open</span>{' '}
            <span className="text-[#8b98ae]">ssh</span>
          </TermLine>
          <TermLine start={0.4}>
            <span className="text-[#8b98ae]">443/tcp</span> <span className="text-[#9fef00]">open</span>{' '}
            <span className="text-[#8b98ae]">https</span>
          </TermLine>
          <TermLine start={0.6}>
            <span className="text-[#9fef00]">[+]</span>{' '}
            <span className="text-[#d2d7e3]">Scan complete — 2 open ports</span>
          </TermLine>
          <p className="leading-relaxed">
            <span className="text-[#00a859]">$</span>{' '}
            <span className="inline-block w-1.5 h-3 bg-[#9fef00] align-middle animate-pulse" />
          </p>
        </div>
      </button>

      <InteractiveTerminal
        open={terminalOpen}
        anchor={anchor}
        onClose={() => setTerminalOpen(false)}
        onSurprise={() => setSurprise(true)}
      />
      <MatrixRain active={surprise} onDone={() => setSurprise(false)} />
    </div>
  );
};

export default HeroShowcase;
