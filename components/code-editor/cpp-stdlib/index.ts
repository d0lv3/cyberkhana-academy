/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * The C++ standard-library pieces JSCPP does not ship, assembled for the
 * runner. See cppString.ts and cppVector.ts for what each provides and why it
 * has to be built this way.
 *
 * Imports inside this folder carry a `.ts` extension, unlike the rest of the
 * app. That is deliberate: scripts/verify-cpp-stdlib.mjs runs this logic under
 * plain node, which resolves ES modules by exact filename, and testing the
 * interpreter glue against real programs is worth the small inconsistency.
 * The project's tsconfig already enables allowImportingTsExtensions.
 */

import { installString, wireStringToStreams } from './cppString.ts';
import { installVector, eraseTemplateArgs } from './cppVector.ts';

export { eraseTemplateArgs };
export { findConstViolation, type ConstViolation } from './constCheck.ts';

/**
 * Headers to merge into JSCPP's own set. `mergeConfig` merges the includes map
 * deeply, so this adds entries without disturbing iostream and friends.
 */
export const CPP_STDLIB_INCLUDES = {
  string: {
    load(rt: any) {
      wireStringToStreams(rt, installString(rt));
    },
  },
  vector: {
    load(rt: any) {
      installVector(rt);
      // A vector of strings is the common case, so make sure both exist.
      wireStringToStreams(rt, installString(rt));
    },
  },
};

/**
 * Make the containers available whether or not the student wrote the include.
 *
 * On a real compiler `<iostream>` transitively drags in `<string>`, so
 * `string s;` compiles with no `#include <string>` in sight — and students
 * reasonably expect the same here. The includes are APPENDED rather than
 * prepended: registration happens while the preprocessor runs, long before
 * `main` executes, and putting them at the end leaves every line number in the
 * student's own code untouched for error reporting.
 *
 * Wrapping JSCPP's iostream would achieve the same thing, but `mergeConfig`
 * mutates the package's shared includes object, so the wrapper would end up
 * replacing the very function it means to call.
 */
export function withStdlibIncludes(source: string): string {
  return `${source}\n#include <string>\n#include <vector>\n`;
}

/** Everything the source needs before JSCPP sees it. */
export function prepareCppSource(source: string): string {
  return withStdlibIncludes(eraseTemplateArgs(source));
}
