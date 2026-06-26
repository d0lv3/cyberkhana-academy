import React from 'react';

interface IconProps {
  color: string;
  size?: number;
}

const darken = (hex: string, amt: number) => {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, (n >> 16) - amt);
  const g = Math.max(0, ((n >> 8) & 0xff) - amt);
  const b = Math.max(0, (n & 0xff) - amt);
  return `rgb(${r},${g},${b})`;
};

const lighten = (hex: string, amt: number) => {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, (n >> 16) + amt);
  const g = Math.min(255, ((n >> 8) & 0xff) + amt);
  const b = Math.min(255, (n & 0xff) + amt);
  return `rgb(${r},${g},${b})`;
};

export const FundamentalsIcon: React.FC<IconProps> = ({ color, size = 80 }) => (
  <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="fund-top" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor={lighten(color, 60)} />
        <stop offset="100%" stopColor={color} />
      </linearGradient>
      <linearGradient id="fund-left" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={color} />
        <stop offset="100%" stopColor={darken(color, 80)} />
      </linearGradient>
      <linearGradient id="fund-right" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={darken(color, 30)} />
        <stop offset="100%" stopColor={darken(color, 100)} />
      </linearGradient>
      <filter id="fund-glow">
        <feGaussianBlur stdDeviation="4" result="blur" />
        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>
    {/* Base glow */}
    <ellipse cx="60" cy="105" rx="38" ry="8" fill={color} opacity="0.15" filter="url(#fund-glow)" />

    {/* Left pillar */}
    <g transform="translate(15, 30)">
      {/* top face */}
      <polygon points="14,0 28,8 14,16 0,8" fill="url(#fund-top)" opacity="0.9" />
      {/* left face */}
      <polygon points="0,8 14,16 14,56 0,48" fill="url(#fund-left)" opacity="0.85" />
      {/* right face */}
      <polygon points="28,8 14,16 14,56 28,48" fill="url(#fund-right)" opacity="0.75" />
    </g>

    {/* Center pillar (tallest) */}
    <g transform="translate(46, 14)">
      <polygon points="14,0 28,8 14,16 0,8" fill="url(#fund-top)" />
      <polygon points="0,8 14,16 14,72 0,64" fill="url(#fund-left)" />
      <polygon points="28,8 14,16 14,72 28,64" fill="url(#fund-right)" />
      {/* highlight line */}
      <line x1="14" y1="16" x2="14" y2="72" stroke={lighten(color, 80)} strokeWidth="0.5" opacity="0.5" />
    </g>

    {/* Right pillar */}
    <g transform="translate(77, 24)">
      <polygon points="14,0 28,8 14,16 0,8" fill="url(#fund-top)" opacity="0.9" />
      <polygon points="0,8 14,16 14,62 0,54" fill="url(#fund-left)" opacity="0.85" />
      <polygon points="28,8 14,16 14,62 28,54" fill="url(#fund-right)" opacity="0.75" />
    </g>

    {/* Floating particles */}
    <circle cx="30" cy="20" r="1.5" fill={lighten(color, 80)} opacity="0.6">
      <animate attributeName="cy" values="20;16;20" dur="3s" repeatCount="indefinite" />
    </circle>
    <circle cx="90" cy="18" r="1" fill={lighten(color, 60)} opacity="0.5">
      <animate attributeName="cy" values="18;14;18" dur="2.5s" repeatCount="indefinite" />
    </circle>
    <circle cx="60" cy="8" r="1.2" fill={lighten(color, 90)} opacity="0.7">
      <animate attributeName="cy" values="8;4;8" dur="3.5s" repeatCount="indefinite" />
    </circle>
  </svg>
);

export const ModulesIcon: React.FC<IconProps> = ({ color, size = 80 }) => (
  <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="mod-top" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor={lighten(color, 60)} />
        <stop offset="100%" stopColor={color} />
      </linearGradient>
      <linearGradient id="mod-left" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={color} />
        <stop offset="100%" stopColor={darken(color, 70)} />
      </linearGradient>
      <linearGradient id="mod-right" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={darken(color, 20)} />
        <stop offset="100%" stopColor={darken(color, 90)} />
      </linearGradient>
      <filter id="mod-glow">
        <feGaussianBlur stdDeviation="4" result="blur" />
        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>
    <ellipse cx="60" cy="108" rx="35" ry="7" fill={color} opacity="0.12" filter="url(#mod-glow)" />

    {/* Bottom layer */}
    <g transform="translate(18, 58)" opacity="0.7">
      <polygon points="42,0 84,22 42,44 0,22" fill="url(#mod-top)" />
      <polygon points="0,22 42,44 42,58 0,36" fill="url(#mod-left)" />
      <polygon points="84,22 42,44 42,58 84,36" fill="url(#mod-right)" />
    </g>

    {/* Middle layer */}
    <g transform="translate(18, 38)" opacity="0.85">
      <polygon points="42,0 84,22 42,44 0,22" fill="url(#mod-top)" />
      <polygon points="0,22 42,44 42,58 0,36" fill="url(#mod-left)" />
      <polygon points="84,22 42,44 42,58 84,36" fill="url(#mod-right)" />
      <line x1="42" y1="44" x2="42" y2="58" stroke={lighten(color, 80)} strokeWidth="0.5" opacity="0.4" />
    </g>

    {/* Top layer */}
    <g transform="translate(18, 18)">
      <polygon points="42,0 84,22 42,44 0,22" fill="url(#mod-top)" />
      <polygon points="0,22 42,44 42,58 0,36" fill="url(#mod-left)" />
      <polygon points="84,22 42,44 42,58 84,36" fill="url(#mod-right)" />
      <line x1="42" y1="44" x2="42" y2="58" stroke={lighten(color, 80)} strokeWidth="0.5" opacity="0.5" />
      {/* top face accent lines */}
      <line x1="42" y1="10" x2="42" y2="34" stroke={lighten(color, 90)} strokeWidth="0.4" opacity="0.3" />
    </g>

    {/* Floating sparkles */}
    <circle cx="95" cy="30" r="1.3" fill={lighten(color, 80)} opacity="0.6">
      <animate attributeName="opacity" values="0.6;0.2;0.6" dur="2s" repeatCount="indefinite" />
    </circle>
    <circle cx="22" cy="42" r="1" fill={lighten(color, 60)} opacity="0.5">
      <animate attributeName="opacity" values="0.5;0.1;0.5" dur="2.8s" repeatCount="indefinite" />
    </circle>
    <circle cx="80" cy="15" r="1.5" fill={lighten(color, 90)} opacity="0.4">
      <animate attributeName="cy" values="15;11;15" dur="3s" repeatCount="indefinite" />
    </circle>
  </svg>
);

export const PathsIcon: React.FC<IconProps> = ({ color, size = 80 }) => {
  const steps = [
    { x: 8,  y: 72, w: 30, h: 10, d: 16 },
    { x: 28, y: 56, w: 30, h: 10, d: 16 },
    { x: 48, y: 40, w: 30, h: 10, d: 16 },
    { x: 68, y: 24, w: 30, h: 10, d: 16 },
  ];

  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="path-top" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={lighten(color, 50)} />
          <stop offset="100%" stopColor={color} />
        </linearGradient>
        <linearGradient id="path-front" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={darken(color, 20)} />
          <stop offset="100%" stopColor={darken(color, 90)} />
        </linearGradient>
        <linearGradient id="path-side" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={darken(color, 40)} />
          <stop offset="100%" stopColor={darken(color, 110)} />
        </linearGradient>
        <filter id="path-glow">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="path-node-glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Ground shadow */}
      <ellipse cx="60" cy="108" rx="40" ry="8" fill={color} opacity="0.12" filter="url(#path-glow)" />

      {/* Isometric staircase — bottom to top */}
      {steps.map((s, i) => {
        const hw = s.w / 2;
        const hh = s.h / 2;
        const topY = s.y;
        const op = 0.6 + i * 0.13;
        return (
          <g key={i} opacity={op}>
            {/* Top face (isometric diamond) */}
            <polygon
              points={`${s.x + hw},${topY - hh} ${s.x + s.w},${topY} ${s.x + hw},${topY + hh} ${s.x},${topY}`}
              fill="url(#path-top)"
            />
            {/* Front face */}
            <polygon
              points={`${s.x},${topY} ${s.x + hw},${topY + hh} ${s.x + hw},${topY + hh + s.d} ${s.x},${topY + s.d}`}
              fill="url(#path-front)"
            />
            {/* Right face */}
            <polygon
              points={`${s.x + hw},${topY + hh} ${s.x + s.w},${topY} ${s.x + s.w},${topY + s.d} ${s.x + hw},${topY + hh + s.d}`}
              fill="url(#path-side)"
            />
          </g>
        );
      })}

      {/* Connection lines between step centers */}
      {steps.slice(0, -1).map((s, i) => {
        const n = steps[i + 1];
        const cx1 = s.x + s.w / 2;
        const cy1 = s.y;
        const cx2 = n.x + n.w / 2;
        const cy2 = n.y;
        return (
          <line
            key={`line-${i}`}
            x1={cx1} y1={cy1} x2={cx2} y2={cy2}
            stroke={lighten(color, 60)}
            strokeWidth="1.2"
            strokeDasharray="3 4"
            opacity="0.4"
          />
        );
      })}

      {/* Glowing nodes on each step */}
      {steps.map((s, i) => (
        <g key={`node-${i}`}>
          <circle
            cx={s.x + s.w / 2} cy={s.y}
            r={i === steps.length - 1 ? 5 : 3.5}
            fill={i === steps.length - 1 ? lighten(color, 70) : color}
            opacity="0.9"
            filter="url(#path-node-glow)"
          />
          {i === steps.length - 1 && (
            <circle cx={s.x + s.w / 2} cy={s.y} r="7" fill={lighten(color, 80)} opacity="0.25">
              <animate attributeName="r" values="7;10;7" dur="2.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.25;0.08;0.25" dur="2.5s" repeatCount="indefinite" />
            </circle>
          )}
        </g>
      ))}

      {/* Summit flag on the top step */}
      <g transform={`translate(${steps[3].x + steps[3].w / 2 + 6}, ${steps[3].y - 28})`}>
        <line x1="0" y1="4" x2="0" y2="26" stroke={lighten(color, 50)} strokeWidth="1.5" />
        <polygon points="0,4 14,8.5 0,13" fill={color} opacity="0.9">
          <animate attributeName="opacity" values="0.9;0.55;0.9" dur="2.5s" repeatCount="indefinite" />
        </polygon>
        <circle cx="0" cy="4" r="1.5" fill={lighten(color, 90)} />
      </g>

      {/* Travelling energy pulse climbing the stairs */}
      <circle r="2.5" fill={lighten(color, 80)} opacity="0.8" filter="url(#path-node-glow)">
        <animateMotion
          path={`M${steps[0].x + steps[0].w / 2},${steps[0].y} L${steps[1].x + steps[1].w / 2},${steps[1].y} L${steps[2].x + steps[2].w / 2},${steps[2].y} L${steps[3].x + steps[3].w / 2},${steps[3].y}`}
          dur="3s"
          repeatCount="indefinite"
        />
      </circle>

      {/* Floating particles */}
      <circle cx="18" cy="60" r="1.2" fill={lighten(color, 70)} opacity="0.5">
        <animate attributeName="cy" values="60;56;60" dur="3s" repeatCount="indefinite" />
      </circle>
      <circle cx="100" cy="20" r="1" fill={lighten(color, 80)} opacity="0.6">
        <animate attributeName="opacity" values="0.6;0.2;0.6" dur="2.2s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
};
