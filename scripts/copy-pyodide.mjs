/**
 * Copies the Pyodide runtime from node_modules into public/pyodide so the
 * in-browser Python environment is self-hosted (no CDN dependency).
 * Runs automatically before `npm run dev` and `npm run build`.
 *
 * Package wheels (e.g. Pillow for the image-manipulation lesson) are NOT part
 * of the npm package, so they are vendored here: taken from the npm cache when
 * present, otherwise fetched once from the version-pinned Pyodide CDN. Either
 * way every wheel is checked against the SHA-256 in pyodide-lock.json and the
 * build fails on a mismatch. The result is that students only ever fetch
 * Python packages from our own origin — never from a CDN, never from PyPI.
 *
 * PACKAGES must stay in sync with IMPORT_TO_PACKAGE in
 * components/code-editor/PythonExecutor.ts — that allowlist is what decides
 * which of these a lesson is actually allowed to import.
 */
import { copyFileSync, mkdirSync, existsSync, readFileSync, writeFileSync } from 'fs';
import { createHash } from 'crypto';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const src = join(root, 'node_modules', 'pyodide');
const dest = join(root, 'public', 'pyodide');

const FILES = [
  'pyodide.mjs',
  'pyodide.js',
  'pyodide.asm.js',
  'pyodide.asm.wasm',
  'python_stdlib.zip',
  'pyodide-lock.json',
];

/** Packages the curriculum may import (deps are resolved automatically). */
const PACKAGES = ['pillow'];

if (!existsSync(src)) {
  console.error('[copy-pyodide] pyodide package not found — run npm install');
  process.exit(1);
}

mkdirSync(dest, { recursive: true });
for (const file of FILES) {
  copyFileSync(join(src, file), join(dest, file));
}
console.log(`[copy-pyodide] ${FILES.length} runtime files → public/pyodide`);

/* ── Vendor the allowlisted wheels ── */

const lock = JSON.parse(readFileSync(join(src, 'pyodide-lock.json'), 'utf8'));
const version = lock.info.version;

/** package name → every wheel it needs, including transitive deps. */
function resolve(names) {
  const seen = new Set();
  const walk = (name) => {
    if (seen.has(name)) return;
    const pkg = lock.packages[name];
    if (!pkg) {
      console.error(`[copy-pyodide] "${name}" is not in pyodide-lock.json`);
      process.exit(1);
    }
    seen.add(name);
    for (const dep of pkg.depends ?? []) walk(dep);
  };
  names.forEach(walk);
  return [...seen];
}

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');

async function vendor(name) {
  const pkg = lock.packages[name];
  const out = join(dest, pkg.file_name);
  const cached = join(src, pkg.file_name);

  // Already vendored and intact? Nothing to do.
  if (existsSync(out) && sha256(readFileSync(out)) === pkg.sha256) {
    return `${name} (cached)`;
  }

  let buf;
  if (existsSync(cached)) {
    buf = readFileSync(cached);
  } else {
    const url = `https://cdn.jsdelivr.net/pyodide/v${version}/full/${pkg.file_name}`;
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`[copy-pyodide] could not download ${pkg.file_name}: HTTP ${res.status}`);
      process.exit(1);
    }
    buf = Buffer.from(await res.arrayBuffer());
  }

  const got = sha256(buf);
  if (got !== pkg.sha256) {
    console.error(
      `[copy-pyodide] SHA-256 mismatch for ${pkg.file_name}\n  expected ${pkg.sha256}\n  got      ${got}`
    );
    process.exit(1);
  }

  writeFileSync(out, buf);
  return `${name}@${pkg.version} (${(buf.length / 1048576).toFixed(1)} MB, sha256 ok)`;
}

const wheels = resolve(PACKAGES);
for (const name of wheels) {
  console.log(`[copy-pyodide] ${await vendor(name)}`);
}
console.log(`[copy-pyodide] ${wheels.length} wheel(s) → public/pyodide`);
