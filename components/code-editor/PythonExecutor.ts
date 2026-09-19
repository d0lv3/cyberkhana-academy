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
 * The runtime (~12 MB, cached after first load) is self-hosted from
 * /pyodide/ (copied from the pyodide npm package at build time); the jsDelivr
 * CDN is kept as a fallback in case the local assets are missing.
 */

type ExecutionResult = {
  output: string;
  error?: string;
  durationMs: number;
};

const MAX_TIMEOUT_MS = 10_000;
const TIMEOUT_MESSAGE =
  'Execution timed out, your code took longer than 10 seconds. Check for infinite loops.';

let worker: Worker | null = null;
let ready = false;
let nextId = 1;

/** Requests posted to the worker and still waiting for their reply. */
const pending = new Map<number, (result: ExecutionResult) => void>();

/**
 * Hand every waiting caller the same answer and drop the worker.
 *
 * Used when the worker is terminated (a run that overran) or died on its own:
 * either way the replies are never coming, and the next run starts a fresh
 * runtime.
 */
function discardWorker(reason: string): void {
  const waiting = [...pending.values()];
  pending.clear();
  ready = false;
  if (worker) {
    worker.terminate();
    worker = null;
  }
  for (const resolve of waiting) {
    resolve({ output: '', error: reason, durationMs: MAX_TIMEOUT_MS });
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
    if (data?.type === 'result') {
      const resolve = pending.get(data.id);
      if (!resolve) return;
      pending.delete(data.id);
      resolve({
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
 * Execute Python code and return captured stdout + stderr.
 *
 * @param code      The Python source to run
 * @param stdin     Optional string to feed as stdin (for input() calls)
 * @param timeoutMs Max execution time (default: 10 seconds)
 */
export function runPython(
  code: string,
  stdin?: string,
  timeoutMs: number = MAX_TIMEOUT_MS
): Promise<ExecutionResult> {
  const w = getWorker();
  const id = nextId++;

  return new Promise<ExecutionResult>((resolve) => {
    /* A worker that overran cannot be asked to stop: Python is busy inside it,
       exactly as it was on the main thread. The difference is that here we can
       throw the whole thing away, which is what finally makes this timeout
       real. The next run pays for a fresh runtime, which beats a tab that
       never comes back. */
    const timer = setTimeout(() => {
      if (!pending.has(id)) return;
      discardWorker(TIMEOUT_MESSAGE);
    }, timeoutMs);

    pending.set(id, (result) => {
      clearTimeout(timer);
      resolve(result);
    });

    w.postMessage({ type: 'run', id, code, stdin });
  });
}

export type { ExecutionResult };
