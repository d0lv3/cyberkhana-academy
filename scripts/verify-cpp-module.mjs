/**
 * Verifies a C or C++ course module against the REAL student runtime (JSCPP),
 * mirroring CppExecutor.ts.
 *
 *  - every lesson's starterCode must run without error
 *  - every challenge's solution must run and produce expectedOutput exactly
 *
 * Worth running on any new module: JSCPP is an interpreter of a SUBSET, so
 * plausible-looking C++ can fail to parse (notably `std::cout` — write
 * `using namespace std;` and bare `cout` instead, and note that classes and
 * structs are rejected by the grammar outright).
 *
 * Usage: npm run verify:cpp -- ./data/programming/cpp/01-getting-started.ts
 */
import JSCPP from 'JSCPP';
import { resolve } from 'path';
import { pathToFileURL } from 'url';
import { installString, wireStringToStreams } from '../components/code-editor/cpp-stdlib/cppString.ts';
import { installVector, eraseTemplateArgs } from '../components/code-editor/cpp-stdlib/cppVector.ts';
import { findConstViolation } from '../components/code-editor/cpp-stdlib/constCheck.ts';

const MAX_TIMEOUT_MS = 10_000;

/* Mirrors CppExecutor: the same added headers, the same source preparation and
   the same const check, so a lesson that passes here behaves the same in the
   browser. Keep in step with cpp-stdlib/index.ts. */
const INCLUDES = {
  string: { load: (rt) => wireStringToStreams(rt, installString(rt)) },
  vector: {
    load: (rt) => {
      installVector(rt);
      wireStringToStreams(rt, installString(rt));
    },
  },
};

function run(code, stdin = '') {
  const violation = findConstViolation(code);
  if (violation) return { out: '', error: violation.message };
  let out = '';
  try {
    const prepared = `${eraseTemplateArgs(code)}\n#include <string>\n#include <vector>\n`;
    JSCPP.run(prepared, stdin ?? '', {
      stdio: { write: (s) => { out += s; } },
      includes: INCLUDES,
      maxTimeout: MAX_TIMEOUT_MS,
    });
    return { out, error: null };
  } catch (e) {
    return { out, error: (e?.message ?? String(e)).split('\n').filter(Boolean)[0] };
  }
}

const target = process.argv[2];
if (!target) {
  console.error('Usage: npm run verify:cpp -- <path/to/module.ts>');
  process.exit(2);
}
// Resolve against the cwd, not this script's directory.
const mod = (await import(pathToFileURL(resolve(process.cwd(), target)).href)).default;

console.log(`\nRuntime: JSCPP (C/C++ interpreter, subset)`);
console.log(`Module:  ${mod.title.en}  (${mod.concepts.length} concepts)\n`);

let fail = 0;
for (const c of mod.concepts) {
  const label = `${c.type.padEnd(9)} ${c.slug}`;

  // 1. A lesson's starterCode must run cleanly — it's demonstration code the
  //    student will Run as-is. A challenge's starter is deliberately
  //    incomplete, so it may fail; only its solution has to work.
  const s = run(c.starterCode, c.sampleInput ?? '');
  if (s.error && c.type === 'lesson') {
    console.log(`FAIL  ${label}\n      starterCode raised: ${s.error}`);
    fail++;
  } else if (s.error) {
    console.log(`ok    ${label}  (starter incomplete by design: ${s.error.slice(0, 48)})`);
  } else {
    console.log(`ok    ${label}  (starter ran, ${s.out.split('\n').filter(Boolean).length} output lines)`);
  }

  // 2. challenges: solution must reproduce expectedOutput exactly
  if (c.type === 'challenge') {
    for (const tc of c.testCases ?? []) {
      const r = run(c.solution, tc.input ?? '');
      const got = r.out.trim();
      const want = tc.expectedOutput.trim();
      if (r.error) {
        console.log(`FAIL  ${label} :: ${tc.id}\n      solution raised: ${r.error}`);
        fail++;
      } else if (got !== want) {
        console.log(`FAIL  ${label} :: ${tc.id}`);
        console.log(`      expected: ${JSON.stringify(want)}`);
        console.log(`      got     : ${JSON.stringify(got)}`);
        fail++;
      } else {
        console.log(`  ok    ${label} :: ${tc.id}  solution output == expectedOutput`);
      }
    }
  }
}

console.log(fail === 0 ? '\nAll checks passed.\n' : `\n${fail} check(s) FAILED.\n`);
process.exit(fail === 0 ? 0 : 1);
