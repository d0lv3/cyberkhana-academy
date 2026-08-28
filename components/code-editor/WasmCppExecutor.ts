/**
 * C and C++ the way a compiler sees them.
 *
 * Compiles the student's source with a real clang running in their browser
 * (see ./emception/compiler) and runs the result in a sandboxed frame (see
 * ./emception/sandbox). Nothing reaches a server, and after the first Run
 * nothing is downloaded either.
 *
 * This is what replaces the JSCPP interpreter, which could not parse a class,
 * a struct or a template, and had to be handed a `std::string`, a
 * `std::vector` and a `const` check written by hand. All of that goes away
 * here: the language is whatever clang says it is.
 *
 * The trade is time. A compile is seconds rather than instant, which is why
 * the toolchain is never fetched until someone actually presses Run, and why
 * `isToolchainAvailable` exists — where it has not been vendored, the caller
 * falls back to the interpreter rather than leaving Run broken.
 */

import type { ExecutionResult } from './PythonExecutor';
import { compile, isCompilerReady, type LoadProgress } from './emception/compiler';
import { runArtifact } from './emception/sandbox';

export type CppLanguage = 'c' | 'cpp';
export type { LoadProgress };

/** True once the toolchain is warm, which is what the Run label reflects. */
export function isWasmCppReady(): boolean {
  return isCompilerReady();
}

let availability: Promise<boolean> | null = null;

/**
 * Is the toolchain actually on this server?
 *
 * It is vendored by a build step into a gitignored folder, so a fresh checkout
 * that has not run it has no compiler. Asking for one small file answers that
 * without pulling any of the 355 MB behind it.
 */
export function isToolchainAvailable(): Promise<boolean> {
  availability ??= fetch('/emception/bootstrap.json', { method: 'HEAD' })
    .then((r) => r.ok)
    .catch(() => false);
  return availability;
}

/**
 * Compile and run. A compile error is a normal result, not a thrown error:
 * it is the most useful thing a student gets back, and it belongs in the same
 * place their program's output would have been.
 */
export async function runWasmCpp(
  code: string,
  stdin = '',
  language: CppLanguage = 'cpp',
  onProgress?: (p: LoadProgress) => void
): Promise<ExecutionResult> {
  const start = performance.now();
  const elapsed = () => Math.round(performance.now() - start);

  let built;
  try {
    built = await compile(code, language, onProgress);
  } catch (err: unknown) {
    return {
      output: '',
      error: `The compiler could not start: ${err instanceof Error ? err.message : String(err)}`,
      durationMs: elapsed(),
    };
  }

  if (!built.ok) {
    return { output: '', error: built.diagnostics, durationMs: elapsed() };
  }

  const run = await runArtifact(built.artifact, stdin);

  /* Warnings are worth showing, but never at the cost of hiding the program's
     own output — they go above it, the way a terminal would have shown them. */
  const output = built.diagnostics ? `${built.diagnostics}\n${run.output}` : run.output;

  return { output, error: run.error, durationMs: elapsed() };
}
