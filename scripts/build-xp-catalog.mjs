/* Measure the built-in courses for the server's XP scoring.
 *
 * The backend is built from backend/ alone, so it cannot read the course files
 * under data/. This writes what it needs, how long each built-in stop takes,
 * to backend/src/data/builtinXpCatalog.json.
 *
 *   node scripts/build-xp-catalog.mjs          rewrite the file
 *   node scripts/build-xp-catalog.mjs --check  fail if it is out of date
 *
 * The build runs --check, because a stale file would have the server score a
 * new or edited built-in lesson differently from what the browser shows.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const target = path.join(root, 'backend', 'src', 'data', 'builtinXpCatalog.json');
const check = process.argv.includes('--check');

// Only the course files are loaded, so dependency pre-bundling is switched off:
// the deploy host is short on memory and this runs inside its build.
const server = await createServer({
  root,
  logLevel: 'error',
  appType: 'custom',
  optimizeDeps: { noDiscovery: true, include: [] },
  server: { middlewareMode: true, hmr: false, watch: null },
});

let json;
try {
  const { buildBuiltinXpCatalog } = await server.ssrLoadModule('/scripts/xp-catalog-source.ts');
  json = `${JSON.stringify(buildBuiltinXpCatalog(), null, 2)}\n`;
} finally {
  await server.close();
}

const current = fs.existsSync(target) ? fs.readFileSync(target, 'utf8').replace(/\r\n/g, '\n') : '';

if (check) {
  if (current !== json) {
    console.error(
      '\n[xp] backend/src/data/builtinXpCatalog.json is out of date with the built-in courses.\n' +
        '     Run `npm run xp:catalog` and commit the file.\n'
    );
    process.exit(1);
  }
  console.log('[xp] built-in XP catalog is up to date');
} else {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, json);
  console.log(`[xp] wrote ${path.relative(root, target)}`);
}
