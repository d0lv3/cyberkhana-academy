/**
 * Pyodide-based Python executor.
 *
 * Loads Python (compiled to WebAssembly) entirely in the browser.
 * No server-side execution — secure by design.
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

const PYODIDE_LOCAL = '/pyodide/pyodide.mjs';
const PYODIDE_CDN = 'https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.mjs';
const MAX_TIMEOUT_MS = 10_000;

/**
 * Import name → Pyodide package, for the packages the curriculum actually
 * teaches. This is an allowlist on purpose: every wheel here is vendored into
 * /pyodide/ by scripts/copy-pyodide.mjs and SHA-256 checked at build time, so
 * lesson code can never pull arbitrary third-party code off PyPI (or a CDN)
 * into a student's browser. Anything not listed is simply never loaded and
 * raises a normal ImportError.
 *
 * Keep in sync with PACKAGES in scripts/copy-pyodide.mjs — an entry here whose
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

let pyodideInstance: any = null;
let loadingPromise: Promise<any> | null = null;

/** Load Pyodide — local assets first, CDN fallback (singleton). */
async function loadPyodide(): Promise<any> {
  if (pyodideInstance) return pyodideInstance;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    try {
      const mod = await import(/* @vite-ignore */ PYODIDE_LOCAL);
      pyodideInstance = await mod.loadPyodide({ indexURL: '/pyodide/' });
    } catch {
      const mod = await import(/* @vite-ignore */ PYODIDE_CDN);
      pyodideInstance = await mod.loadPyodide();
    }
    return pyodideInstance;
  })();

  return loadingPromise;
}

/** Check if Pyodide is already loaded */
export function isPyodideReady(): boolean {
  return pyodideInstance !== null;
}

/**
 * Execute Python code and return captured stdout + stderr.
 *
 * @param code      The Python source to run
 * @param stdin     Optional string to feed as stdin (for input() calls)
 * @param timeoutMs Max execution time (default: 10 seconds)
 */
export async function runPython(
  code: string,
  stdin?: string,
  timeoutMs: number = MAX_TIMEOUT_MS
): Promise<ExecutionResult> {
  const start = performance.now();
  const pyodide = await loadPyodide();

  // Pull in any allowlisted package the snippet imports (e.g. `from PIL import
  // Image` → pillow). Served from our own bundle; a failure here is reported as
  // a normal error rather than being swallowed, so the lesson can say why.
  const needed = packagesFor(code);
  if (needed.length) {
    try {
      await pyodide.loadPackage(needed);
    } catch (err: any) {
      return {
        output: '',
        error: `Could not load required package(s): ${needed.join(', ')}\n${err?.message ?? String(err)}`,
        durationMs: Math.round(performance.now() - start),
      };
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
    pyodide.runPython(setupCode);

    // Run user code with a timeout
    await Promise.race([
      pyodide.runPythonAsync(code),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error('Execution timed out — your code took longer than 10 seconds. Check for infinite loops.')),
          timeoutMs
        )
      ),
    ]);

    pyodide.runPython(collectCode);
    const stdout: string = pyodide.globals.get('__stdout_val') || '';
    const stderr: string = pyodide.globals.get('__stderr_val') || '';

    const durationMs = Math.round(performance.now() - start);

    if (stderr) {
      return { output: stdout, error: stderr, durationMs };
    }
    return { output: stdout, durationMs };
  } catch (err: any) {
    // Try to collect whatever was printed before the error
    let partialOutput = '';
    try {
      pyodide.runPython(collectCode);
      partialOutput = pyodide.globals.get('__stdout_val') || '';
    } catch {
      // ignore collection errors
    }

    const durationMs = Math.round(performance.now() - start);
    const errorMsg = err?.message || String(err);

    // Clean up Pyodide's verbose tracebacks for student-friendliness
    const cleanError = cleanPythonError(errorMsg);

    return { output: partialOutput, error: cleanError, durationMs };
  }
}

/** Strip Pyodide internals from error messages, keep the useful part */
function cleanPythonError(raw: string): string {
  // If it's our timeout message, return as-is
  if (raw.includes('timed out')) return raw;

  // Pyodide wraps Python exceptions — try to extract just the traceback
  const lines = raw.split('\n');
  const tbStart = lines.findIndex((l) => l.startsWith('Traceback'));
  if (tbStart >= 0) {
    return lines.slice(tbStart).join('\n');
  }

  // For PythonError objects, the message property has the clean traceback
  if (raw.includes('PythonError:')) {
    const idx = raw.indexOf('Traceback');
    if (idx >= 0) return raw.slice(idx);
  }

  return raw;
}

export type { ExecutionResult };
