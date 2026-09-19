/// <reference lib="webworker" />
/**
 * The Python sandbox, off the main thread.
 *
 * Lesson code is authored by creators and pre-filled into a student's editor,
 * and the student is told to press Run. So "the code in the box" is not always
 * the student's own, and it must not be able to act as them. On the main
 * thread Pyodide's JS bridge handed it `document.cookie`, `localStorage` and
 * same-origin `fetch`: everything the signed-in session can reach.
 *
 * A worker has no DOM. `document`, `window` and `localStorage` do not exist
 * here, so `from js import document` fails with an ImportError instead of
 * returning the real thing. What a worker does keep is the network, so
 * sealNetwork() below closes that too, once Pyodide itself has finished
 * loading.
 *
 * The other half of the job is the timeout. On the main thread a runaway loop
 * starved the event loop, so the 10s timer never fired and the tab froze for
 * good; a worker can simply be terminated (see PythonExecutor).
 */

const PYODIDE_LOCAL = '/pyodide/pyodide.mjs';
const PYODIDE_CDN = 'https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.mjs';

/**
 * Import name to Pyodide package, for the packages the curriculum actually
 * teaches. This is an allowlist on purpose: every wheel here is vendored into
 * /pyodide/ by scripts/copy-pyodide.mjs and SHA-256 checked at build time, so
 * lesson code can never pull arbitrary third-party code off PyPI (or a CDN)
 * into a student's browser. Anything not listed is simply never loaded and
 * raises a normal ImportError.
 *
 * Keep in sync with PACKAGES in scripts/copy-pyodide.mjs: an entry here whose
 * wheel isn't vendored would 404 at runtime.
 */
const IMPORT_TO_PACKAGE: Record<string, string> = {
  PIL: 'pillow',
};

/** Top-level module names a snippet imports (`import x.y` / `from x import y`). */
function detectImports(code: string): string[] {
  const mods = new Set<string>();
  const re = /^[ \t]*(?:import[ \t]+([A-Za-z_][\w.]*)|from[ \t]+([A-Za-z_][\w.]*)[ \t]+import)/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(code)) !== null) {
    const top = (m[1] || m[2] || '').split('.')[0];
    if (top) mods.add(top);
  }
  return [...mods];
}

/** Resolve the allowlisted packages a snippet needs (deduped). */
function packagesFor(code: string): string[] {
  const pkgs = new Set<string>();
  for (const mod of detectImports(code)) {
    const pkg = IMPORT_TO_PACKAGE[mod];
    if (pkg) pkgs.add(pkg);
  }
  return [...pkgs];
}

/**
 * The runtime's own assets, and nothing else.
 *
 * Pyodide keeps fetching after startup: `loadPackage` pulls a wheel the first
 * time a lesson imports PIL, so the network cannot simply be cut. It is
 * narrowed instead to our own /pyodide/ directory, plus the CDN we fall back
 * to when the vendored copy is missing.
 */
function isRuntimeAsset(raw: unknown): boolean {
  try {
    const url = new URL(String(raw), self.location.href);
    if (url.origin === self.location.origin && url.pathname.startsWith('/pyodide/')) return true;
    return url.href.startsWith('https://cdn.jsdelivr.net/pyodide/');
  } catch {
    return false;
  }
}

const BLOCKED = 'Network access is disabled in the Python sandbox.';

/**
 * Close every way out of the worker, keeping the runtime's own loads working.
 *
 * Called once Pyodide is up. The real `fetch` is captured in a closure that
 * nothing reachable from Python can name, so `from js import fetch` gets the
 * wrapper and its allowlist, never the original.
 */
function sealNetwork(): void {
  const scope = self as unknown as Record<string, any>;
  const realFetch = scope.fetch.bind(self);

  scope.fetch = (input: any, init?: any) => {
    const target = typeof input === 'string' || input instanceof URL ? input : input?.url;
    if (isRuntimeAsset(target)) return realFetch(input, init);
    return Promise.reject(new TypeError(BLOCKED));
  };

  const XHR = scope.XMLHttpRequest;
  if (XHR?.prototype?.open) {
    const realOpen = XHR.prototype.open;
    XHR.prototype.open = function (this: unknown, method: string, url: string, ...rest: unknown[]) {
      if (!isRuntimeAsset(url)) throw new DOMException(BLOCKED, 'SecurityError');
      return realOpen.call(this, method, url, ...rest);
    };
  }

  /* Shadow rather than delete: these live as accessors on the global's
     prototype chain, where `delete self.indexedDB` is a silent no-op. An own
     data property in front of them is what actually takes them away. */
  const shadow = (name: string, value: unknown) => {
    try {
      Object.defineProperty(scope, name, { value, configurable: true, writable: true });
    } catch {
      /* non-configurable on this engine: nothing further to try */
    }
  };

  // Nothing in the curriculum opens a socket, reads a database or pulls in
  // another script, so these go entirely rather than being narrowed.
  const refuse = function () {
    throw new DOMException(BLOCKED, 'SecurityError');
  };
  /* `Worker` is the important one. A nested worker would start on a clean
     global with an unsealed `fetch`, which would hand back everything this
     function just took away. */
  for (const name of ['WebSocket', 'EventSource', 'importScripts', 'SharedWorker', 'Worker']) {
    if (name in scope) shadow(name, refuse);
  }
  for (const name of ['indexedDB', 'caches']) {
    if (name in scope) shadow(name, undefined);
  }
  try {
    if (scope.navigator?.sendBeacon) scope.navigator.sendBeacon = () => false;
  } catch {
    /* read-only navigator on some engines */
  }
}

let pyodide: any = null;
let loading: Promise<any> | null = null;

async function loadRuntime(): Promise<any> {
  if (pyodide) return pyodide;
  if (loading) return loading;

  loading = (async () => {
    try {
      const mod = await import(/* @vite-ignore */ PYODIDE_LOCAL);
      pyodide = await mod.loadPyodide({ indexURL: '/pyodide/' });
    } catch {
      const mod = await import(/* @vite-ignore */ PYODIDE_CDN);
      pyodide = await mod.loadPyodide();
    }
    // Only now: sealing earlier would cut off Pyodide's own startup fetches.
    sealNetwork();
    return pyodide;
  })();

  return loading;
}

/**
 * Strip Pyodide internals from a traceback, keep the student's own frames.
 *
 * A raw traceback opens with four frames inside `/lib/python312.zip/_pyodide/`
 * — the harness that compiled and ran the snippet — before it reaches the line
 * the student actually wrote. Those frames are noise to a beginner and the
 * first thing they would ask about, so each one is dropped along with the
 * source and caret lines indented under it.
 */
function cleanPythonError(raw: string): string {
  // If it's our timeout message, return as-is
  if (raw.includes('timed out')) return raw;

  const lines = raw.split('\n');
  const tbStart = lines.findIndex((l) => l.startsWith('Traceback'));
  if (tbStart < 0) return raw.trim();

  const kept: string[] = [lines[tbStart]];
  let inRuntimeFrame = false;

  for (const line of lines.slice(tbStart + 1)) {
    const frame = /^\s+File "([^"]*)"/.exec(line);
    if (frame) {
      inRuntimeFrame = frame[1].includes('python312.zip') || frame[1].includes('_pyodide');
      if (!inRuntimeFrame) kept.push(line);
      continue;
    }
    // Source and caret lines sit indented under the frame they belong to; the
    // closing "SomeError: message" is flush left and always kept.
    if (/^\s/.test(line)) {
      if (!inRuntimeFrame) kept.push(line);
      continue;
    }
    inRuntimeFrame = false;
    kept.push(line);
  }

  return kept.join('\n').trim();
}

type RunRequest = { type: 'run'; id: number; code: string; stdin?: string };
type WarmupRequest = { type: 'warmup' };

const post = (payload: Record<string, unknown>) =>
  (self as unknown as Worker).postMessage(payload);

async function run({ id, code, stdin }: RunRequest): Promise<void> {
  const start = performance.now();
  const done = (payload: Record<string, unknown>) => post({ type: 'result', id, ...payload });

  let py: any;
  try {
    py = await loadRuntime();
  } catch (err: any) {
    done({
      output: '',
      error: `Could not start Python: ${err?.message ?? String(err)}`,
      durationMs: Math.round(performance.now() - start),
    });
    return;
  }

  // Pull in any allowlisted package the snippet imports (e.g. `from PIL import
  // Image` gives pillow). Served from our own bundle; a failure here is
  // reported as a normal error rather than being swallowed, so the lesson can
  // say why.
  const needed = packagesFor(code);
  if (needed.length) {
    try {
      await py.loadPackage(needed);
    } catch (err: any) {
      done({
        output: '',
        error: `Could not load required package(s): ${needed.join(', ')}\n${err?.message ?? String(err)}`,
        durationMs: Math.round(performance.now() - start),
      });
      return;
    }
  }

  // Set up stdout/stderr capture + optional stdin
  const setupCode = `
import sys, io
sys.stdout = io.StringIO()
sys.stderr = io.StringIO()
${stdin !== undefined ? `sys.stdin = io.StringIO(${JSON.stringify(stdin)})` : ''}
`;

  const collectCode = `
__stdout_val = sys.stdout.getvalue()
__stderr_val = sys.stderr.getvalue()
sys.stdout = sys.__stdout__
sys.stderr = sys.__stderr__
`;

  try {
    py.runPython(setupCode);
    await py.runPythonAsync(code);
    py.runPython(collectCode);

    const stdout: string = py.globals.get('__stdout_val') || '';
    const stderr: string = py.globals.get('__stderr_val') || '';
    const durationMs = Math.round(performance.now() - start);

    done(stderr ? { output: stdout, error: stderr, durationMs } : { output: stdout, durationMs });
  } catch (err: any) {
    /* Whatever was printed before the error, and the traceback itself.
       Python writes the traceback to sys.stderr, which setupCode has pointed
       at a StringIO — and that redirection is exactly why the JS error's own
       `message` comes back empty, leaving `String(err)` to say nothing but
       "PythonError". So stderr is the reliable source here and the error
       object is only a fallback. */
    let partialOutput = '';
    let traceback = '';
    try {
      py.runPython(collectCode);
      partialOutput = py.globals.get('__stdout_val') || '';
      traceback = py.globals.get('__stderr_val') || '';
    } catch {
      // ignore collection errors
    }

    done({
      output: partialOutput,
      error: cleanPythonError(traceback || err?.message || String(err)),
      durationMs: Math.round(performance.now() - start),
    });
  }
}

self.onmessage = (event: MessageEvent<RunRequest | WarmupRequest>) => {
  const data = event.data;
  if (data?.type === 'warmup') {
    void loadRuntime().then(
      () => post({ type: 'ready' }),
      () => undefined
    );
    return;
  }
  if (data?.type === 'run') {
    void run(data).then(() => post({ type: 'ready' }));
  }
};
