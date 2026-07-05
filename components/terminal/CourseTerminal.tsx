import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { createShellSession, type ShellSession, type NetRequest } from '../code-editor/BashExecutor';
import { getNet, type Socket } from '../../services/cyberNet';
import LiquidLogoLoader from '../ui/LiquidLogoLoader';

export interface CourseTerminalHandle {
  /** Wipe the sandbox filesystem, variables, and scrollback back to the seed. */
  reset: () => void;
}

interface Line {
  kind: 'cmd' | 'out' | 'err' | 'sys';
  text: string;
  prompt?: string;
}

/** Live socket state while an `nc` connection is up. */
type NetMode =
  | { kind: 'listening'; port: number }
  | { kind: 'connecting'; port: number }
  | { kind: 'connected'; role: 'client' | 'server'; peer: string };

/** Canonical, filesystem-safe username — mirrors createShellSession's own rule. */
const canonical = (user: string) =>
  (user || 'user').trim().toLowerCase().replace(/[^a-z0-9._-]/g, '') || 'user';
const storageKey = (user: string) => `academy-shell-${canonical(user)}`;

const isIp = (s: string) => /^\d{1,3}(\.\d{1,3}){3}$/.test(s);

interface CourseTerminalProps {
  /** The learner's first name — becomes the shell username. */
  user: string;
  /** Called when the user runs `exit`. */
  onExit?: () => void;
  className?: string;
}

/**
 * An interactive, in-browser terminal backed by the sandboxed Bash session.
 * State (variables, working directory, files) persists to localStorage so it
 * survives navigation and follows the learner into a popped-out tab. It can also
 * open a live `nc` socket to another tab (the reverse/bind-shell demo).
 */
const CourseTerminal = forwardRef<CourseTerminalHandle, CourseTerminalProps>(({ user, onExit, className = '' }, ref) => {
  const session = useMemo<ShellSession>(() => {
    let restore: string | null = null;
    try { restore = localStorage.getItem(storageKey(user)); } catch { /* ignore */ }
    return createShellSession({ user, restore });
  }, [user]);

  const net = useRef(getNet()).current;

  const [lines, setLines] = useState<Line[]>([
    { kind: 'sys', text: `CyberKhana practice shell — runs safely in your browser. Type "help" to begin.` },
  ]);
  const [input, setInput] = useState('');
  const [cwdLabel, setCwdLabel] = useState(session.cwdLabel());
  const [promptUser, setPromptUser] = useState(session.user);
  const [netMode, setNetMode] = useState<NetMode | null>(null);
  const [booting, setBooting] = useState(true);
  const [bootHide, setBootHide] = useState(false);
  const typed = useRef<string[]>([]);
  const histIdx = useRef<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Live-socket bookkeeping (kept in refs so socket callbacks see current values).
  const socketRef = useRef<Socket | null>(null);
  const stopListenRef = useRef<(() => void) | null>(null);
  const servedRef = useRef<ShellSession | null>(null);
  const recvBuf = useRef('');

  const prompt = `${promptUser}@cyberkhana:${cwdLabel}$`;

  useEffect(() => {
    session.setLocalIp(net.localIp);
    net.setHost(`${session.user}-box`);
    net.announce();
  }, [session, net]);

  // Brief boot splash whenever the terminal is opened: let the fill finish
  // (~780ms), hold a beat, then fade out — quick enough not to get in the way.
  useEffect(() => {
    const fade = setTimeout(() => setBootHide(true), 860);
    const done = setTimeout(() => setBooting(false), 1160);
    return () => { clearTimeout(fade); clearTimeout(done); };
  }, []);

  const persist = useCallback(() => {
    try { localStorage.setItem(storageKey(user), session.snapshot()); } catch { /* quota */ }
  }, [session, user]);

  const teardownNet = useCallback(() => {
    socketRef.current?.close();
    socketRef.current = null;
    stopListenRef.current?.();
    stopListenRef.current = null;
    servedRef.current = null;
    recvBuf.current = '';
  }, []);

  const reset = useCallback(() => {
    teardownNet();
    setNetMode(null);
    session.reset();
    try { localStorage.setItem(storageKey(user), session.snapshot()); } catch { /* quota */ }
    setLines([{ kind: 'sys', text: 'Sandbox reset to its starting state. Type "help" to begin.' }]);
    setCwdLabel(session.cwdLabel());
    setPromptUser(session.user);
    setInput('');
    typed.current = [];
    histIdx.current = null;
  }, [session, user, teardownNet]);

  useImperativeHandle(ref, () => ({ reset }), [reset]);

  // Close any open socket when the terminal unmounts.
  useEffect(() => () => teardownNet(), [teardownNet]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

  const append = useCallback((...ls: Line[]) => setLines((prev) => [...prev, ...ls]), []);

  /** Wire up a live socket once a connection is established. */
  const onConnected = useCallback((socket: Socket, req: NetRequest) => {
    socketRef.current = socket;
    const peer = `${socket.peerIp}:${req.port}`;
    socket.onClose(() => {
      append({ kind: 'sys', text: `Connection to ${socket.peerIp} closed.` });
      teardownNet();
      setNetMode(null);
    });

    if (req.exec) {
      // This side serves a shell (bind or reverse). The peer drives a private
      // copy of our filesystem, so their commands don't hijack our own prompt.
      const served = createShellSession({ user: session.user, restore: session.snapshot() });
      served.setLocalIp(net.localIp);
      servedRef.current = served;
      recvBuf.current = '';
      socket.onData((chunk) => {
        recvBuf.current += chunk;
        let nl: number;
        while ((nl = recvBuf.current.indexOf('\n')) !== -1) {
          const cmd = recvBuf.current.slice(0, nl);
          recvBuf.current = recvBuf.current.slice(nl + 1);
          append({ kind: 'sys', text: `[${socket.peerIp}] ${cmd}` });
          if (cmd.trim() === 'exit') { socket.close(); return; }
          served.runInto(cmd, (s) => socket.send(s));
        }
      });
      append({ kind: 'sys', text: `[+] Shell handed to ${peer}. They can now run commands on this box — press Ctrl+C to cut it off.` });
      setNetMode({ kind: 'connected', role: 'server', peer });
    } else {
      // This side drives the peer's shell: our input goes out, their output prints.
      socket.onData((chunk) => append({ kind: 'out', text: chunk.replace(/\n$/, '') }));
      append({ kind: 'sys', text: `[+] Connected to ${peer}. Type commands to run them on the remote box — Ctrl+C to disconnect.` });
      setNetMode({ kind: 'connected', role: 'client', peer });
    }
  }, [append, net, session, teardownNet]);

  /** Handle an `nc` request surfaced by the shell. */
  const handleNet = useCallback((req: NetRequest) => {
    if (!net.available) {
      append({ kind: 'err', text: 'nc: cross-tab networking is unavailable in this browser.' });
      return;
    }
    if (req.mode === 'listen') {
      append(
        { kind: 'sys', text: `Listening on 0.0.0.0:${req.port} — this box is ${net.localIp}.` },
        { kind: 'sys', text: `From the other terminal, run:  nc ${net.localIp} ${req.port}${req.exec ? '' : ' -e /bin/bash'}` },
        { kind: 'sys', text: 'Ctrl+C to stop listening.' },
      );
      const stop = net.listen(req.port, (socket) => {
        stopListenRef.current?.();
        stopListenRef.current = null;
        append({ kind: 'sys', text: `Connection received from ${socket.peerIp}.` });
        onConnected(socket, req);
      });
      stopListenRef.current = stop;
      setNetMode({ kind: 'listening', port: req.port });
    } else {
      const host = req.host ?? '';
      let ip = host;
      if (!isIp(host)) { for (const [pip, h] of net.peers) if (h === host || h.startsWith(host)) { ip = pip; break; } }
      append({ kind: 'sys', text: `Connecting to ${host || ip} ${req.port} ...` });
      setNetMode({ kind: 'connecting', port: req.port });
      net.connect(ip, req.port).then((socket) => {
        if (!socket) {
          append({ kind: 'err', text: `nc: connect to ${host || ip} port ${req.port} (tcp) failed: Connection refused` });
          setNetMode(null);
          return;
        }
        onConnected(socket, req);
      });
    }
  }, [append, net, onConnected]);

  const submit = () => {
    const line = input;
    const promptAtRun = prompt;
    setInput('');
    histIdx.current = null;
    if (line.trim() !== '') typed.current.push(line);

    const res = session.run(line);
    setCwdLabel(res.cwdLabel);
    setPromptUser(res.user);

    if (res.cleared) {
      setLines([]);
      persist();
      return;
    }

    const added: Line[] = [{ kind: 'cmd', text: line, prompt: promptAtRun }];
    if (res.output) added.push({ kind: 'out', text: res.output.replace(/\n$/, '') });
    if (res.error) added.push({ kind: 'err', text: res.error });
    if (res.exited) {
      added.push({ kind: 'sys', text: 'logout' });
      setLines((prev) => [...prev, ...added]);
      persist();
      onExit?.();
      return;
    }
    setLines((prev) => [...prev, ...added]);
    persist();
    if (res.net) handleNet(res.net);
  };

  /** Enter pressed while a live socket is open. */
  const netSubmit = () => {
    const line = input;
    setInput('');
    if (netMode?.kind === 'connected' && netMode.role === 'client' && socketRef.current) {
      append({ kind: 'cmd', text: line, prompt: `${netMode.peer}>` });
      socketRef.current.send(line + '\n');
    }
    // In 'server'/'listening'/'connecting' states the local keyboard is idle
    // (Ctrl+C is the way out) — just clear the line.
  };

  const stopNet = () => {
    append({ kind: 'sys', text: '^C' });
    teardownNet();
    setNetMode(null);
    setInput('');
  };

  const navHistory = (dir: -1 | 1) => {
    const h = typed.current;
    if (h.length === 0) return;
    let idx = histIdx.current === null ? h.length : histIdx.current;
    idx = Math.min(h.length, Math.max(0, idx + dir));
    histIdx.current = idx;
    setInput(idx >= h.length ? '' : h[idx]);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Ctrl+C always works — cancels an in-flight nc session first.
    if (e.key === 'c' && e.ctrlKey) {
      e.preventDefault();
      if (netMode) stopNet();
      else if (input) { append({ kind: 'cmd', text: input + '^C', prompt }); setInput(''); }
      return;
    }
    if (netMode) {
      if (e.key === 'Enter') { e.preventDefault(); netSubmit(); }
      return; // history / tab-complete are disabled while a socket is open
    }
    if (e.key === 'Enter') { e.preventDefault(); submit(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); navHistory(-1); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); navHistory(1); }
    else if (e.key === 'l' && e.ctrlKey) { e.preventDefault(); setLines([]); }
    else if (e.key === 'Tab') {
      e.preventDefault();
      const res = session.complete(input);
      if (res.replacement !== null) setInput(res.replacement);
      else if (res.candidates.length > 1) {
        setLines((prev) => [
          ...prev,
          { kind: 'cmd', text: input, prompt },
          { kind: 'out', text: res.candidates.join('   ') },
        ]);
      }
    }
  };

  // Prompt shown on the live input row.
  const livePrompt =
    netMode?.kind === 'connected' && netMode.role === 'client' ? `${netMode.peer}>`
    : netMode?.kind === 'connected' ? `[serving ${netMode.peer}]`
    : netMode?.kind === 'listening' ? `[listening :${netMode.port}]`
    : netMode?.kind === 'connecting' ? `[connecting :${netMode.port}]`
    : prompt;
  const inputIdle = !!netMode && !(netMode.kind === 'connected' && netMode.role === 'client');

  return (
    <div
      className={`relative flex h-full flex-col bg-[#0a0e14] font-mono text-[12.5px] leading-relaxed text-[#c9d3e0] ${className}`}
      onClick={() => inputRef.current?.focus()}
    >
      {booting && (
        <div
          className={`absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-[#0a0e14] transition-opacity duration-300 ${bootHide ? 'opacity-0' : 'opacity-100'}`}
        >
          <LiquidLogoLoader size={76} fill fillMs={780} />
          <p className="text-[11px] tracking-[0.2em] text-[#4b5a72]">booting practice shell…</p>
        </div>
      )}
      <div ref={scrollRef} className="custom-scrollbar flex-1 overflow-y-auto px-3 py-2" dir="ltr">
        {lines.map((l, i) => (
          <div key={i} className="whitespace-pre-wrap break-words">
            {l.kind === 'cmd' && (
              <>
                <span className={l.prompt?.endsWith('>') ? 'text-[#ff9f43]' : 'text-[#00c766]'}>{l.prompt}</span>{' '}
                <span className="text-[#e5e9f0]">{l.text}</span>
              </>
            )}
            {l.kind === 'out' && <span className="text-[#c9d3e0]">{l.text}</span>}
            {l.kind === 'err' && <span className="text-[#ff6b6b]">{l.text}</span>}
            {l.kind === 'sys' && <span className="text-[#6e7a94]">{l.text}</span>}
          </div>
        ))}

        <div className="flex items-baseline">
          <span className={`flex-shrink-0 ${netMode ? 'text-[#ff9f43]' : 'text-[#00c766]'}`}>{livePrompt}&nbsp;</span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            aria-label="Terminal input"
            placeholder={inputIdle ? 'Ctrl+C to stop' : ''}
            className="min-w-0 flex-1 bg-transparent text-[#e5e9f0] caret-[#00c766] outline-none placeholder:text-[#3a4658]"
            dir="ltr"
            autoFocus
          />
        </div>
      </div>
    </div>
  );
});

CourseTerminal.displayName = 'CourseTerminal';

export default CourseTerminal;
