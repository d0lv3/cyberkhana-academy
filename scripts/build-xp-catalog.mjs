/* Measure the built-in courses for the server's XP scoring, and copy their
 * answers to it.
 *
 * The backend is built from backend/ alone, so it cannot read the course files
 * under data/. This writes what it needs:
 *   backend/src/data/builtinXpCatalog.json   how long each built-in stop takes
 *   backend/src/data/builtinAnswerKey.json   the answers it marks them against
 *
 *   node scripts/build-xp-catalog.mjs          rewrite the files
 *   node scripts/build-xp-catalog.mjs --check  fail if either is out of date
 *
 * The build runs --check, because a stale catalog would have the server score
 * a new or edited built-in lesson differently from what the browser shows, and
 * a stale key would have it mark a quiz against answers that have moved.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const targets = {
  catalog: path.join(root, 'backend', 'src', 'data', 'builtinXpCatalog.json'),
  answers: path.join(root, 'backend', 'src', 'data', 'builtinAnswerKey.json'),
};
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

const files = {};
try {
  const source = await server.ssrLoadModule('/scripts/xp-catalog-source.ts');
  files.catalog = `${JSON.stringify(source.buildBuiltinXpCatalog(), null, 2)}\n`;
  files.answers = `${JSON.stringify(source.buildBuiltinAnswerKey(), null, 2)}\n`;
} finally {
  await server.close();
}

const stale = [];
for (const [name, target] of Object.entries(targets)) {
  const current = fs.existsSync(target) ? fs.readFileSync(target, 'utf8').replace(/\r\n/g, '\n') : '';
  if (current === files[name]) continue;
  if (check) {
    stale.push(path.relative(root, target));
  } else {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, files[name]);
    console.log(`[xp] wrote ${path.relative(root, target)}`);
  }
}

if (check) {
  if (stale.length) {
    console.error(
      `\n[xp] ${stale.join(' and ')} ${stale.length === 1 ? 'is' : 'are'} out of date with the built-in courses.\n` +
        '     Run `npm run xp:catalog` and commit the result.\n'
    );
    process.exit(1);
  }
  console.log('[xp] built-in XP catalog and answer key are up to date');
}
