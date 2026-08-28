/**
 * Language dispatch for the in-browser code runners. Every runner shares the
 * same `(code, stdin?) → ExecutionResult` shape and runs fully client-side
 * (Pyodide for Python, clang-in-WebAssembly for C/C++, a hand-written
 * interpreter for Bash), so nothing executes on the server.
 *
 * C and C++ have two runners behind them. The real one is clang, vendored by
 * scripts/copy-emception.mjs; where that has not been run — a fresh checkout,
 * a server missing the assets — the old JSCPP interpreter still answers, so
 * Run degrades to "the basics work" rather than to a broken button.
 */

import { runPython, isPyodideReady, type ExecutionResult } from './PythonExecutor';
import { runCpp, isCppReady } from './CppExecutor';
import { runWasmCpp, isWasmCppReady, isToolchainAvailable, type CppLanguage } from './WasmCppExecutor';
import { runBash, isBashReady } from './BashExecutor';

export type RunnerLanguage = 'python' | 'c' | 'cpp' | 'bash';

const isCLike = (l: RunnerLanguage): l is CppLanguage => l === 'c' || l === 'cpp';

/**
 * Which runner a language slug belongs to. Shared so the lesson viewer and the
 * creator preview cannot disagree about it — they used to, and 'c++' ran as
 * Python in one of them.
 */
export function runnerFor(slug?: string): RunnerLanguage {
  if (slug === 'c') return 'c';
  if (slug === 'cpp' || slug === 'c++') return 'cpp';
  if (slug === 'bash') return 'bash';
  return 'python';
}

export async function runCode(
  language: RunnerLanguage,
  code: string,
  stdin?: string
): Promise<ExecutionResult> {
  if (isCLike(language)) {
    return (await isToolchainAvailable())
      ? runWasmCpp(code, stdin ?? '', language)
      : runCpp(code, stdin ?? '');
  }
  if (language === 'bash') return runBash(code, stdin ?? '');
  return runPython(code, stdin);
}

/** Whether the runtime is already warmed up (drives the "loading…" indicator). */
export function isRunnerReady(language: RunnerLanguage): boolean {
  switch (language) {
    case 'c':
    case 'cpp':
      return isWasmCppReady() || isCppReady();
    case 'bash':
      return isBashReady();
    default:
      return isPyodideReady();
  }
}
