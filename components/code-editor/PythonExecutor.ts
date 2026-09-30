/**
 * Pyodide-based Python executor.
 *
 * Loads Python (compiled to WebAssembly) entirely in the browser.
 * No server-side execution: secure by design.
 *
 * The runtime itself lives in a worker (pythonWorker.ts), which is what keeps
 * lesson code away from the signed-in session: a worker has no `document`,
 * `window` or `localStorage` to reach through Pyodide's JS bridge, and the
 * worker seals its own network on the way up. This file is the main-thread
 * half: it owns the worker, matches replies to requests, and enforces the
 * timeout by terminating a worker that has stopped answering.
 *
 * The runtime (about 14 MB, cached after first load) is self-hosted from
 * /pyodide/ (copied from the pyodide npm package at build time); the jsDelivr
 * CDN is kept as a fallback in case the local assets are missing.
 */

type ExecutionResult = {
  output: string;
  error?: string;
  durationMs: number;
};

/* ── Two clocks ──
 *
 * Ten seconds is for running code. It used to start the moment Run was
 * pressed, so on a first visit it also had to cover downloading the runtime:
 * a 10 MB wasm, the 2 MB standard library and the rest, 14 MB with Pillow. A
 * connection slower than about 11 Mbit/s could not fetch that in time, so the
 * worker was killed mid-download, the half-fetched files were thrown away with
 * it, and the next Run started the download again from nothing. Python never
 * loaded at all.
 *
 * Now the worker says when it starts on the code itself ('started'), and only
 * that starts the ten seconds. Loading gets its own clock, far longer, which
 * is only there so a load that hangs outright ends in a message rather than a
 * spinner. */
const RUN_TIMEOUT_MS = 10_000;
const LOAD_TIMEOUT_MS = 5 * 60_000;
const TIMEOUT_MESSAGE =
  'Execution timed out, your code took longer than 10 seconds. Check for infinite loops.';
const LOAD_TIMEOUT_MESSAGE =
  'Python took too long to load. Check your connection, then run again.';

let worker: Worker | null = null;
let ready = false;
let nextId = 1;

interface PendingRun {
  resolve: (result: ExecutionResult) => void;
  timer: ReturnType<typeof setTimeout>;
  /** The run's own limit, started when the worker begins on the code. */
  runTimeoutMs: number;
  startedAt: number;
}

/** Requests posted to the worker and still waiting for their reply. */
const pending = new Map<number, PendingRun>();

/**
 * Hand every waiting caller the same answer and drop the worker.
 *
 * Used when the worker is terminated (a run that overran, a load that hung)
 * or died on its own: either way the replies are never coming, and the next
 * run starts a fresh runtime.
 */
function discardWorker(reason: string): void {
  const waiting = [...pending.values()];
  pending.clear();
  ready = false;
  if (worker) {
    worker.terminate();
    worker = null;
  }
  for (const run of waiting) {
    clearTimeout(run.timer);
    run.resolve({ output: '', error: reason, durationMs: Math.round(performance.now() - run.startedAt) });
  }
}

function getWorker(): Worker {
  if (worker) return worker;

  const w = new Worker(new URL('./pythonWorker.ts', import.meta.url), { type: 'module' });

  w.onmessage = (event: MessageEvent<any>) => {
    const data = event.data;
    if (data?.type === 'ready') {
      ready = true;
      return;
    }
    if (data?.type === 'started') {
      /* The runtime is up and the code is about to run: from here on it is
         the code's time, and the ten seconds start. */
      ready = true;
      const run = pending.get(data.id);
      if (!run) return;
      clearTimeout(run.timer);
      run.timer = setTimeout(() => {
        if (pending.has(data.id)) discardWorker(TIMEOUT_MESSAGE);
      }, run.runTimeoutMs);
      return;
    }
    if (data?.type === 'result') {
      const run = pending.get(data.id);
      if (!run) return;
      pending.delete(data.id);
      clearTimeout(run.timer);
      run.resolve({
        output: data.output ?? '',
        ...(data.error ? { error: data.error } : {}),
        durationMs: data.durationMs ?? 0,
      });
    }
  };

  w.onerror = () => discardWorker('The Python runtime stopped unexpectedly. Try running again.');

  worker = w;
  return w;
}

/** Check if Pyodide is already loaded */
export function isPyodideReady(): boolean {
  return ready;
}

/**
 * Start fetching the runtime ahead of the first Run, so a student reading the
 * lesson has it by the time they press the button. Does nothing once it is
 * loaded or loading.
 */
export function warmUpPython(): void {
  if (ready || worker) return;
  getWorker().postMessage({ type: 'warmup' });
}

/**
 * Execute Python code and return captured stdout + stderr.
 *
 * @param code      The Python source to run
 * @param stdin     Optional string to feed as stdin (for input() calls)
 * @param timeoutMs Max time the code itself may run (default: 10 seconds),
 *                  counted from when the runtime starts on it, not from the
 *                  call: loading the runtime has its own, longer limit
 */
export function runPython(
  code: string,
  stdin?: string,
  timeoutMs: number = RUN_TIMEOUT_MS
): Promise<ExecutionResult> {
  const w = getWorker();
  const id = nextId++;

  return new Promise<ExecutionResult>((resolve) => {
    /* A worker that overran cannot be asked to stop: Python is busy inside it,
       exactly as it was on the main thread. The difference is that here we can
       throw the whole thing away, which is what finally makes this timeout
       real. The next run pays for a fresh runtime, which beats a tab that
       never comes back. */
    pending.set(id, {
      resolve,
      runTimeoutMs: timeoutMs,
      startedAt: performance.now(),
      timer: setTimeout(() => {
        if (pending.has(id)) discardWorker(LOAD_TIMEOUT_MESSAGE);
      }, LOAD_TIMEOUT_MS),
    });

    w.postMessage({ type: 'run', id, code, stdin });
  });
}

export type { ExecutionResult };
