import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Cpu,
  Share2,
  ListOrdered,
  Send,
  Wand2,
  ArrowUp,
  ArrowDown,
  Frame,
} from 'lucide-react';
import type {
  NetworkSimulation,
  NetworkNode,
  NetworkEdge,
  SimulationStep,
  SimulationZone,
  Packet,
  DeviceType,
} from '../network-sim/types';

interface SimulationBuilderProps {
  value: NetworkSimulation;
  onChange: (sim: NetworkSimulation) => void;
}

const DEVICE_TYPES: DeviceType[] = [
  'pc',
  'laptop',
  'server',
  'router',
  'switch',
  'firewall',
  'cloud',
  'dns-server',
  'phone',
];

const DEVICE_LABELS: Record<DeviceType, string> = {
  pc: 'PC',
  laptop: 'Laptop',
  server: 'Server',
  router: 'Router',
  switch: 'Switch',
  firewall: 'Firewall',
  cloud: 'Cloud / Internet',
  'dns-server': 'DNS Server',
  phone: 'Phone',
};

/* Semantic packet palette — color means something, not decoration */
const PACKET_COLORS = [
  { label: 'Request (Neon)', value: '#9fef00' },
  { label: 'Response (Green)', value: '#00a859' },
  { label: 'Highlight (Gold)', value: '#f3a43a' },
  { label: 'Blocked (Red)', value: '#ef4444' },
];

/* Zone tints — LAN green, neutral steel, gold for DMZ/special segments */
const ZONE_COLORS = [
  { label: 'LAN (Green)', value: '#00a859' },
  { label: 'Neutral (Steel)', value: '#62738f' },
  { label: 'DMZ (Gold)', value: '#f3a43a' },
];

let idCounter = 0;
const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${(idCounter++).toString(36)}`;

const EXAMPLE: NetworkSimulation = {
  id: uid('sim'),
  nodes: [
    { id: 'pc', type: 'pc', label: 'Your PC', x: 18, y: 35, ip: '192.168.1.10' },
    { id: 'router', type: 'router', label: 'Router', x: 50, y: 35, ip: '192.168.1.1' },
    { id: 'server', type: 'server', label: 'Web Server', x: 82, y: 35, ip: '93.184.216.34' },
  ],
  edges: [
    { id: 'e1', from: 'pc', to: 'router' },
    { id: 'e2', from: 'router', to: 'server' },
  ],
  steps: [
    {
      title: 'Request leaves the PC',
      description: 'Your PC sends a request toward the web server through the router.',
      packets: [{ from: 'pc', to: 'router', label: 'GET /', color: '#9fef00' }],
      highlights: ['pc', 'router'],
    },
    {
      title: 'Router forwards to the server',
      description: 'The router forwards the request out to the internet-facing server.',
      packets: [{ from: 'router', to: 'server', label: 'GET /', color: '#9fef00' }],
      highlights: ['router', 'server'],
    },
  ],
  zones: [
    { id: 'z-lan', label: 'Local Network', sublabel: '192.168.1.0/24', x: 4, y: 8, w: 60, h: 84, color: '#00a859' },
    { id: 'z-wan', label: 'Internet', x: 68, y: 8, w: 28, h: 84, color: '#62738f' },
  ],
};

/* ── Small field helpers ── */
const inputCls =
  'w-full bg-[#0d1117] border border-[#1e2a3d] rounded px-2.5 py-1.5 text-xs text-[#d2d7e3] focus:outline-none focus:border-[#00a859]/50 transition-colors placeholder:text-[#3d4a63]';
const labelCls = 'block text-[10px] font-semibold text-[#6e7a94] mb-1 uppercase tracking-wide';

const Section: React.FC<{
  icon: React.ElementType;
  title: string;
  count: number;
  color: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}> = ({ icon: Icon, title, count, color, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-[#263248] bg-[#0b1019] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#101826] transition-colors"
      >
        <span
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }}
        >
          <Icon size={15} style={{ color }} />
        </span>
        <span className="flex-1 text-left">
          <span className="block text-sm font-bold text-[#f3f6ff]">{title}</span>
        </span>
        <span className="text-[11px] font-semibold text-[#6e7a94]">{count}</span>
        {open ? (
          <ChevronDown size={15} className="text-[#6e7a94]" />
        ) : (
          <ChevronRight size={15} className="text-[#6e7a94]" />
        )}
      </button>
      {open && <div className="px-4 pb-4 space-y-3">{children}</div>}
    </div>
  );
};

const SimulationBuilder: React.FC<SimulationBuilderProps> = ({ value, onChange }) => {
  const { nodes, edges, steps } = value;

  const update = (patch: Partial<NetworkSimulation>) => onChange({ ...value, ...patch });

  /* ── Nodes ── */
  const addNode = () => {
    const n = nodes.length;
    const node: NetworkNode = {
      id: uid('n'),
      type: 'pc',
      label: `Device ${n + 1}`,
      x: 20 + (n % 4) * 20,
      y: 30 + Math.floor(n / 4) * 30,
    };
    update({ nodes: [...nodes, node] });
  };
  const updateNode = (id: string, patch: Partial<NetworkNode>) =>
    update({ nodes: nodes.map((nd) => (nd.id === id ? { ...nd, ...patch } : nd)) });
  const removeNode = (id: string) =>
    update({
      nodes: nodes.filter((nd) => nd.id !== id),
      edges: edges.filter((e) => e.from !== id && e.to !== id),
      steps: steps.map((s) => ({
        ...s,
        packets: s.packets.filter((p) => p.from !== id && p.to !== id),
        highlights: (s.highlights ?? []).filter((h) => h !== id),
      })),
    });

  /* ── Edges ── */
  const addEdge = () => {
    const edge: NetworkEdge = {
      id: uid('e'),
      from: nodes[0]?.id ?? '',
      to: nodes[1]?.id ?? '',
    };
    update({ edges: [...edges, edge] });
  };
  const updateEdge = (id: string, patch: Partial<NetworkEdge>) =>
    update({ edges: edges.map((e) => (e.id === id ? { ...e, ...patch } : e)) });
  const removeEdge = (id: string) => update({ edges: edges.filter((e) => e.id !== id) });

  /* ── Zones ── */
  const zones = value.zones ?? [];
  const addZone = () =>
    update({
      zones: [
        ...zones,
        {
          id: uid('z'),
          label: `Zone ${zones.length + 1}`,
          sublabel: '',
          x: 5,
          y: 10,
          w: 40,
          h: 80,
          color: '#00a859',
        },
      ],
    });
  const updateZone = (id: string, patch: Partial<SimulationZone>) =>
    update({ zones: zones.map((z) => (z.id === id ? { ...z, ...patch } : z)) });
  const removeZone = (id: string) => update({ zones: zones.filter((z) => z.id !== id) });

  /* ── Steps ── */
  const addStep = () => {
    const step: SimulationStep = {
      title: `Step ${steps.length + 1}`,
      description: '',
      packets: [],
      highlights: [],
    };
    update({ steps: [...steps, step] });
  };
  const updateStep = (idx: number, patch: Partial<SimulationStep>) =>
    update({ steps: steps.map((s, i) => (i === idx ? { ...s, ...patch } : s)) });
  const removeStep = (idx: number) => update({ steps: steps.filter((_, i) => i !== idx) });
  const moveStep = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= steps.length) return;
    const next = [...steps];
    [next[idx], next[target]] = [next[target], next[idx]];
    update({ steps: next });
  };

  const toggleHighlight = (idx: number, nodeId: string) => {
    const cur = steps[idx].highlights ?? [];
    const next = cur.includes(nodeId) ? cur.filter((h) => h !== nodeId) : [...cur, nodeId];
    updateStep(idx, { highlights: next });
  };

  const addPacket = (idx: number) => {
    const pkt: Packet = {
      from: nodes[0]?.id ?? '',
      to: nodes[1]?.id ?? '',
      label: 'Packet',
      color: '#9fef00',
    };
    updateStep(idx, { packets: [...steps[idx].packets, pkt] });
  };
  const updatePacket = (idx: number, pIdx: number, patch: Partial<Packet>) =>
    updateStep(idx, {
      packets: steps[idx].packets.map((p, i) => (i === pIdx ? { ...p, ...patch } : p)),
    });
  const removePacket = (idx: number, pIdx: number) =>
    updateStep(idx, { packets: steps[idx].packets.filter((_, i) => i !== pIdx) });

  return (
    <div className="space-y-4" dir="ltr">
      {/* Empty-state helper */}
      {nodes.length === 0 && (
        <button
          type="button"
          onClick={() => onChange({ ...EXAMPLE, id: value.id || EXAMPLE.id })}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-[#9fef00] bg-[#9fef00]/8 border border-dashed border-[#9fef00]/30 hover:bg-[#9fef00]/12 transition-all"
        >
          <Wand2 size={15} /> Load a starter topology
        </button>
      )}

      {/* ── Devices ── */}
      <Section icon={Cpu} title="Devices" count={nodes.length} color="#60a5fa">
        {nodes.map((node) => (
          <div key={node.id} className="rounded-lg border border-[#263248] bg-[#0a0f18] p-3">
            <div className="flex items-center gap-2 mb-2.5">
              <input
                value={node.label}
                onChange={(e) => updateNode(node.id, { label: e.target.value })}
                placeholder="Label"
                className={`${inputCls} font-semibold`}
              />
              <button
                type="button"
                onClick={() => removeNode(node.id)}
                className="w-7 h-7 flex items-center justify-center rounded text-[#4d5a73] hover:text-red-400 hover:bg-red-500/10 transition-all flex-shrink-0"
              >
                <Trash2 size={13} />
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <label className={labelCls}>Type</label>
                <select
                  value={node.type}
                  onChange={(e) => updateNode(node.id, { type: e.target.value as DeviceType })}
                  className={inputCls}
                >
                  {DEVICE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {DEVICE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>IP (optional)</label>
                <input
                  value={node.ip ?? ''}
                  onChange={(e) => updateNode(node.id, { ip: e.target.value || undefined })}
                  placeholder="10.0.0.1"
                  className={`${inputCls} font-mono`}
                />
              </div>
              <div>
                <label className={labelCls}>X (0–100)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={node.x}
                  onChange={(e) => updateNode(node.id, { x: Number(e.target.value) })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Y (0–100)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={node.y}
                  onChange={(e) => updateNode(node.id, { y: Number(e.target.value) })}
                  className={inputCls}
                />
              </div>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={addNode}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-[#6e7a94] bg-[#0d1420] border border-dashed border-[#263248] hover:border-[#60a5fa]/40 hover:text-[#60a5fa] transition-all"
        >
          <Plus size={13} /> Add Device
        </button>
      </Section>

      {/* ── Zones ── */}
      <Section icon={Frame} title="Network Zones" count={zones.length} color="#f3a43a" defaultOpen={zones.length > 0}>
        <p className="text-[11px] text-[#6e7a94] -mt-1">
          Labeled boundary regions (LAN, DMZ, Internet) drawn behind the devices — they make the topology
          read like a real network diagram.
        </p>
        {zones.map((zone) => (
          <div key={zone.id} className="rounded-lg border border-[#263248] bg-[#0a0f18] p-3 space-y-2">
            <div className="flex items-end gap-2">
              <div className="flex-1 min-w-0">
                <label className={labelCls}>Label</label>
                <input
                  value={zone.label}
                  onChange={(e) => updateZone(zone.id, { label: e.target.value })}
                  placeholder="Home Network"
                  className={inputCls}
                />
              </div>
              <div className="flex-1 min-w-0">
                <label className={labelCls}>Sublabel (CIDR)</label>
                <input
                  value={zone.sublabel ?? ''}
                  onChange={(e) => updateZone(zone.id, { sublabel: e.target.value || undefined })}
                  placeholder="192.168.1.0/24"
                  className={`${inputCls} font-mono`}
                />
              </div>
              <div className="w-32 flex-shrink-0">
                <label className={labelCls}>Tint</label>
                <select
                  value={zone.color ?? '#62738f'}
                  onChange={(e) => updateZone(zone.id, { color: e.target.value })}
                  className={inputCls}
                >
                  {ZONE_COLORS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={() => removeZone(zone.id)}
                className="mb-0.5 w-7 h-7 flex items-center justify-center rounded text-[#4d5a73] hover:text-red-400 hover:bg-red-500/10 transition-all flex-shrink-0"
              >
                <Trash2 size={13} />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {(
                [
                  ['X', 'x'],
                  ['Y', 'y'],
                  ['Width', 'w'],
                  ['Height', 'h'],
                ] as const
              ).map(([label, key]) => (
                <div key={key}>
                  <label className={labelCls}>{label} (0–100)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={zone[key]}
                    onChange={(e) => updateZone(zone.id, { [key]: Number(e.target.value) } as Partial<SimulationZone>)}
                    className={inputCls}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={addZone}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-[#6e7a94] bg-[#0d1420] border border-dashed border-[#263248] hover:border-[#f3a43a]/40 hover:text-[#f3a43a] transition-all"
        >
          <Plus size={13} /> Add Zone
        </button>
      </Section>

      {/* ── Connections ── */}
      <Section icon={Share2} title="Connections" count={edges.length} color="#9fef00">
        {nodes.length < 2 ? (
          <p className="text-xs text-[#6e7a94] italic">Add at least two devices to connect them.</p>
        ) : (
          <>
            {edges.map((edge) => (
              <div key={edge.id} className="rounded-lg border border-[#263248] bg-[#0a0f18] p-3">
                <div className="flex items-end gap-2">
                  <div className="flex-1 min-w-0">
                    <label className={labelCls}>From</label>
                    <select
                      value={edge.from}
                      onChange={(e) => updateEdge(edge.id, { from: e.target.value })}
                      className={inputCls}
                    >
                      {nodes.map((n) => (
                        <option key={n.id} value={n.id}>
                          {n.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <span className="flex-shrink-0 pb-2 text-sm text-[#4d5a73]">→</span>

                  <div className="flex-1 min-w-0">
                    <label className={labelCls}>To</label>
                    <select
                      value={edge.to}
                      onChange={(e) => updateEdge(edge.id, { to: e.target.value })}
                      className={inputCls}
                    >
                      {nodes.map((n) => (
                        <option key={n.id} value={n.id}>
                          {n.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-24 flex-shrink-0">
                    <label className={labelCls}>Style</label>
                    <select
                      value={edge.style ?? 'solid'}
                      onChange={(e) => updateEdge(edge.id, { style: e.target.value as 'solid' | 'dashed' })}
                      className={inputCls}
                    >
                      <option value="solid">Solid</option>
                      <option value="dashed">Dashed</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeEdge(edge.id)}
                    className="mb-0.5 w-7 h-7 flex items-center justify-center rounded text-[#4d5a73] hover:text-red-400 hover:bg-red-500/10 transition-all flex-shrink-0"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addEdge}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-[#6e7a94] bg-[#0d1420] border border-dashed border-[#263248] hover:border-[#9fef00]/40 hover:text-[#9fef00] transition-all"
            >
              <Plus size={13} /> Add Connection
            </button>
          </>
        )}
      </Section>

      {/* ── Steps ── */}
      <Section icon={ListOrdered} title="Animation Steps" count={steps.length} color="#00a859">
        {steps.map((step, idx) => (
          <div key={idx} className="rounded-lg border border-[#263248] bg-[#0a0f18] p-3">
            <div className="flex items-center gap-2 mb-2.5">
              <span className="w-6 h-6 rounded-md bg-[#00a859]/10 border border-[#00a859]/20 text-[#00a859] text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                {idx + 1}
              </span>
              <input
                value={step.title}
                onChange={(e) => updateStep(idx, { title: e.target.value })}
                placeholder="Step title"
                className={`${inputCls} font-semibold`}
              />
              <div className="flex items-center flex-shrink-0">
                <button
                  type="button"
                  onClick={() => moveStep(idx, -1)}
                  disabled={idx === 0}
                  className="w-7 h-7 flex items-center justify-center rounded text-[#4d5a73] hover:text-[#d2d7e3] disabled:opacity-20 transition-colors"
                >
                  <ArrowUp size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => moveStep(idx, 1)}
                  disabled={idx === steps.length - 1}
                  className="w-7 h-7 flex items-center justify-center rounded text-[#4d5a73] hover:text-[#d2d7e3] disabled:opacity-20 transition-colors"
                >
                  <ArrowDown size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => removeStep(idx)}
                  className="w-7 h-7 flex items-center justify-center rounded text-[#4d5a73] hover:text-red-400 hover:bg-red-500/10 transition-all"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            <textarea
              value={step.description}
              onChange={(e) => updateStep(idx, { description: e.target.value })}
              placeholder="What happens in this step?"
              className={`${inputCls} min-h-[48px] resize-y mb-2.5`}
            />

            {/* Highlights */}
            {nodes.length > 0 && (
              <div className="mb-2.5">
                <label className={labelCls}>Highlight devices</label>
                <div className="flex flex-wrap gap-1.5">
                  {nodes.map((n) => {
                    const on = (step.highlights ?? []).includes(n.id);
                    return (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => toggleHighlight(idx, n.id)}
                        className={`px-2 py-1 rounded text-[10px] font-semibold transition-all ${
                          on
                            ? 'bg-[#00a859]/15 border border-[#00a859]/40 text-[#00a859]'
                            : 'bg-[#0d1117] border border-[#263248] text-[#6e7a94] hover:text-[#d2d7e3]'
                        }`}
                      >
                        {n.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Packets */}
            <div>
              <label className={labelCls}>Packets</label>
              <div className="space-y-2">
                {step.packets.map((pkt, pIdx) => (
                  <div
                    key={pIdx}
                    className="rounded-lg border border-[#1e2a3d] bg-[#0d1117] p-2 space-y-2"
                  >
                    {/* From → To */}
                    <div className="flex items-center gap-2">
                      <Send size={12} className="text-[#4d5a73] flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <select
                          value={pkt.from}
                          onChange={(e) => updatePacket(idx, pIdx, { from: e.target.value })}
                          className={inputCls}
                        >
                          {nodes.map((n) => (
                            <option key={n.id} value={n.id}>
                              {n.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <span className="text-[#4d5a73] flex-shrink-0 text-xs">→</span>
                      <div className="flex-1 min-w-0">
                        <select
                          value={pkt.to}
                          onChange={(e) => updatePacket(idx, pIdx, { to: e.target.value })}
                          className={inputCls}
                        >
                          {nodes.map((n) => (
                            <option key={n.id} value={n.id}>
                              {n.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={() => removePacket(idx, pIdx)}
                        className="w-7 h-7 flex items-center justify-center rounded text-[#4d5a73] hover:text-red-400 hover:bg-red-500/10 transition-all flex-shrink-0"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                    {/* Label + colour */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <input
                          value={pkt.label}
                          onChange={(e) => updatePacket(idx, pIdx, { label: e.target.value })}
                          placeholder="Label (e.g. GET /)"
                          className={inputCls}
                        />
                      </div>
                      <span
                        className="w-5 h-5 rounded-md flex-shrink-0 border border-[#263248]"
                        style={{ backgroundColor: pkt.color ?? '#00a859' }}
                      />
                      <div className="w-28 flex-shrink-0">
                        <select
                          value={pkt.color ?? '#00a859'}
                          onChange={(e) => updatePacket(idx, pIdx, { color: e.target.value })}
                          className={inputCls}
                        >
                          {PACKET_COLORS.map((c) => (
                            <option key={c.value} value={c.value}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
                {nodes.length >= 1 && (
                  <button
                    type="button"
                    onClick={() => addPacket(idx)}
                    className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded text-[11px] font-medium text-[#6e7a94] bg-[#0d1420] border border-dashed border-[#263248] hover:border-[#00a859]/40 hover:text-[#00a859] transition-all"
                  >
                    <Plus size={12} /> Add Packet
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={addStep}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-[#6e7a94] bg-[#0d1420] border border-dashed border-[#263248] hover:border-[#00a859]/40 hover:text-[#00a859] transition-all"
        >
          <Plus size={13} /> Add Step
        </button>
      </Section>
    </div>
  );
};

export default SimulationBuilder;
