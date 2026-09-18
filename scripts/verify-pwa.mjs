// Build first. Requires Playwright (or PLAYWRIGHT_MODULE) and Chromium.
// API fixtures and external request blocking keep this check entirely local.
import { createServer } from 'node:http';
import { readFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const root = fileURLToPath(new URL('../', import.meta.url));
const dist = path.join(root, 'dist');
const output = process.env.PWA_QA_OUTPUT || path.join(os.tmpdir(), 'academy-pwa-review');
await mkdir(output, { recursive: true });
const server = createServer(async (req, res) => {
  const file = path.resolve(dist, '.' + new URL(req.url, 'http://localhost').pathname);
  if (!file.startsWith(dist + path.sep) && file !== dist) return res.writeHead(403).end();
  try {
    const target = file === dist ? path.join(dist, 'index.html') : file;
    const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
    res.writeHead(200, { 'Content-Type': mime[path.extname(target)] || 'application/octet-stream', 'Cache-Control': 'no-cache' }).end(await readFile(target));
  } catch { res.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXECUTABLE || undefined, headless: true });
const profiles = [];
const user = { _id: 'local-review', username: 'reviewer', displayName: 'Local Reviewer', role: 'user', university: 'University of Baghdad', email: 'review@example.invalid', createdAt: '2026-01-01' };
let checks = 0;
async function open({ lang = 'en', width = 390, ios = false, standalone = false, signedIn = true, route = '/dashboard', touch = true, snoozed = false, persistent = false } = {}) {
  const options = { viewport: { width, height: 844 }, hasTouch: touch, isMobile: touch, reducedMotion: 'reduce',
    ...(ios ? { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1' } : {}),
  };
  const profile = persistent ? await mkdtemp(path.join(os.tmpdir(), 'academy-pwa-test-')) : null;
  const context = profile
    ? await chromium.launchPersistentContext(profile, { ...options, executablePath: process.env.BROWSER_EXECUTABLE || undefined, headless: true })
    : await browser.newContext(options);
  if (profile) profiles.push({ profile, context });
  await context.addInitScript(({ lang, standalone, snoozed }) => {
    if (!localStorage.getItem('academy-lang')) localStorage.setItem('academy-lang', lang);
    localStorage.setItem('academy-lang-chosen', '1');
    localStorage.setItem('academy-tour-seen', 'skipped');
    if (snoozed) localStorage.setItem('academy-install-dismissed-until', String(Date.now() + 86400000));
    if (standalone) Object.defineProperty(navigator, 'standalone', { value: true });
    // Exercise fallback and synthetic outcomes deterministically. The manifest
    // and real service worker are checked separately via Chromium below.
    window.addEventListener('beforeinstallprompt', event => {
      if (event.isTrusted) { event.preventDefault(); event.stopImmediatePropagation(); }
    });
  }, { lang, standalone, snoozed });
  await context.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.pathname.includes('/api/')) {
      const endpoint = url.pathname.split('/api/')[1];
      const data = endpoint === 'auth/me' ? { user: signedIn ? user : null } : endpoint === 'progress' ? { progress: null, xp: 0 } : endpoint.startsWith('content/') ? { buckets: {} } : {};
      return route.fulfill({ json: data, headers: { 'Access-Control-Allow-Origin': base, 'Access-Control-Allow-Credentials': 'true' } });
    }
    if (url.origin !== base) return route.abort();
    return route.continue();
  });
  const page = await context.newPage();
  page.on('pageerror', error => { throw error; });
  await page.goto(`${base}/#${route}`);
  await page.waitForFunction(() => document.querySelector('.app-main') || document.querySelector('nav') || document.querySelector('main'));
  return { context, page, banner: page.locator('[data-pwa-install]') };
}
async function fit(page) {
  const sizes = await page.evaluate(() => {
    const main = document.querySelector('.app-main');
    return { page: document.documentElement.scrollWidth, viewport: innerWidth, main: main?.clientWidth, scroll: main?.scrollWidth };
  });
  assert(sizes.page <= sizes.viewport + 1 && (!sizes.main || sizes.scroll <= sizes.main + 1), JSON.stringify(sizes));
}
async function prompt(page, outcome) {
  await page.evaluate(outcome => {
    const event = new Event('beforeinstallprompt', { cancelable: true });
    event.prompt = async () => { window.promptCalls = (window.promptCalls || 0) + 1; if (outcome === 'error') throw new Error('withdrawn'); };
    event.userChoice = Promise.resolve({ outcome });
    window.dispatchEvent(event);
  }, outcome);
}
try {
  for (const lang of ['en', 'ar']) {
    for (const ios of [false, true]) {
      for (const width of [320, 390]) {
        const { context, page, banner } = await open({ lang, ios, width });
        await banner.waitFor();
        assert((await banner.innerText()).includes(lang === 'ar' ? 'ثبّت تطبيق الأكاديمية' : 'Install the Academy app'));
        await banner.getByRole('button', { name: lang === 'ar' ? 'طريقة التثبيت' : 'How to install' }).click();
        assert.equal(await banner.locator('li').count(), 3);
        assert((await banner.locator('li').first().innerText()).includes(ios ? lang === 'ar' ? 'المشاركة' : 'Share' : lang === 'ar' ? 'قائمة المتصفح' : 'browser’s menu'));
        await fit(page);
        await page.screenshot({ path: path.join(output, `${lang}-${ios ? 'ios' : 'android'}-${width}.png`) });
        await banner.getByRole('button', { name: lang === 'ar' ? 'ليس الآن' : 'Not now' }).click();
        await banner.waitFor({ state: 'detached' });
        await page.reload();
        await page.locator('.app-main').waitFor();
        assert.equal(await banner.count(), 0);
        assert(await page.evaluate(() => Number(localStorage.getItem('academy-install-dismissed-until')) > Date.now()));
        checks++;
        await context.close();
      }
    }
  }
  for (const outcome of ['accepted', 'dismissed', 'error']) {
    const { context, page, banner } = await open();
    await banner.waitFor();
    await prompt(page, outcome);
    // The deferred browser event must survive switching pages.
    await page.evaluate(() => { location.hash = '#/profile'; });
    await banner.getByRole('button', { name: 'Install app', exact: true }).click();
    if (outcome === 'error') await banner.locator('ol').waitFor();
    else await banner.waitFor({ state: 'detached' });
    assert.equal(await page.evaluate(() => window.promptCalls), 1);
    checks++;
    await context.close();
  }
  for (const options of [{ width: 1280, touch: false }, { standalone: true }, { snoozed: true }]) {
    const { context, page, banner } = await open(options);
    await page.locator('.app-main').waitFor();
    assert.equal(await banner.count(), 0);
    checks++;
    await context.close();
  }
  for (const route of ['/', '/login']) {
    const { context, page, banner } = await open({ signedIn: false, route, width: 320 });
    await banner.waitFor();
    await fit(page);
    checks++;
    await context.close();
  }
  const { context, page, banner } = await open({ persistent: true });
  await banner.waitFor();
  // Language changes update the notice without a reload.
  await page.locator('header').getByRole('button').filter({ has: page.locator('svg.lucide-globe') }).click();
  assert((await banner.innerText()).includes('ثبّت تطبيق الأكاديمية'));
  await page.evaluate(() => window.dispatchEvent(new Event('appinstalled')));
  await banner.waitFor({ state: 'detached' });
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  const cdp = await context.newCDPSession(page);
  const manifestResponse = await cdp.send('Page.getAppManifest');
  assert.deepEqual(manifestResponse.errors, []);
  const manifest = JSON.parse(manifestResponse.data);
  assert.equal(manifest.name, 'Cyberkhana Academy');
  assert.equal(manifest.short_name, 'Cyberkhana Academy');
  assert.equal(manifest.display, 'standalone');
  for (const icon of manifest.icons) {
    const bytes = await readFile(path.join(dist, icon.src));
    assert.equal(`${bytes.readUInt32BE(16)}x${bytes.readUInt32BE(20)}`, icon.sizes);
    assert(!icon.src.includes('academy'));
  }
  const installability = await cdp.send('Page.getInstallabilityErrors');
  assert.deepEqual(installability.installabilityErrors, []);
  const cached = await page.evaluate(async () => {
    const cache = await caches.open('academy-offline-v1');
    return (await cache.keys()).map(request => new URL(request.url).pathname).sort();
  });
  assert.deepEqual(cached, ['/assets/brand/favicon-192.png', '/offline.html', '/offline.js']);
  await context.setOffline(true);
  await page.reload();
  await page.locator('#retry').waitFor();
  assert.equal(await page.locator('html').getAttribute('dir'), 'rtl');
  assert.equal(await page.locator('#title').innerText(), 'أنت غير متصل بالإنترنت');
  await page.evaluate(() => localStorage.setItem('academy-lang', 'en'));
  await page.reload();
  assert.equal(await page.locator('#title').innerText(), 'You’re offline');
  await context.setOffline(false);
  await page.locator('#retry').click();
  await page.locator('.app-main').waitFor();
  checks += 5;
  await context.close();
  console.log(`Passed ${checks} PWA scenarios; manifest and Chromium installability checks passed. Screenshots: ${output}`);
} finally {
  await browser.close();
  for (const { profile, context } of profiles) {
    await context.close();
    // Delete only a profile created by this run directly inside the temp folder.
    if (path.dirname(path.resolve(profile)) === path.resolve(os.tmpdir()) && path.basename(profile).startsWith('academy-pwa-test-')) {
      await rm(profile, { recursive: true, force: true });
    }
  }
  await new Promise(resolve => server.close(resolve));
}
