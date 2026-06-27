import React from 'react';
import { motion } from 'framer-motion';
import { Play, CheckCircle2 } from 'lucide-react';
import { useLang } from '../../contexts/LangContext';
import SectionHeading from './SectionHeading';
import DeviceIcon from '../network-sim/DeviceIcon';

const MONO = "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace";

/* ── Mockup 1: in-browser code lab ── */
const CodeLabMockup: React.FC = () => (
  <div className="relative w-full" dir="ltr">
    <div className="absolute -inset-4 bg-[#9fef00]/8 rounded-full blur-[80px]" />
    <div className="relative rounded-2xl border border-[#263248] bg-[#0b1019] shadow-2xl shadow-black/40 overflow-hidden">
      {/* chrome */}
      <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-[#1a2332] bg-[#0d1117]">
        <span className="w-2.5 h-2.5 rounded-full bg-[#2c3a54]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#2c3a54]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#2c3a54]" />
        <span className="ml-2 text-[10px] font-semibold text-[#4d5a73]" style={{ fontFamily: MONO }}>
          port_scanner.py
        </span>
        <span className="ml-auto inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded bg-[#9fef00]/10 border border-[#9fef00]/30 text-[#9fef00] font-bold">
          <Play size={9} fill="currentColor" /> RUN
        </span>
      </div>

      {/* editor */}
      <div className="px-4 py-3.5 text-[11px] leading-relaxed" style={{ fontFamily: MONO }}>
        {[
          [['import', '#c084fc'], [' socket', '#d2d7e3']],
          [['def', '#c084fc'], [' scan(', '#d2d7e3'], ['host', '#f3a43a'], ['):', '#d2d7e3']],
          [['    s = socket.socket()', '#d2d7e3']],
          [['    r = s.connect_ex((', '#d2d7e3'], ['host', '#f3a43a'], [', ', '#d2d7e3'], ['80', '#9fef00'], ['))', '#d2d7e3']],
          [['    ', '#d2d7e3'], ['return', '#c084fc'], [' r == ', '#d2d7e3'], ['0', '#9fef00']],
        ].map((line, i) => (
          <div key={i} className="flex">
            <span className="w-6 text-[#3a465c] select-none">{i + 1}</span>
            <span className="whitespace-pre">
              {line.map(([txt, color], j) => (
                <span key={j} style={{ color }}>{txt}</span>
              ))}
              {i === 4 && <span className="inline-block w-1.5 h-3.5 bg-[#9fef00] align-middle ml-0.5 animate-pulse" />}
            </span>
          </div>
        ))}
      </div>

      {/* output */}
      <div className="border-t border-[#1a2332] bg-[#080c14] px-4 py-3 text-[10.5px]" style={{ fontFamily: MONO }}>
        <p className="text-[#4d5a73] mb-1">{'>'} output</p>
        <p className="text-[#9fef00]">Port 80 is OPEN ✓</p>
        <p className="inline-flex items-center gap-1.5 text-[#2dd4bf] mt-1">
          <CheckCircle2 size={11} /> Lesson passed
        </p>
      </div>
    </div>
  </div>
);

/* ── Mockup 2: network simulation (mirrors the real HeroShowcase sim) ── */
const SIM_CYCLE = 7;

const SimNode: React.FC<{ left: string; type: 'laptop' | 'router' | 'server'; label: string; ip: string }> = ({
  left,
  type,
  label,
  ip,
}) => (
  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center" style={{ left }}>
    <DeviceIcon type={type} size={50} />
    <span className="mt-1 text-[10px] font-bold text-[#aab4c8]">{label}</span>
    <span className="text-[8.5px] text-[#5f6e86]" style={{ fontFamily: MONO }}>{ip}</span>
  </div>
);

const NetSimMockup: React.FC = () => (
  <div className="relative w-full" dir="ltr">
    <div className="absolute -inset-4 bg-[#60a5fa]/8 rounded-full blur-[80px]" />
    <div className="relative rounded-2xl border border-[#263248] bg-[#0b1019] shadow-2xl shadow-black/40 overflow-hidden">
      <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-[#1a2332] bg-[#0d1117]">
        <span className="w-2.5 h-2.5 rounded-full bg-[#2c3a54]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#2c3a54]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#2c3a54]" />
        <span className="ml-2 text-[10px] font-semibold text-[#4d5a73]" style={{ fontFamily: MONO }}>
          packet-flow.sim
        </span>
      </div>

      <div className="relative h-[240px]">
        {/* dot grid */}
        <div
          className="absolute inset-0 opacity-40"
          style={{ backgroundImage: 'radial-gradient(#2c3a54 1.1px, transparent 1.1px)', backgroundSize: '22px 22px' }}
        />

        {/* zones */}
        <div className="absolute left-[3.5%] top-[9%] bottom-[9%] w-[57%] rounded-xl border border-dashed border-[#00a859]/40 bg-[#00a859]/[0.05]">
          <span className="absolute top-2 left-3 text-[8.5px] font-bold tracking-[0.18em] text-[#00a859]/80" style={{ fontFamily: MONO }}>
            HOME NETWORK
          </span>
        </div>
        <div className="absolute right-[3.5%] top-[9%] bottom-[9%] w-[28%] rounded-xl border border-dashed border-[#62738f]/40 bg-[#62738f]/[0.05]">
          <span className="absolute top-2 left-3 text-[8.5px] font-bold tracking-[0.18em] text-[#8b98ae]/80" style={{ fontFamily: MONO }}>
            INTERNET
          </span>
        </div>

        {/* link line */}
        <div className="absolute left-[15%] right-[15%] top-1/2 h-[2px] -translate-y-1/2 bg-[#45556f]/70 rounded-full" />

        {/* devices */}
        <SimNode left="15%" type="laptop" label="You" ip="192.168.1.10" />
        <SimNode left="50%" type="router" label="Router" ip="192.168.1.1" />
        <SimNode left="85%" type="server" label="Web Server" ip="93.184.216.34" />

        {/* request packet (neon, L→R) */}
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ left: ['15%', '50%', '85%'], opacity: [0, 1, 1, 1, 0, 0] }}
          transition={{
            left: { duration: SIM_CYCLE, times: [0.04, 0.22, 0.42], repeat: Infinity, ease: 'easeInOut' },
            opacity: { duration: SIM_CYCLE, times: [0, 0.05, 0.1, 0.38, 0.44, 1], repeat: Infinity },
          }}
          className="absolute top-[34%] -translate-x-1/2 px-2 py-0.5 rounded-full bg-[#9fef00] text-[#0d1117] text-[9px] font-black shadow-lg shadow-[#9fef00]/30"
          style={{ fontFamily: MONO }}
        >
          GET /
        </motion.span>

        {/* response packet (green, R→L) */}
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ left: ['85%', '50%', '15%'], opacity: [0, 0, 1, 1, 1, 0] }}
          transition={{
            left: { duration: SIM_CYCLE, times: [0.55, 0.73, 0.92], repeat: Infinity, ease: 'easeInOut' },
            opacity: { duration: SIM_CYCLE, times: [0, 0.54, 0.59, 0.88, 0.94, 1], repeat: Infinity },
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
          transition={{ duration: SIM_CYCLE, times: [0, 0.18, 0.24, 0.36, 0.42, 1], repeat: Infinity }}
          className="absolute left-1/2 top-[13%] -translate-x-1/2 px-2 py-0.5 rounded border border-[#00a859]/40 bg-[#0f1f15] text-[#00a859] text-[8.5px] font-bold whitespace-nowrap"
          style={{ fontFamily: MONO }}
        >
          NAT → 203.0.113.5
        </motion.span>
      </div>
    </div>
  </div>
);

/* One alternating row: mockup + copy. `reverse` swaps column order on desktop. */
const PreviewRow: React.FC<{
  tag: string;
  title: string;
  desc: string;
  accent: string;
  mockup: React.ReactNode;
  reverse?: boolean;
}> = ({ tag, title, desc, accent, mockup, reverse }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className={reverse ? 'lg:order-2' : ''}
    >
      {mockup}
    </motion.div>
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.12 }}
      className={`text-start ${reverse ? 'lg:order-1' : ''}`}
    >
      <span
        className="inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider mb-4"
        style={{ color: accent, backgroundColor: `${accent}15`, border: `1px solid ${accent}33` }}
      >
        {tag}
      </span>
      <h3 className="text-2xl md:text-3xl font-bold text-[#f3f6ff] mb-4 leading-tight">{title}</h3>
      <p className="text-[#9aa5bf] text-base leading-relaxed max-w-md">{desc}</p>
    </motion.div>
  </div>
);

const ProductPreviewSection: React.FC = () => {
  const { t } = useLang();

  return (
    <section className="relative px-6 py-24 md:py-32 bg-[#0a0f18] border-y border-[#1a2332] overflow-hidden">
      <div className="relative z-10 max-w-6xl mx-auto">
        <SectionHeading heading={t('preview.heading')} subtitle={t('preview.subtitle')} />

        <div className="flex flex-col gap-20 md:gap-28 mt-16">
          <PreviewRow
            tag={t('preview.lab.tag')}
            title={t('preview.lab.title')}
            desc={t('preview.lab.desc')}
            accent="#9fef00"
            mockup={<CodeLabMockup />}
          />
          <PreviewRow
            tag={t('preview.sim.tag')}
            title={t('preview.sim.title')}
            desc={t('preview.sim.desc')}
            accent="#60a5fa"
            mockup={<NetSimMockup />}
            reverse
          />
        </div>
      </div>
    </section>
  );
};

export default ProductPreviewSection;
