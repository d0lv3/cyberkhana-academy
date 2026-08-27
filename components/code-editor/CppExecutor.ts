/**
 * JSCPP-based C / C++ executor.
 *
 * Runs a C/C++ interpreter (JSCPP) entirely in the browser — no server-side
 * execution, secure by design, same as the Python (Pyodide) runner. JSCPP is
 * dynamically imported the first time C/C++ is run, so it never weighs on the
 * initial bundle.
 *
 * Scope (JSCPP is an interpreter of a subset, not a full compiler): good for
 * C/C++ FUNDAMENTALS — cin/cout, `\n`/endl, variables, arithmetic, control
 * flow, functions, arrays, and the bundled headers `<iostream> <cmath>
 * <cstdio> <cstdlib> <cstring> <cctype> <ctime> <iomanip>`.
 *
 * Three things JSCPP does not do are supplied here (see ./cpp-stdlib):
 *   - `std::string`  — a real type, usable with or without `#include <string>`
 *   - `std::vector`  — with its template argument erased before parsing
 *   - `const`        — enforced by a source check, since the interpreter ignores it
 *
 * Still missing, and worth knowing before authoring exercises: classes and
 * structs (the grammar rejects a class body outright), references, other STL
 * containers, and `<algorithm>`. `maxTimeout` aborts runaway loops so the tab
 * cannot freeze.
 */

import type { ExecutionResult } from './PythonExecutor';
import { CPP_STDLIB_INCLUDES, prepareCppSource, findConstViolation } from './cpp-stdlib';

const MAX_TIMEOUT_MS = 10_000;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let jscpp: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let loadingPromise: Promise<any> | null = null;

async function loadJSCPP() {
  if (jscpp) return jscpp;
  if (loadingPromise) return loadingPromise;
  loadingPromise = import('JSCPP').then((m) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jscpp = (m as any).default ?? m;
    return jscpp;
  });
  return loadingPromise;
}

/** True once the interpreter has been loaded (for the loading indicator). */
export function isCppReady(): boolean {
  return jscpp !== null;
}

/**
 * Run C/C++ source, feeding `stdin` to cin/scanf and capturing stdout.
 */
export async function runCpp(
  code: string,
  stdin = '',
  timeoutMs: number = MAX_TIMEOUT_MS
): Promise<ExecutionResult> {
  const start = performance.now();

  /* Const violations are reported before anything runs, the way a compiler
     would: the program never produces output, because it never built. */
  const violation = findConstViolation(code);
  if (violation) {
    return {
      output: '',
      error: violation.message,
      durationMs: Math.round(performance.now() - start),
    };
  }

  const JSCPP = await loadJSCPP();

  let output = '';
  const config = {
    stdio: { write: (s: string) => { output += s; } },
    includes: CPP_STDLIB_INCLUDES,
    maxTimeout: timeoutMs,
  };

  try {
    JSCPP.run(prepareCppSource(code), stdin ?? '', config);
    return { output, durationMs: Math.round(performance.now() - start) };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { output, error: cleanCppError(msg), durationMs: Math.round(performance.now() - start) };
  }
}

/** Make JSCPP's messages a little friendlier for students. */
function cleanCppError(raw: string): string {
  if (/time limit exceeded/i.test(raw)) {
    return 'Execution timed out, your code took too long. Check for infinite loops.';
  }
  return raw.trim();
}
