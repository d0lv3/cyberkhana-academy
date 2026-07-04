/**
 * CyberNet — a tiny in-browser "LAN" that lets two terminal tabs talk to each
 * other over a simulated TCP-ish socket. It powers the netcat (`nc`) reverse /
 * bind-shell demo in the Linux course: one tab listens, another connects, and
 * the two exchange bytes — all client-side, same "secure by design" model as
 * the rest of the sandbox (no real network is ever touched).
 *
 * Transport is a same-origin BroadcastChannel; every tab hears every packet and
 * filters by destination IP + connection id. Each tab picks a stable per-tab IP
 * (kept in sessionStorage so a reload keeps it, but a new tab gets a new one).
 */

const CHANNEL = 'cyberkhana-lan';
const IP_KEY = 'cyberkhana-lan-ip';

type Packet =
  | { t: 'who'; }
  | { t: 'iam'; ip: string; host: string }
  | { t: 'syn'; id: string; srcIp: string; srcHost: string; dstIp: string; port: number }
  | { t: 'synack'; id: string; srcIp: string; srcHost: string; dstIp: string; port: number }
  | { t: 'refused'; id: string; dstIp: string }
  | { t: 'data'; id: string; to: string; data: string }
  | { t: 'fin'; id: string; to: string };

export interface Socket {
  readonly id: string;
  readonly peerIp: string;
  readonly peerHost: string;
  readonly port: number;
  send(data: string): void;
  onData(cb: (data: string) => void): void;
  onClose(cb: () => void): void;
  close(): void;
}

export interface IncomingConnection extends Socket {}

interface Listener {
  port: number;
  onConn: (socket: Socket) => void;
}

function randIp(): string {
  return `10.0.0.${Math.floor(Math.random() * 244) + 10}`;
}

function assignIp(): string {
  try {
    const existing = sessionStorage.getItem(IP_KEY);
    if (existing) return existing;
    const ip = randIp();
    sessionStorage.setItem(IP_KEY, ip);
    return ip;
  } catch {
    return randIp();
  }
}

class CyberNet {
  readonly localIp: string;
  localHost = 'cyberkhana';
  private chan: BroadcastChannel | null;
  private listeners = new Map<number, Listener>();
  private sockets = new Map<string, InternalSocket>();
  /** Known peers on the LAN (ip → host), refreshed via who/iam. */
  readonly peers = new Map<string, string>();

  constructor() {
    this.localIp = assignIp();
    let chan: BroadcastChannel | null = null;
    try {
      chan = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL) : null;
    } catch {
      chan = null;
    }
    this.chan = chan;
    if (chan) {
      chan.onmessage = (e) => this.onPacket(e.data as Packet);
      this.post({ t: 'who' });
      window.addEventListener('beforeunload', () => this.dispose());
    }
  }

  get available(): boolean {
    return this.chan !== null;
  }

  setHost(host: string) {
    this.localHost = host || this.localHost;
  }

  private post(p: Packet) {
    try { this.chan?.postMessage(p); } catch { /* channel closed */ }
  }

  private onPacket(p: Packet) {
    switch (p.t) {
      case 'who':
        this.post({ t: 'iam', ip: this.localIp, host: this.localHost });
        return;
      case 'iam':
        this.peers.set(p.ip, p.host);
        return;
      case 'syn': {
        if (p.dstIp !== this.localIp) return;
        const l = this.listeners.get(p.port);
        if (!l) { this.post({ t: 'refused', id: p.id, dstIp: p.srcIp }); return; }
        const sock = new InternalSocket(this, p.id, p.srcIp, p.srcHost, p.port);
        this.sockets.set(p.id, sock);
        this.post({ t: 'synack', id: p.id, srcIp: this.localIp, srcHost: this.localHost, dstIp: p.srcIp, port: p.port });
        l.onConn(sock);
        return;
      }
      case 'synack': {
        const sock = this.sockets.get(p.id);
        if (sock && sock.dstIp === this.localIp) sock._accept(p.srcIp, p.srcHost);
        return;
      }
      case 'refused': {
        if (p.dstIp !== this.localIp) return;
        const sock = this.sockets.get(p.id);
        sock?._refused();
        return;
      }
      case 'data': {
        if (p.to !== this.localIp) return;
        this.sockets.get(p.id)?._recv(p.data);
        return;
      }
      case 'fin': {
        if (p.to !== this.localIp) return;
        this.sockets.get(p.id)?._peerClosed();
        return;
      }
    }
  }

  /** Announce presence and ask who else is on the LAN. */
  announce() {
    this.post({ t: 'iam', ip: this.localIp, host: this.localHost });
    this.post({ t: 'who' });
  }

  listen(port: number, onConn: (socket: Socket) => void): () => void {
    this.listeners.set(port, { port, onConn });
    return () => { this.listeners.delete(port); };
  }

  /** Connect to ip:port. Resolves with a Socket, or null on refusal/timeout. */
  connect(dstIp: string, port: number, timeoutMs = 3000): Promise<Socket | null> {
    return new Promise((resolve) => {
      if (!this.chan) { resolve(null); return; }
      const id = `${this.localIp}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
      const sock = new InternalSocket(this, id, dstIp, this.peers.get(dstIp) ?? dstIp, port);
      sock.dstIp = this.localIp; // we own this side; synack targets us
      this.sockets.set(id, sock);
      let settled = false;
      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        this.sockets.delete(id);
        resolve(null);
      }, timeoutMs);
      sock._onSettled = (ok) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (!ok) this.sockets.delete(id);
        resolve(ok ? sock : null);
      };
      this.post({ t: 'syn', id, srcIp: this.localIp, srcHost: this.localHost, dstIp, port });
    });
  }

  _sendData(id: string, to: string, data: string) { this.post({ t: 'data', id, to, data }); }
  _sendFin(id: string, to: string) { this.post({ t: 'fin', id, to }); }
  _drop(id: string) { this.sockets.delete(id); }

  dispose() {
    for (const s of this.sockets.values()) s.close();
    try { this.chan?.close(); } catch { /* noop */ }
  }
}

class InternalSocket implements Socket {
  readonly id: string;
  readonly port: number;
  peerIp: string;
  peerHost: string;
  /** IP that should receive replies for this connection (the local end). */
  dstIp: string;
  private net: CyberNet;
  private dataCbs: ((d: string) => void)[] = [];
  private closeCbs: (() => void)[] = [];
  private closed = false;
  _onSettled?: (ok: boolean) => void;

  constructor(net: CyberNet, id: string, peerIp: string, peerHost: string, port: number) {
    this.net = net;
    this.id = id;
    this.port = port;
    this.peerIp = peerIp;
    this.peerHost = peerHost;
    this.dstIp = peerIp;
  }

  _accept(peerIp: string, peerHost: string) {
    this.peerIp = peerIp;
    this.peerHost = peerHost;
    this._onSettled?.(true);
  }
  _refused() { this._onSettled?.(false); }
  _recv(data: string) { for (const cb of this.dataCbs) cb(data); }
  _peerClosed() {
    if (this.closed) return;
    this.closed = true;
    for (const cb of this.closeCbs) cb();
    this.net._drop(this.id);
  }

  send(data: string) { if (!this.closed) this.net._sendData(this.id, this.peerIp, data); }
  onData(cb: (d: string) => void) { this.dataCbs.push(cb); }
  onClose(cb: () => void) { this.closeCbs.push(cb); }
  close() {
    if (this.closed) return;
    this.closed = true;
    this.net._sendFin(this.id, this.peerIp);
    this.net._drop(this.id);
  }
}

let singleton: CyberNet | null = null;
/** The one CyberNet instance for this tab (lazily created). */
export function getNet(): CyberNet {
  if (!singleton) singleton = new CyberNet();
  return singleton;
}
