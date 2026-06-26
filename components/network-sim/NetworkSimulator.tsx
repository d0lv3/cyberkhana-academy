import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { RotateCcw, Move, Maximize2, Minimize2 } from 'lucide-react';
import { NetworkSimulation } from './types';
import DeviceIcon from './DeviceIcon';
import PacketAnimation from './PacketAnimation';
import SimulationControls from './SimulationControls';

interface NetworkSimulatorProps {
  simulation: NetworkSimulation;
  /**
   * If provided, dragging a device reports its new default position (0–100).
   * The creator builder uses this to persist the default layout. When omitted,
   * devices are still draggable, but only rearrange the view locally (student mode).
   */
  onNodeMove?: (id: string, x: number, y: number) => void;
}

const VB_W = 900;
const VB_H = 520;

const MONO = "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace";
const STEEL = '#45556f';
const STUB = '#3c4d6b';

type Pt = { x: number; y: number };

/* Trim distances so routes meet the device edge, not its centre */
const H_TRIM = 60;
const V_TRIM_TOP = 62;
const V_TRIM_BOTTOM = 104; // clears the name/IP/sublabel stack

/**
 * Orthogonal route between two node centres, like a real topology diagram:
 * straight when roughly aligned, H-V-H / V-H-V elbows otherwise.
 */
function routePoints(a: { cx: number; cy: number }, b: { cx: number; cy: number }): Pt[] {
  const dx = b.cx - a.cx;
  const dy = b.cy - a.cy;

  // Nearly horizontal → straight, side-anchored
  if (Math.abs(dy) < 16) {
    const s = Math.sign(dx) || 1;
    const trim = Math.max(0, Math.min(H_TRIM, Math.abs(dx) / 2 - 6));
    return [
      { x: a.cx + s * trim, y: a.cy },
      { x: b.cx - s * trim, y: b.cy },
    ];
  }

  // Nearly vertical → straight, top/bottom-anchored
  if (Math.abs(dx) < 16) {
    const s = Math.sign(dy) || 1;
    const half = Math.abs(dy) / 2 - 6;
    const tA = Math.max(0, Math.min(s > 0 ? V_TRIM_BOTTOM : V_TRIM_TOP, half));
    const tB = Math.max(0, Math.min(s > 0 ? V_TRIM_TOP : V_TRIM_BOTTOM, half));
    return [
      { x: a.cx, y: a.cy + s * tA },
      { x: b.cx, y: b.cy - s * tB },
    ];
  }

  // Horizontal-dominant → H-V-H elbow
  if (Math.abs(dx) >= Math.abs(dy)) {
    const s = Math.sign(dx);
    const trim = Math.max(0, Math.min(H_TRIM, Math.abs(dx) / 2 - 4));
    const sx = a.cx + s * trim;
    const tx = b.cx - s * trim;
    const midX = (sx + tx) / 2;
    return [
      { x: sx, y: a.cy },
      { x: midX, y: a.cy },
      { x: midX, y: b.cy },
      { x: tx, y: b.cy },
    ];
  }

  // Vertical-dominant → V-H-V elbow
  const s = Math.sign(dy);
  const half = Math.abs(dy) / 2 - 4;
  const tA = Math.max(0, Math.min(s > 0 ? V_TRIM_BOTTOM : V_TRIM_TOP, half));
  const tB = Math.max(0, Math.min(s > 0 ? V_TRIM_TOP : V_TRIM_BOTTOM, half));
  const sy = a.cy + s * tA;
  const ty = b.cy - s * tB;
  const midY = (sy + ty) / 2;
  return [
    { x: a.cx, y: sy },
    { x: a.cx, y: midY },
    { x: b.cx, y: midY },
    { x: b.cx, y: ty },
  ];
}

/** SVG path through the waypoints with rounded elbows. */
function pathFrom(points: Pt[], radius = 10): string {
  if (points.length < 2) return '';
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  }
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const p = points[i];
    const next = points[i + 1];
    const d1 = Math.hypot(p.x - prev.x, p.y - prev.y) || 1;
    const d2 = Math.hypot(next.x - p.x, next.y - p.y) || 1;
    const r1 = Math.min(radius, d1 / 2);
    const r2 = Math.min(radius, d2 / 2);
    const inX = p.x - ((p.x - prev.x) / d1) * r1;
    const inY = p.y - ((p.y - prev.y) / d1) * r1;
    const outX = p.x + ((next.x - p.x) / d2) * r2;
    const outY = p.y + ((next.y - p.y) / d2) * r2;
    d += ` L ${inX} ${inY} Q ${p.x} ${p.y} ${outX} ${outY}`;
  }
  const last = points[points.length - 1];
  d += ` L ${last.x} ${last.y}`;
  return d;
}

/** Midpoint of the route — label chips sit on the elbow riser. */
function routeMid(points: Pt[]): Pt {
  if (points.length === 4) {
    return { x: (points[1].x + points[2].x) / 2, y: (points[1].y + points[2].y) / 2 };
  }
  const a = points[0];
  const b = points[points.length - 1];
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

/**
 * Renders a network topology with animated packet flow.
 *
 * Layout:
 *  ┌────────────────────────────┐
 *  │        SVG canvas          │
 *  │   (nodes, edges, packets)  │
 *  ├────────────────────────────┤
 *  │     Step info + controls   │
 *  └────────────────────────────┘
 */
const NetworkSimulator: React.FC<NetworkSimulatorProps> = ({ simulation, onNodeMove }) => {
  const { nodes, edges, steps } = simulation;
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPackets, setShowPackets] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, { x: number; y: number }>>({});
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const playTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const editable = !!onNodeMove;
  const step = steps[currentStep];
  const highlightSet = new Set(step?.highlights ?? []);

  /* ── Coordinate mapping (0–100 → viewBox) ── */
  const nodeXY = (id: string): { x: number; y: number } => {
    const node = nodes.find((n) => n.id === id);
    if (!node) return { x: 0, y: 0 };
    if (!editable && overrides[id]) return overrides[id];
    return { x: node.x, y: node.y };
  };
  const nodePos = (id: string): { cx: number; cy: number } => {
    const { x, y } = nodeXY(id);
    return { cx: (x / 100) * VB_W, cy: (y / 100) * VB_H };
  };

  /* ── Convert a pointer position into 0–100 node coordinates ── */
  const clientToNode = (clientX: number, clientY: number): { x: number; y: number } | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const pt = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse());
    const clamp = (v: number) => Math.max(5, Math.min(95, v));
    return { x: clamp((pt.x / VB_W) * 100), y: clamp((pt.y / VB_H) * 100) };
  };

  const startDrag = (id: string) => {
    setDraggingId(id);
  };

  /* ── Trigger packet animation when step changes ── */
  useEffect(() => {
    if (step?.packets.length) {
      setShowPackets(false);
      // Small timeout to reset AnimatePresence
      const t = setTimeout(() => setShowPackets(true), 60);
      return () => clearTimeout(t);
    } else {
      setShowPackets(false);
    }
  }, [currentStep]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Auto-play logic ── */
  useEffect(() => {
    if (!isPlaying) {
      if (playTimerRef.current) clearTimeout(playTimerRef.current);
      return;
    }
    if (currentStep >= steps.length - 1) {
      setIsPlaying(false);
      return;
    }
    // Wait for animation to finish, then advance
    const animDuration = 1800; // match packet duration + buffer
    const pauseBetween = 800;
    playTimerRef.current = setTimeout(() => {
      setCurrentStep((s) => Math.min(s + 1, steps.length - 1));
    }, animDuration + pauseBetween);
    return () => {
      if (playTimerRef.current) clearTimeout(playTimerRef.current);
    };
  }, [isPlaying, currentStep, steps.length]);

  /* ── Packet completion tracking ── */
  const pendingPackets = useRef(0);
  const onPacketStart = useCallback((count: number) => {
    pendingPackets.current = count;
    setIsAnimating(true);
  }, []);

  const onPacketComplete = useCallback(() => {
    pendingPackets.current -= 1;
    if (pendingPackets.current <= 0) {
      setIsAnimating(false);
    }
  }, []);

  useEffect(() => {
    if (showPackets && step?.packets.length) {
      onPacketStart(step.packets.length);
    }
  }, [showPackets]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Drag devices to reposition ── */
  useEffect(() => {
    if (!draggingId) return;
    const onMove = (e: PointerEvent) => {
      const p = clientToNode(e.clientX, e.clientY);
      if (!p) return;
      if (onNodeMove) onNodeMove(draggingId, Math.round(p.x), Math.round(p.y));
      else setOverrides((o) => ({ ...o, [draggingId]: p }));
    };
    const onUp = () => setDraggingId(null);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [draggingId, onNodeMove]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Keep the step index valid; reset local layout when the lesson changes ── */
  useEffect(() => {
    setCurrentStep((s) => Math.min(s, Math.max(0, steps.length - 1)));
  }, [steps.length]);

  useEffect(() => {
    setOverrides({});
    setCurrentStep(0);
  }, [simulation.id]);

  /* ── Maximise: exit on Escape, lock background scroll while open ── */
  useEffect(() => {
    if (!isMaximized) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMaximized(false);
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isMaximized]);

  const hasCustomLayout = Object.keys(overrides).length > 0;
  const resetLayout = () => setOverrides({});

  /* ── Controls ── */
  const goNext = () => {
    if (currentStep < steps.length - 1) setCurrentStep((s) => s + 1);
  };
  const goPrev = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };
  const togglePlay = () => setIsPlaying((p) => !p);
  const reset = () => {
    setIsPlaying(false);
    setCurrentStep(0);
  };

  return (
    <div
      ref={containerRef}
      className={
        isMaximized
          ? 'fixed inset-0 z-[80] flex flex-col bg-[#0d1117] p-4 sm:p-6'
          : 'flex flex-col h-full'
      }
      dir="ltr"
    >
      {/* SVG canvas */}
      <div className="flex-1 min-h-0 relative rounded-xl overflow-hidden border border-[#263248] bg-[#0a0f18]">
        {/* SVG canvas */}
        <svg
          ref={svgRef}
          className="absolute inset-0 w-full h-full"
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ touchAction: draggingId ? 'none' : undefined }}
        >
          <defs>
            {/* Dot grid — quieter than a line grid, lets the zones carry the depth */}
            <pattern id="sim-dots" width="26" height="26" patternUnits="userSpaceOnUse">
              <circle cx="1.2" cy="1.2" r="1.1" fill="#2c3a54" opacity="0.4" />
            </pattern>
            {/* Edge glow filter */}
            <filter id="edge-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Dot grid */}
          <rect width={VB_W} height={VB_H} fill="url(#sim-dots)" />

          {/* ── Network zones (LAN / Internet boundaries) ── */}
          {(simulation.zones ?? []).map((zone) => {
            const zx = (zone.x / 100) * VB_W;
            const zy = (zone.y / 100) * VB_H;
            const zw = (zone.w / 100) * VB_W;
            const zh = (zone.h / 100) * VB_H;
            const zc = zone.color || '#62738f';
            return (
              <g key={zone.id}>
                <rect x={zx} y={zy} width={zw} height={zh} rx={16} fill={zc} opacity={0.05} />
                <rect
                  x={zx}
                  y={zy}
                  width={zw}
                  height={zh}
                  rx={16}
                  fill="none"
                  stroke={zc}
                  strokeOpacity={0.32}
                  strokeWidth={1.2}
                  strokeDasharray="7 6"
                />
                <text
                  x={zx + 16}
                  y={zy + 24}
                  fill={zc}
                  opacity={0.85}
                  fontSize={12}
                  fontWeight={700}
                  fontFamily={MONO}
                  letterSpacing="2"
                >
                  {zone.label.toUpperCase()}
                </text>
                {zone.sublabel && (
                  <text x={zx + 16} y={zy + 40} fill={zc} opacity={0.5} fontSize={10.5} fontFamily={MONO}>
                    {zone.sublabel}
                  </text>
                )}
              </g>
            );
          })}

          {/* ── Edges (orthogonal routing, port-anchored) ── */}
          {edges.map((edge) => {
            const from = nodePos(edge.from);
            const to = nodePos(edge.to);
            // Is this edge active in the current step?
            const isActive = step?.packets.some(
              (p) =>
                (p.from === edge.from && p.to === edge.to) ||
                (p.from === edge.to && p.to === edge.from)
            );
            const live = isActive && showPackets;

            const pts = routePoints(from, to);
            const d = pathFrom(pts);
            const mid = routeMid(pts);
            const start = pts[0];
            const end = pts[pts.length - 1];
            const chipW = edge.label ? edge.label.length * 6.6 + 16 : 0;

            return (
              <g key={edge.id}>
                {/* Glow halo when active */}
                {live && (
                  <path
                    d={d}
                    fill="none"
                    stroke="#00a859"
                    strokeWidth={7}
                    strokeLinecap="round"
                    opacity={0.16}
                    filter="url(#edge-glow)"
                  />
                )}
                {/* Connection base */}
                <path
                  d={d}
                  fill="none"
                  stroke={live ? '#00a859' : STEEL}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeDasharray={edge.style === 'dashed' ? '7 6' : undefined}
                  opacity={live ? 0.95 : 0.8}
                  className="transition-all duration-500"
                />
                {/* Flowing pulse along active connections */}
                {live && (
                  <path d={d} fill="none" stroke="#9fef00" strokeWidth={2} strokeLinecap="round" strokeDasharray="2 12">
                    <animate attributeName="stroke-dashoffset" from="28" to="0" dur="0.7s" repeatCount="indefinite" />
                  </path>
                )}
                {/* Port stubs */}
                <rect
                  x={start.x - 3}
                  y={start.y - 3}
                  width={6}
                  height={6}
                  rx={1.2}
                  fill={live ? '#00a859' : STUB}
                  className="transition-colors duration-500"
                />
                <rect
                  x={end.x - 3}
                  y={end.y - 3}
                  width={6}
                  height={6}
                  rx={1.2}
                  fill={live ? '#00a859' : STUB}
                  className="transition-colors duration-500"
                />
                {/* Edge label chip */}
                {edge.label && (
                  <g>
                    <rect
                      x={mid.x - chipW / 2}
                      y={mid.y - 9}
                      width={chipW}
                      height={18}
                      rx={4}
                      fill="#0d1117"
                      opacity={0.92}
                      stroke={live ? '#00a859' : STEEL}
                      strokeOpacity={live ? 0.5 : 0.35}
                      strokeWidth={1}
                      className="transition-colors duration-500"
                    />
                    <text
                      x={mid.x}
                      y={mid.y + 3.5}
                      textAnchor="middle"
                      fill={live ? '#7dd3a8' : '#8b98ae'}
                      fontSize={10}
                      fontWeight={600}
                      fontFamily={MONO}
                      className="transition-colors duration-500"
                    >
                      {edge.label}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* ── Nodes ── */}
          {nodes.map((node) => {
            const pos = nodePos(node.id);
            const isHighlighted = highlightSet.has(node.id);
            const annotation = step?.annotations?.[node.id];

            // Icon stands on its own — no card / container behind it.
            const iconSize = 110;
            const iconTop = pos.cy - iconSize / 2 - 4;
            const labelY = iconTop + iconSize + 16;

            const isDragging = draggingId === node.id;

            return (
              <g
                key={node.id}
                opacity={isHighlighted || isDragging ? 1 : 0.78}
                className="transition-opacity duration-500"
              >
                {/* Device icon */}
                <foreignObject
                  x={pos.cx - iconSize / 2}
                  y={iconTop}
                  width={iconSize}
                  height={iconSize}
                  style={{ pointerEvents: 'none' }}
                >
                  <DeviceIcon type={node.type} size={iconSize} highlighted={isHighlighted} />
                </foreignObject>

                {/* Label */}
                <text
                  x={pos.cx}
                  y={labelY}
                  textAnchor="middle"
                  fill={isHighlighted ? '#f3f6ff' : '#aab4c8'}
                  fontSize={17}
                  fontWeight={700}
                  fontFamily="'Poppins', sans-serif"
                  className="transition-colors duration-300"
                >
                  {node.label}
                </text>

                {/* IP address */}
                {node.ip && (
                  <text
                    x={pos.cx}
                    y={labelY + 23}
                    textAnchor="middle"
                    fill={isHighlighted ? '#9aa7c0' : '#5f6e86'}
                    fontSize={16}
                    fontFamily={MONO}
                    fontWeight={600}
                    className="transition-colors duration-300"
                  >
                    {node.ip}
                  </text>
                )}

                {/* Sublabel */}
                {node.sublabel && (
                  <text
                    x={pos.cx}
                    y={node.ip ? labelY + 43 : labelY + 19}
                    textAnchor="middle"
                    fill="#5a6678"
                    fontSize={11}
                    fontFamily="'Poppins', sans-serif"
                  >
                    {node.sublabel}
                  </text>
                )}

                {/* Annotation badge (contextual tag above the device) */}
                {annotation && (
                  <g>
                    <rect
                      x={pos.cx - annotation.length * 3.2 - 8}
                      y={iconTop - 22}
                      width={annotation.length * 6.4 + 16}
                      height={18}
                      rx={5}
                      fill="#0f1f15"
                      stroke="#00a859"
                      strokeWidth={1}
                    />
                    <text
                      x={pos.cx}
                      y={iconTop - 9.5}
                      textAnchor="middle"
                      fill="#00a859"
                      fontSize={9}
                      fontWeight={700}
                      fontFamily={MONO}
                    >
                      {annotation}
                    </text>
                  </g>
                )}

                {/* Invisible drag handle over the device */}
                <rect
                  x={pos.cx - iconSize / 2}
                  y={iconTop}
                  width={iconSize}
                  height={iconSize}
                  fill="transparent"
                  style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    startDrag(node.id);
                  }}
                />
              </g>
            );
          })}

          {/* ── Packet animations (follow the routed connection) ── */}
          <AnimatePresence>
            {showPackets &&
              step?.packets.map((pkt, i) => {
                const pts = routePoints(nodePos(pkt.from), nodePos(pkt.to));
                return (
                  <PacketAnimation
                    key={`${currentStep}-${i}`}
                    points={pts}
                    label={pkt.label}
                    color={pkt.color || '#9fef00'}
                    sublabel={pkt.sublabel}
                    duration={1.5}
                    delay={i * 0.2}
                    onComplete={onPacketComplete}
                  />
                );
              })}
          </AnimatePresence>
        </svg>

        {/* Drag hint */}
        {nodes.length > 0 && (
          <div className="absolute bottom-2.5 left-3 flex items-center gap-1.5 text-[10px] font-medium text-[#4d5a73] pointer-events-none select-none">
            <Move size={11} /> Drag devices to rearrange
          </div>
        )}

        {/* Top-right controls */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-2">
          {/* Reset layout (student view only — creator drags persist as defaults) */}
          {!editable && hasCustomLayout && (
            <button
              type="button"
              onClick={resetLayout}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold text-[#9aa5bf] bg-[#0d1420]/90 border border-[#263248] hover:text-[#d2d7e3] hover:border-[#354562] transition-all backdrop-blur-sm"
            >
              <RotateCcw size={11} /> Reset layout
            </button>
          )}

          {/* Maximise / exit full screen */}
          <button
            type="button"
            onClick={() => setIsMaximized((m) => !m)}
            aria-label={isMaximized ? 'Exit full screen' : 'Maximise simulation'}
            title={isMaximized ? 'Exit full screen (Esc)' : 'Maximise'}
            className="flex items-center justify-center w-7 h-7 rounded-lg text-[#9aa5bf] bg-[#0d1420]/90 border border-[#263248] hover:text-[#00a859] hover:border-[#00a859]/40 transition-all backdrop-blur-sm"
          >
            {isMaximized ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="pt-4 flex-shrink-0">
        <SimulationControls
          currentStep={currentStep}
          totalSteps={steps.length}
          isAnimating={isAnimating}
          isPlaying={isPlaying}
          stepTitle={step?.title ?? ''}
          stepDescription={step?.description ?? ''}
          onPrevious={goPrev}
          onNext={goNext}
          onTogglePlay={togglePlay}
          onReset={reset}
        />
      </div>
    </div>
  );
};

export default NetworkSimulator;
