import React from 'react';
import { DeviceType } from './types';

/**
 * Network device icons — one geometry system, monochrome by design.
 *
 * Rules (applied to every icon):
 *   · outer silhouettes: 2px stroke, corner radius 2.5, filled chassis
 *   · interior detail:   1.4px stroke at 70% opacity (wells use a darker fill)
 *   · color is STATE, not identity: steel when idle, brand green when active
 *
 * Identity comes from silhouette shape — like a real topology diagram —
 * instead of giving every device its own hue.
 */

/* ── State palette ── */
const IDLE = {
  ink: '#62738f',      // strokes & details
  fill: '#19233a',     // chassis fill
  well: '#0b1322',     // screens / ports / slots
};
const ACTIVE = {
  ink: '#00a859',
  fill: '#102b20',
  well: '#081710',
};

type Palette = typeof IDLE;

/* ── Icons (48×48) ── */

const PcIcon: React.FC<{ p: Palette }> = ({ p }) => (
  <>
    {/* monitor */}
    <rect x="6" y="7" width="36" height="24" rx="2.5" fill={p.fill} stroke={p.ink} strokeWidth="2" />
    <rect x="9.5" y="10.5" width="29" height="17" rx="1.5" fill={p.well} />
    {/* terminal prompt */}
    <path d="M13.5 15.5 L17 18.5 L13.5 21.5" fill="none" stroke={p.ink} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
    <line x1="20" y1="21.5" x2="26" y2="21.5" stroke={p.ink} strokeWidth="1.4" strokeLinecap="round" opacity="0.7" />
    {/* stand + base */}
    <path d="M21 31 L27 31 L29 37 L19 37 Z" fill={p.fill} stroke={p.ink} strokeWidth="2" strokeLinejoin="round" />
    <line x1="15" y1="39.5" x2="33" y2="39.5" stroke={p.ink} strokeWidth="2" strokeLinecap="round" />
  </>
);

const LaptopIcon: React.FC<{ p: Palette }> = ({ p }) => (
  <>
    {/* lid */}
    <rect x="11" y="9" width="26" height="18" rx="2.5" fill={p.fill} stroke={p.ink} strokeWidth="2" />
    <rect x="14" y="12" width="20" height="12" rx="1.5" fill={p.well} />
    <path d="M17 15.5 L19.5 17.7 L17 19.9" fill="none" stroke={p.ink} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
    {/* deck */}
    <path d="M7 31 H41 L44 36 Q44 37.5 42.4 37.5 H5.6 Q4 37.5 4 36 Z" fill={p.fill} stroke={p.ink} strokeWidth="2" strokeLinejoin="round" />
    <line x1="20" y1="34.2" x2="28" y2="34.2" stroke={p.ink} strokeWidth="1.4" strokeLinecap="round" opacity="0.7" />
  </>
);

const ServerIcon: React.FC<{ p: Palette }> = ({ p }) => (
  <>
    {/* tower */}
    <rect x="14" y="5" width="20" height="38" rx="2.5" fill={p.fill} stroke={p.ink} strokeWidth="2" />
    {/* rack units */}
    {[10, 18, 26].map((y) => (
      <g key={y}>
        <rect x="17.5" y={y} width="13" height="4.5" rx="1" fill={p.well} stroke={p.ink} strokeWidth="1.4" opacity="0.7" />
        <circle cx="28" cy={y + 2.25} r="0.9" fill={p.ink} />
      </g>
    ))}
    {/* vents */}
    <line x1="18.5" y1="35" x2="29.5" y2="35" stroke={p.ink} strokeWidth="1.4" strokeLinecap="round" opacity="0.45" />
    <line x1="18.5" y1="38.5" x2="29.5" y2="38.5" stroke={p.ink} strokeWidth="1.4" strokeLinecap="round" opacity="0.45" />
  </>
);

const DnsServerIcon: React.FC<{ p: Palette }> = ({ p }) => (
  <>
    {/* tower */}
    <rect x="14" y="5" width="20" height="38" rx="2.5" fill={p.fill} stroke={p.ink} strokeWidth="2" />
    {[10, 18].map((y) => (
      <g key={y}>
        <rect x="17.5" y={y} width="13" height="4.5" rx="1" fill={p.well} stroke={p.ink} strokeWidth="1.4" opacity="0.7" />
        <circle cx="28" cy={y + 2.25} r="0.9" fill={p.ink} />
      </g>
    ))}
    {/* globe badge */}
    <circle cx="24" cy="33.5" r="5.5" fill={p.well} stroke={p.ink} strokeWidth="1.4" />
    <ellipse cx="24" cy="33.5" rx="2.3" ry="5.5" fill="none" stroke={p.ink} strokeWidth="1.4" opacity="0.7" />
    <line x1="18.7" y1="33.5" x2="29.3" y2="33.5" stroke={p.ink} strokeWidth="1.4" opacity="0.7" />
  </>
);

const PhoneIcon: React.FC<{ p: Palette }> = ({ p }) => (
  <>
    <rect x="16" y="5" width="16" height="38" rx="2.5" fill={p.fill} stroke={p.ink} strokeWidth="2" />
    <rect x="19" y="10" width="10" height="26" rx="1.5" fill={p.well} />
    <line x1="22" y1="7.5" x2="26" y2="7.5" stroke={p.ink} strokeWidth="1.4" strokeLinecap="round" opacity="0.7" />
    <line x1="22" y1="39.5" x2="26" y2="39.5" stroke={p.ink} strokeWidth="1.4" strokeLinecap="round" opacity="0.7" />
    {/* signal bars */}
    {[[21.5, 30], [24, 27.5], [26.5, 25]].map(([x, y], i) => (
      <line key={i} x1={x} y1="32" x2={x} y2={y} stroke={p.ink} strokeWidth="1.4" strokeLinecap="round" opacity="0.7" />
    ))}
  </>
);

const RouterIcon: React.FC<{ p: Palette }> = ({ p }) => (
  <>
    {/* antennas */}
    <line x1="15" y1="20" x2="12" y2="8" stroke={p.ink} strokeWidth="2" strokeLinecap="round" />
    <line x1="33" y1="20" x2="36" y2="8" stroke={p.ink} strokeWidth="2" strokeLinecap="round" />
    <circle cx="12" cy="7" r="1.6" fill={p.ink} />
    <circle cx="36" cy="7" r="1.6" fill={p.ink} />
    {/* body */}
    <rect x="7" y="20" width="34" height="16" rx="2.5" fill={p.fill} stroke={p.ink} strokeWidth="2" />
    {/* status leds */}
    {[12.5, 17, 21.5].map((x, i) => (
      <circle key={i} cx={x} cy="25" r="1.1" fill={p.ink} opacity={i === 0 ? 1 : 0.5} />
    ))}
    {/* ports */}
    {[12, 18.5, 25, 31.5].map((x, i) => (
      <rect key={i} x={x} y="29" width="4.5" height="3.5" rx="0.8" fill={p.well} stroke={p.ink} strokeWidth="1.4" opacity="0.7" />
    ))}
  </>
);

const SwitchIcon: React.FC<{ p: Palette }> = ({ p }) => (
  <>
    {/* 1U chassis */}
    <rect x="5" y="16" width="38" height="16" rx="2.5" fill={p.fill} stroke={p.ink} strokeWidth="2" />
    {/* leds */}
    {[10, 14.5, 19, 23.5, 28, 32.5].map((x, i) => (
      <circle key={i} cx={x} cy="20.5" r="1" fill={p.ink} opacity={i % 2 === 0 ? 0.9 : 0.4} />
    ))}
    {/* ports */}
    {[8.5, 14, 19.5, 25, 30.5, 36].map((x, i) => (
      <rect key={i} x={x} y="24.5" width="4" height="4" rx="0.8" fill={p.well} stroke={p.ink} strokeWidth="1.4" opacity="0.7" />
    ))}
  </>
);

const FirewallIcon: React.FC<{ p: Palette }> = ({ p }) => (
  <>
    {/* wall */}
    <rect x="7" y="11" width="34" height="26" rx="2.5" fill={p.fill} stroke={p.ink} strokeWidth="2" />
    {/* courses */}
    {[17.5, 24, 30.5].map((y) => (
      <line key={y} x1="7" y1={y} x2="41" y2={y} stroke={p.ink} strokeWidth="1.4" opacity="0.6" />
    ))}
    {/* staggered verticals */}
    <line x1="18" y1="11" x2="18" y2="17.5" stroke={p.ink} strokeWidth="1.4" opacity="0.55" />
    <line x1="30" y1="11" x2="30" y2="17.5" stroke={p.ink} strokeWidth="1.4" opacity="0.55" />
    <line x1="24" y1="17.5" x2="24" y2="24" stroke={p.ink} strokeWidth="1.4" opacity="0.55" />
    <line x1="13" y1="24" x2="13" y2="30.5" stroke={p.ink} strokeWidth="1.4" opacity="0.55" />
    <line x1="35" y1="24" x2="35" y2="30.5" stroke={p.ink} strokeWidth="1.4" opacity="0.55" />
    <line x1="24" y1="30.5" x2="24" y2="37" stroke={p.ink} strokeWidth="1.4" opacity="0.55" />
  </>
);

const CloudIcon: React.FC<{ p: Palette }> = ({ p }) => (
  <>
    <path
      d="M14 33 A7.5 7.5 0 0 1 13.5 18.5 A9.6 9.6 0 0 1 31 15.5 A7.4 7.4 0 0 1 39.4 23.6 A6.4 6.4 0 0 1 37 33.3 Z"
      fill={p.fill}
      stroke={p.ink}
      strokeWidth="2"
      strokeLinejoin="round"
    />
    {/* up / down traffic */}
    <path d="M19 28.5 V23 M16.8 25 L19 22.8 L21.2 25" fill="none" stroke={p.ink} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
    <path d="M28.5 23 V28.5 M26.3 26.5 L28.5 28.7 L30.7 26.5" fill="none" stroke={p.ink} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
  </>
);

/* ── Dispatch map ── */

const ICON_MAP: Record<DeviceType, React.FC<{ p: Palette }>> = {
  pc:          PcIcon,
  laptop:      LaptopIcon,
  server:      ServerIcon,
  router:      RouterIcon,
  switch:      SwitchIcon,
  firewall:    FirewallIcon,
  cloud:       CloudIcon,
  'dns-server':DnsServerIcon,
  phone:       PhoneIcon,
};

/* ── Exported component ── */

interface DeviceIconProps {
  type: DeviceType;
  /** Pixel size of the icon (renders in a square) */
  size?: number;
  highlighted?: boolean;
  className?: string;
}

const DeviceIcon: React.FC<DeviceIconProps> = ({ type, size = 48, highlighted = false, className = '' }) => {
  const p = highlighted ? ACTIVE : IDLE;
  const IconContent = ICON_MAP[type];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {highlighted && (
        <defs>
          <filter id={`glow-${type}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feFlood floodColor="#00a859" floodOpacity="0.4" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      )}
      <g filter={highlighted ? `url(#glow-${type})` : undefined}>
        <IconContent p={p} />
      </g>
    </svg>
  );
};

export default DeviceIcon;
