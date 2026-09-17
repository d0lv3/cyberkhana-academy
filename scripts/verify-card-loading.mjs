/** Browser regression: node scripts/verify-card-loading.mjs
 * Requires Playwright (or PLAYWRIGHT_MODULE pointing to its installed entry).
 * Set BROWSER_EXECUTABLE to use an existing Chrome/Chromium installation.
 * The fixture is served only by this script; it is never part of the app.
 */
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE
  ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const harness = `
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { LangProvider, useLang } from '/contexts/LangContext';
import ModuleCard from '/components/fundamentals/ModuleCard';
import LanguageCard from '/components/fundamentals/LanguageCard';
import NetworkingLessonCard from '/components/fundamentals/NetworkingLessonCard';
import PathCard from '/components/paths/PathCard';
import '/index.css';
const title = { en: 'Security fundamentals', ar: 'أساسيات الأمن السيبراني' };
const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="#135e47" /></svg>';
function Fixture() {
  const [version, setVersion] = useState('initial');
  const [visible, setVisible] = useState(true);
  const [tick, setTick] = useState(0);
  const { setLang } = useLang();
  const location = useLocation();
  const cover = (kind) => version === 'none' ? undefined : version === 'svg' ? svg : '/__card-cover/' + kind + '-' + version + '.svg';
  return <main className="p-6" style={{ background: '#0d1117', minHeight: '100vh' }}>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, color: 'white' }}>
      {['initial', 'broken', 'replacement', 'stale', 'lazy', 'none', 'svg'].map(v => <button key={v} onClick={() => setVersion(v)}>{v}</button>)}
      <button onClick={() => setVisible(v => !v)}>toggle</button>
      <button onClick={() => setTick(t => t + 1)}>rerender</button>
      <button onClick={() => setLang('ar')}>Arabic</button>
    </div>
    <output data-route>{location.pathname}</output><output data-tick>{tick}</output>
    {visible && <div data-grid className="mt-6 grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
      <ModuleCard module={{ id:'m', slug:'module', title, description:title, category:'general', contentType:'mixed', difficulty:'Beginner', tags:[], author:'CyberKhana', estimatedHours:2, totalLessons:3, totalModules:1, totalQuizzes:0, iconColor:'#00a859', coverImage:cover('module') }} />
      <LanguageCard language={{ id:'l', slug:'python', name:'Python', description:title, color:'#60a5fa', available:true, modules:[], coverSvg:cover('language') }} />
      <NetworkingLessonCard lesson={{ id:'n', slug:'network', title, description:title, order:0, estimatedMinutes:15, tags:[], markdownContent:title, coverSvg:cover('network') }} />
      <PathCard path={{ id:'p', slug:'path', title, description:title, difficulty:'Beginner', color:'#a78bfa', estimatedHours:3, steps:[], coverImage:cover('path') }} />
    </div>}
  </main>;
}
createRoot(document.getElementById('root')).render(<React.StrictMode><MemoryRouter><LangProvider><Fixture /></LangProvider></MemoryRouter></React.StrictMode>);
`;
const server = await createServer({
  root,
  server: { port: 0, host: '127.0.0.1', open: false },
  plugins: [{
    name: 'card-loading-fixture',
    resolveId(id) { if (id === '/__card-loading.tsx') return id; },
    load(id) { if (id === '/__card-loading.tsx') return harness; },
    configureServer(vite) {
      vite.middlewares.use(async (req, res, next) => {
        if (req.url !== '/__card-loading') return next();
        res.setHeader('Content-Type', 'text/html');
        res.end(await vite.transformIndexHtml(req.url, '<!doctype html><html><head></head><body><div id="root"></div><script type="module" src="/__card-loading.tsx"></script></body></html>'));
      });
    },
  }],
});
let browser;
try {
  await server.listen();
  browser = await chromium.launch({ headless: true, executablePath: process.env.BROWSER_EXECUTABLE });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const pending = new Map();
  const counts = new Map();
  const artwork = '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="#135e47"/><circle cx="200" cy="170" r="90" fill="#25836a"/></svg>';
  await page.route('**/__card-cover/**', async route => {
    const name = new URL(route.request().url()).pathname;
    counts.set(name, (counts.get(name) || 0) + 1);
    if (name.includes('broken')) return route.fulfill({ status: 404, body: '' });
    await new Promise(resolve => pending.set(name, resolve));
    await route.fulfill({ contentType: 'image/svg+xml', body: artwork });
  });
  await page.addInitScript(() => {
    const decode = HTMLImageElement.prototype.decode;
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    window.releaseCardDecode = release;
    HTMLImageElement.prototype.decode = async function () {
      await decode.call(this);
      if (this.src.includes('-initial.svg')) await gate;
    };
  });
  const url = server.resolvedUrls.local[0] + '__card-loading';
  await page.goto(url);
  const cards = page.locator('[data-grid] > [role="button"]');
  const waitReady = () => page.waitForFunction(() => document.querySelectorAll('[data-grid] > [aria-busy="false"]').length === 4);
  const waitPending = () => page.waitForFunction(() => document.querySelectorAll('[data-card-skeleton]').length === 4);
  const release = version => { for (const [name, done] of pending) if (name.includes('-' + version + '.svg')) { done(); pending.delete(name); } };
  await waitPending();
  const before = await cards.evaluateAll(nodes => nodes.map(n => ({ width:n.clientWidth, height:n.clientHeight })));
  assert.deepEqual(await cards.evaluateAll(nodes => nodes.map(n => [n.tabIndex, n.firstElementChild.style.opacity])), Array(4).fill([-1, '0']));
  await cards.first().dispatchEvent('click');
  assert.equal(await page.locator('[data-route]').textContent(), '/');
  await page.waitForFunction(() => [...document.images].filter(i => i.src.includes('/__card-cover/')).length === 4);
  // Wait for requests to be intercepted, with a bounded assertion timeout.
  for (let i = 0; pending.size < 4 && i < 100; i++) await new Promise(r => setTimeout(r, 50));
  assert.equal(pending.size, 4);
  release('initial');
  await page.waitForFunction(() => [...document.images].filter(i => i.src.includes('/__card-cover/')).every(i => i.complete));
  assert.equal(await page.locator('[data-card-skeleton]').count(), 4, 'wait for decode, not only download');
  if (process.env.CARD_SCREENSHOT_DIR) await page.screenshot({ path: path.join(process.env.CARD_SCREENSHOT_DIR, 'cards-loading.png') });
  await page.evaluate(() => window.releaseCardDecode());
  await waitReady();
  assert.deepEqual(await cards.evaluateAll(nodes => nodes.map(n => ({ width:n.clientWidth, height:n.clientHeight }))), before, 'no layout shift');
  assert.equal(await page.locator('[data-card-skeleton]').count(), 0);
  assert.ok([...counts.values()].every(n => n === 1), 'one image request per card');
  if (process.env.CARD_SCREENSHOT_DIR) await page.screenshot({ path: path.join(process.env.CARD_SCREENSHOT_DIR, 'cards-ready.png') });
  // Watch all mutations so even a transient skeleton on a cached remount fails.
  await page.evaluate(() => {
    window.skeletonFlashes = 0;
    new MutationObserver(records => {
      for (const r of records) for (const n of r.addedNodes) if (n instanceof Element && (n.matches('[data-card-skeleton]') || n.querySelector('[data-card-skeleton]'))) window.skeletonFlashes++;
    }).observe(document.body, { childList:true, subtree:true });
  });
  await page.getByRole('button', { name:'rerender', exact:true }).click();
  await page.getByRole('button', { name:'toggle', exact:true }).click();
  await page.getByRole('button', { name:'toggle', exact:true }).click();
  await waitReady();
  assert.equal(await page.evaluate(() => window.skeletonFlashes), 0, 'cached remount never replays skeleton');
  assert.ok([...counts.values()].every(n => n === 1), 'cached remount does not refetch');
  await page.getByRole('button', { name:'stale', exact:true }).click();
  await waitPending();
  for (let i = 0; pending.size < 4 && i < 100; i++) await new Promise(r => setTimeout(r, 50));
  await page.getByRole('button', { name:'replacement', exact:true }).click();
  await waitPending();
  for (let i = 0; pending.size < 8 && i < 100; i++) await new Promise(r => setTimeout(r, 50));
  release('stale');
  assert.equal(await page.locator('[data-card-skeleton]').count(), 4, 'old cover cannot reveal replacement');
  release('replacement');
  await waitReady();
  await page.getByRole('button', { name:'broken', exact:true }).click();
  await waitReady();
  assert.equal(await page.locator('[data-grid] img[src*="/__card-cover/"]').count(), 0, 'failed covers replaced by fallback');
  await page.getByRole('button', { name:'none', exact:true }).click();
  await waitReady();
  await page.getByRole('button', { name:'svg', exact:true }).click();
  await waitReady();
  assert.equal(await page.locator('[data-grid] img[src^="data:image/svg+xml"]').count(), 4, 'uploaded SVG stays sandboxed in an image');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width:375, height:812 });
  await page.getByRole('button', { name:'Arabic', exact:true }).click();
  assert.equal(await page.locator('#root > div').getAttribute('dir'), 'rtl');
  assert.ok(await cards.evaluateAll(nodes => nodes.every(n => n.clientWidth <= 327)), 'cards fit phone width');
  if (process.env.CARD_SCREENSHOT_DIR) await page.locator('[data-grid]').screenshot({ path: path.join(process.env.CARD_SCREENSHOT_DIR, 'cards-mobile-rtl.png') });
  // A distant lazy cover must load once it is scrolled into view, even
  // though its image is hidden underneath the skeleton.
  await page.locator('[data-grid]').evaluate(n => n.style.marginTop = '10000px');
  await page.getByRole('button', { name:'lazy', exact:true }).click();
  await waitPending();
  assert.equal(await cards.first().locator('[data-card-skeleton]').evaluate(n => getComputedStyle(n).animationName), 'none', 'respects reduced motion');
  await cards.last().scrollIntoViewIfNeeded();
  for (let i = 0; pending.size < 4 && i < 100; i++) await new Promise(r => setTimeout(r, 50));
  assert.equal(pending.size, 4, 'lazy images start when near viewport');
  release('lazy');
  await waitReady();
  await cards.first().focus();
  assert.equal(await cards.first().evaluate(n => document.activeElement === n), true, 'ready card can receive keyboard focus');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => document.querySelector('[data-route]').textContent === '/modules/module');
  assert.equal(await page.locator('[data-route]').textContent(), '/modules/module');
  assert.deepEqual(errors, []);
  console.log('PASS: four card types; slow download/decode; single request; stable geometry; cached rerender/remount; stale cover race; failures; no cover; SVG; phone/RTL; keyboard navigation.');
} finally {
  await browser?.close();
  await server.close();
}
