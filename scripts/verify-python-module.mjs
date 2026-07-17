/**
 * Verifies a Python course module against the REAL student runtime
 * (pyodide 0.26.2 / CPython 3.12.1), mirroring PythonExecutor.ts.
 *
 *  - every lesson's starterCode must run without error
 *  - every challenge's solution must run and produce expectedOutput exactly
 *
  * Usage: npm run verify:python -- ./data/programming/python/01-getting-started.ts
 */
import { loadPyodide } from 'pyodide';
import { resolve } from 'path';
import { pathToFileURL } from 'url';

const IMPORT_TO_PACKAGE = { PIL: 'pillow' };
function packagesFor(code) {
  const mods = new Set();
  const re = /^[ \t]*(?:import[ \t]+([A-Za-z_][\w.]*)|from[ \t]+([A-Za-z_][\w.]*)[ \t]+import)/gm;
  let m;
  while ((m = re.exec(code)) !== null) {
    const top = (m[1] || m[2] || '').split('.')[0];
    if (top && IMPORT_TO_PACKAGE[top]) mods.add(IMPORT_TO_PACKAGE[top]);
  }
  return [...mods];
}

const py = await loadPyodide();
const pyVersion = py.runPython('import sys; sys.version').split(' ')[0];

async function run(code, stdin) {
  const needed = packagesFor(code);
  if (needed.length) await py.loadPackage(needed);
  py.runPython(`
import sys, io
sys.stdout = io.StringIO(); sys.stderr = io.StringIO()
${stdin !== undefined ? `sys.stdin = io.StringIO(${JSON.stringify(stdin)})` : ''}
`);
  let error = null;
  try {
    await py.runPythonAsync(code);
  } catch (e) {
    error = e.message?.split('\n').filter(Boolean).pop() ?? String(e);
  }
  py.runPython(`
__o = sys.stdout.getvalue(); __e = sys.stderr.getvalue()
sys.stdout = sys.__stdout__; sys.stderr = sys.__stderr__
`);
  return { out: py.globals.get('__o') || '', err: py.globals.get('__e') || '', error };
}

const target = process.argv[2];
if (!target) {
  console.error('Usage: npm run verify:python -- <path/to/module.ts>');
  process.exit(2);
}
// Resolve against the cwd, not this script's directory.
const mod = (await import(pathToFileURL(resolve(process.cwd(), target)).href)).default;

console.log(`\nRuntime: CPython ${pyVersion}`);
console.log(`Module:  ${mod.title.en}  (${mod.concepts.length} concepts)\n`);

let fail = 0;
for (const c of mod.concepts) {
  const label = `${c.type.padEnd(9)} ${c.slug}`;

  // 1. A lesson's starterCode must run cleanly — it's demonstration code the
  //    student will Run as-is. A challenge's starter is deliberately
  //    incomplete, so it may raise; only its solution has to work.
  const s = await run(c.starterCode, c.sampleInput);
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
      const r = await run(c.solution, tc.input);
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
