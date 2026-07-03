import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { createShellSession, type ShellSession } from '../code-editor/BashExecutor';

export interface CourseTerminalHandle {
  /** Wipe the sandbox filesystem, variables, and scrollback back to the seed. */
  reset: () => void;
}

interface Line {
  kind: 'cmd' | 'out' | 'err' | 'sys';
  text: string;
  prompt?: string;
}

/** Canonical, filesystem-safe username — mirrors createShellSession's own rule. */
const canonical = (user: string) =>
  (user || 'user').trim().toLowerCase().replace(/[^a-z0-9._-]/g, '') || 'user';
const storageKey = (user: string) => `academy-shell-${canonical(user)}`;

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
 * survives navigation and follows the learner into a popped-out tab.
 */
const CourseTerminal = forwardRef<CourseTerminalHandle, CourseTerminalProps>(({ user, onExit, className = '' }, ref) => {
  const session = useMemo<ShellSession>(() => {
    let restore: string | null = null;
    try { restore = localStorage.getItem(storageKey(user)); } catch { /* ignore */ }
    return createShellSession({ user, restore });
  }, [user]);

  const [lines, setLines] = useState<Line[]>([
    { kind: 'sys', text: `CyberKhana practice shell — runs safely in your browser. Type "help" to begin.` },
  ]);
  const [input, setInput] = useState('');
  const [cwdLabel, setCwdLabel] = useState(session.cwdLabel());
  const typed = useRef<string[]>([]);
  const histIdx = useRef<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const prompt = `${session.user}@cyberkhana:${cwdLabel}$`;

  const persist = useCallback(() => {
    try { localStorage.setItem(storageKey(user), session.snapshot()); } catch { /* quota */ }
  }, [session, user]);

  const reset = useCallback(() => {
    session.reset();
    try { localStorage.setItem(storageKey(user), session.snapshot()); } catch { /* quota */ }
    setLines([{ kind: 'sys', text: 'Sandbox reset to its starting state. Type "help" to begin.' }]);
    setCwdLabel(session.cwdLabel());
    setInput('');
    typed.current = [];
    histIdx.current = null;
  }, [session, user]);

  useImperativeHandle(ref, () => ({ reset }), [reset]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

  const submit = () => {
    const line = input;
    const promptAtRun = prompt;
    setInput('');
    histIdx.current = null;
    if (line.trim() !== '') typed.current.push(line);

    const res = session.run(line);
    setCwdLabel(res.cwdLabel);

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

  return (
    <div
      className={`flex h-full flex-col bg-[#0a0e14] font-mono text-[12.5px] leading-relaxed text-[#c9d3e0] ${className}`}
      onClick={() => inputRef.current?.focus()}
    >
      <div ref={scrollRef} className="custom-scrollbar flex-1 overflow-y-auto px-3 py-2" dir="ltr">
        {lines.map((l, i) => (
          <div key={i} className="whitespace-pre-wrap break-words">
            {l.kind === 'cmd' && (
              <>
                <span className="text-[#00c766]">{l.prompt}</span>{' '}
                <span className="text-[#e5e9f0]">{l.text}</span>
              </>
            )}
            {l.kind === 'out' && <span className="text-[#c9d3e0]">{l.text}</span>}
            {l.kind === 'err' && <span className="text-[#ff6b6b]">{l.text}</span>}
            {l.kind === 'sys' && <span className="text-[#6e7a94]">{l.text}</span>}
          </div>
        ))}

        <div className="flex items-baseline">
          <span className="flex-shrink-0 text-[#00c766]">{prompt}&nbsp;</span>
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
            className="min-w-0 flex-1 bg-transparent text-[#e5e9f0] caret-[#00c766] outline-none"
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
