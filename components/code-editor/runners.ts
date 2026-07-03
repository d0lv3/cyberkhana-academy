/**
 * Language dispatch for the in-browser code runners. Every runner shares the
 * same `(code, stdin?) → ExecutionResult` shape and runs fully client-side
 * (Pyodide for Python, JSCPP for C/C++, a hand-written interpreter for Bash),
 * so nothing executes on the server.
 */

import { runPython, isPyodideReady, type ExecutionResult } from './PythonExecutor';
import { runCpp, isCppReady } from './CppExecutor';
import { runBash, isBashReady } from './BashExecutor';

export type RunnerLanguage = 'python' | 'cpp' | 'bash';

export function runCode(language: RunnerLanguage, code: string, stdin?: string): Promise<ExecutionResult> {
  switch (language) {
    case 'cpp':
      return runCpp(code, stdin ?? '');
    case 'bash':
      return runBash(code, stdin ?? '');
    default:
      return runPython(code, stdin);
  }
}

/** Whether the runtime is already warmed up (drives the "loading…" indicator). */
export function isRunnerReady(language: RunnerLanguage): boolean {
  switch (language) {
    case 'cpp':
      return isCppReady();
    case 'bash':
      return isBashReady();
    default:
      return isPyodideReady();
  }
}
