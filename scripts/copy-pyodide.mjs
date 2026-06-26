/**
 * Copies the Pyodide runtime from node_modules into public/pyodide so the
 * in-browser Python environment is self-hosted (no CDN dependency).
 * Runs automatically before `npm run dev` and `npm run build`.
 */
import { copyFileSync, mkdirSync, existsSync } from 'fs';
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

if (!existsSync(src)) {
  console.error('[copy-pyodide] pyodide package not found — run npm install');
  process.exit(1);
}

mkdirSync(dest, { recursive: true });
for (const file of FILES) {
  copyFileSync(join(src, file), join(dest, file));
}
console.log(`[copy-pyodide] ${FILES.length} files → public/pyodide`);
