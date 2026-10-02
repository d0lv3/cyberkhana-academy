import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';

// Bundle the actual services, keeping the tests independent of Vite and a real account.
const root = fileURLToPath(new URL('../', import.meta.url));
const bundle = await build({
  stdin: { contents: `
    export * from './services/codeDrafts';
    export * from './services/loginDestination';
    export * from './services/syncService';
    export * from './services/creatorTypes';
    export * from './services/api';
    export * from './components/code-editor/emception/compiler';`, resolveDir: root },
  bundle: true, write: false, platform: 'node', format: 'esm',
  define: { 'import.meta.env.VITE_API_URL': JSON.stringify('http://fixture.invalid/api') },
});
class MemoryStorage {
  data = new Map();
  get length() { return this.data.size; }
  key(index) { return [...this.data.keys()][index] ?? null; }
  getItem(key) { return this.data.get(key) ?? null; }
  setItem(key, value) { this.data.set(key, String(value)); }
  removeItem(key) { this.data.delete(key); }
  clear() { this.data.clear(); }
}
globalThis.localStorage = new MemoryStorage();
globalThis.sessionStorage = new MemoryStorage();
globalThis.window = new EventTarget();
const s = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const owner = { id: 'student-a', displayName: 'Student A' };
const counts = new Map();
let failReads = false;
let failWrites = false;
let mine = {};
let remoteProgress = null;
let written = [];
const originalWarn = console.warn;
console.warn = () => {};
function installApi() {
  globalThis.fetch = async (url, options = {}) => {
    const endpoint = String(url).replace('http://fixture.invalid/api', '');
    const method = options.method ?? 'GET';
    const key = `${method} ${endpoint}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
    if (method === 'PUT') {
      if (failWrites) return json({ error: 'Temporary outage' }, 503);
      written.push({ endpoint, body: JSON.parse(options.body) });
      return json({ xp: 0 });
    }
    if (failReads && endpoint !== '/content/mine') return json({ error: 'Temporary outage' }, 503);
    if (endpoint === '/content/published') return json({ buckets: {} });
    if (endpoint === '/progress') return json({ progress: remoteProgress, xp: 0 });
    if (endpoint === '/content/mine') return Object.keys(mine).length ? json({ buckets: mine }) : json({ error: 'Forbidden' }, 403);
    throw new Error(`Unexpected fixture request: ${key}`);
  };
}

try {
  const draft = { code: 'print("my work")', stdin: 'input\n' };
  const a = s.codeDraftKey(owner.id, 'python:module:lesson');
  const b = s.codeDraftKey('student-b', 'python:module:lesson');
  const otherLesson = s.codeDraftKey(owner.id, 'python:module:other');
  assert.equal(s.writeCodeDraft(a, draft), true);
  assert.deepEqual(s.readCodeDraft(a), draft);
  assert.equal(s.readCodeDraft(b), null, 'another account cannot inherit a draft');
  assert.equal(s.readCodeDraft(otherLesson), null, 'another lesson cannot inherit a draft');
  localStorage.setItem(otherLesson, '{broken');
  assert.equal(s.readCodeDraft(otherLesson), null);
  s.clearCodeDraft(a);
  assert.equal(s.readCodeDraft(a), null);
  s.writeCodeDraft(a, draft);
  s.writeCodeDraft(b, draft);
  s.clearAccountCodeDrafts(owner.id);
  assert.equal(s.readCodeDraft(a), null);
  assert.deepEqual(s.readCodeDraft(b), draft);
  const storage = globalThis.localStorage;
  globalThis.localStorage = { getItem() { throw new Error('Blocked'); }, setItem() { throw new Error('Quota'); } };
  assert.equal(s.readCodeDraft(a), null);
  assert.equal(s.writeCodeDraft(a, draft), false, 'storage failures must not claim to save');
  globalThis.localStorage = storage;
  console.log('PASS: draft restoration, account/lesson isolation, reset, deletion, corrupt/blocked storage.');

  const lesson = '/fundamentals/programming/python/start/hello?tab=code#example';
  assert.equal(s.safeLoginDestination(lesson), lesson);
  assert.equal(new URLSearchParams(s.loginPath(lesson).split('?')[1]).get('next'), lesson);
  for (const invalid of [null, '/', '/login', '/login?next=/login', '//evil.example', 'https://evil.example', '/\\evil', '/dashboard\n']) {
    assert.equal(s.safeLoginDestination(invalid), '/dashboard');
  }
  console.log('PASS: lesson/query/anchor preservation and safe login destinations.');

  installApi();
  failReads = true;
  await s.hydrateFromServer(owner);
  assert.deepEqual([...s.getSyncStatus().failedLoads].sort(), ['courses', 'progress']);
  failReads = false;
  await s.retrySync();
  assert.deepEqual(s.getSyncStatus().failedLoads, []);
  assert.equal(counts.get('GET /content/mine'), 1, 'successful/expected reads are not repeated');
  assert.equal(counts.get('GET /content/published'), 2);
  console.log('PASS: failed course/progress loads are visible and only failed reads retry.');

  localStorage.setItem('academy-paths-enrolled', JSON.stringify(['my-path']));
  s.queueProgressPush();
  failWrites = true;
  await s.flushPendingSync();
  assert.equal(s.getSyncStatus().saveFailed, true);
  assert.equal(localStorage.getItem('academy-bookmarks-unsaved'), '1');
  s.setSyncEnabled(false);
  s.forgetServerBackedCaches();
  assert.deepEqual(JSON.parse(localStorage.getItem('academy-paths-enrolled')), ['my-path'], 'failed saves survive sign-out');
  failWrites = false;
  await s.hydrateFromServer(owner);
  await s.flushPendingSync();
  assert.deepEqual(written.at(-1).body.enrolledPaths, ['my-path']);
  assert.equal(localStorage.getItem('academy-bookmarks-unsaved'), null);
  assert.equal(s.getSyncStatus().saveFailed, false);
  console.log('PASS: failed bookmark saves survive sign-out and retry without losing changes.');

  const [storageKey, bucket] = Object.entries(s.SERVER_BUCKET_BY_STORAGE_KEY)[0];
  const items = [{ id: 'unsaved-creator-item' }];
  localStorage.setItem(storageKey, JSON.stringify(items));
  s.queueContentPush(storageKey, items);
  failWrites = true;
  await s.flushPendingSync();
  s.setSyncEnabled(false);
  s.forgetServerBackedCaches();
  failWrites = false;
  mine = { [bucket]: [] };
  // Most returning members already have server progress. Its earlier response
  // must not erase the pending creator marker before /content/mine arrives.
  remoteProgress = { programming: {}, osModules: {}, networking: [], enrolledPaths: [], enrolledModules: [] };
  await s.hydrateFromServer(owner);
  await s.flushPendingSync();
  assert.deepEqual(JSON.parse(localStorage.getItem(storageKey)), items);
  assert.deepEqual(written.findLast(item => item.endpoint === `/content/${bucket}`).body.items, items, 'reconnecting cannot replace unsaved work with older server content');
  remoteProgress = null;
  console.log('PASS: unsaved creator changes survive sign-out and server rehydration.');

  let release;
  const delayed = new Promise(resolve => { release = resolve; });
  globalThis.fetch = async url => {
    const endpoint = String(url).split('/api')[1];
    if (endpoint === '/content/published') return delayed;
    return json({ progress: null, xp: 0, buckets: {} });
  };
  const stale = s.hydrateFromServer({ id: 'old-account', displayName: 'Old' });
  installApi();
  mine = {};
  await s.hydrateFromServer({ id: 'new-account', displayName: 'New' });
  release(json({ buckets: { 'networking-lessons': [{ id: 'stale-content' }] } }));
  await stale;
  assert.equal(localStorage.getItem(s.CACHE_OWNER_KEY), 'new-account');
  assert.deepEqual(JSON.parse(localStorage.getItem(s.PUBLISHED_CACHE_KEYS.NETWORKING_LESSONS)), []);
  s.setSyncEnabled(false);
  console.log('PASS: late responses from an old session cannot overwrite the new account.');

  installApi();
  await s.hydrateFromServer(owner);
  let rejectWrite;
  globalThis.fetch = () => new Promise((_, reject) => { rejectWrite = reject; });
  s.queueProgressPush();
  const staleWrite = s.flushPendingSync();
  // Let flushPendingSync advance past its content phase into the bookmark request.
  await new Promise(resolve => setImmediate(resolve));
  s.setSyncEnabled(false);
  installApi();
  await s.hydrateFromServer({ id: 'next-account', displayName: 'Next' });
  rejectWrite(new Error('Old account request failed late'));
  await staleWrite;
  assert.equal(s.getSyncStatus().saveFailed, false, 'old failures cannot create a warning for the new account');
  s.setSyncEnabled(false);
  console.log('PASS: late save failures cannot contaminate a new session.');

  const progress = [];
  globalThis.fetch = async url => String(url).endsWith('bootstrap.json')
    ? json({ archive: 'compiler.br', bytes: 4 })
    : new Response(new ReadableStream({ start(controller) {
      controller.enqueue(new Uint8Array([1, 2])); controller.enqueue(new Uint8Array([3, 4])); controller.close();
    } }));
  globalThis.Worker = class { constructor() { throw new Error('fixture-worker-start'); } };
  await assert.rejects(s.ensureCompiler(p => progress.push(p)), /fixture-worker-start/);
  assert.deepEqual(progress.filter(p => p.phase === 'downloading').map(p => p.fraction), [0, 0.5, 1]);
  assert.equal(progress.at(-1).phase, 'starting');
  const controller = new AbortController();
  globalThis.fetch = (_, { signal }) => new Promise((_, reject) => signal.addEventListener('abort', () => reject(signal.reason), { once: true }));
  const cancelled = s.ensureCompiler(() => {}, controller.signal);
  controller.abort();
  await assert.rejects(cancelled, /cancelled/i);
  globalThis.fetch = async () => json({ error: 'Unavailable' }, 503);
  await assert.rejects(s.ensureCompiler(), /unavailable/i, 'a cancelled load must allow a new attempt');
  console.log('PASS: real download fractions, cancellation settles a stalled fetch, and retry is available.');

  const realTimeout = globalThis.setTimeout;
  globalThis.setTimeout = (fn, ms, ...args) => realTimeout(fn, ms === 20_000 ? 1 : ms, ...args);
  try {
    globalThis.fetch = (_, { signal }) => new Promise((_, reject) => signal.addEventListener('abort', () => reject(new Error('Aborted')), { once: true }));
    await assert.rejects(s.api.get('/slow'), /connection timed out/i);
  } finally { globalThis.setTimeout = realTimeout; }
  console.log('PASS: an API request that never answers ends in a recoverable timeout.');
} finally {
  s.setSyncEnabled(false);
  console.warn = originalWarn;
}
