/** Local browser QA only: simulated accounts/data, never connected to production. */
import { createServer } from 'vite';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const mode = { signedIn: true, failReads: true, failWrites: false, slowCompiler: true };
const user = { id: 'launch-qa-student', username: 'launchstudent', displayName: 'Launch Student',
  role: 'user', email: 'student@example.invalid', university: 'University of Baghdad',
  preferredLang: 'en', termsAccepted: true, createdAt: '2026-01-01T00:00:00Z' };
const title = (en, ar = en) => ({ en, ar });
const concepts = [
  { id: 'launch-hello', slug: 'hello', title: title('Hello compiler', 'مرحبًا بالمترجم'), order: 1,
    type: 'lesson', status: 'published', isPublished: true, markdownContent: title('# Hello compiler\n\nEdit this program and run it.', '# مرحبًا بالمترجم\n\nعدّل هذا البرنامج ثم شغّله.'),
    starterCode: '#include <iostream>\nint main() { std::cout << "Hello Academy!" << std::endl; }' },
  { id: 'launch-next', slug: 'next', title: title('Next lesson', 'الدرس التالي'), order: 2,
    type: 'lesson', status: 'published', isPublished: true, markdownContent: title('# Next lesson\n\nYour earlier code should still be waiting in the first lesson.'),
    starterCode: '#include <iostream>\nint main() { std::cout << 2 << std::endl; }' },
];
const patch = { languageSlug: 'cpp', newModules: [{ id: 'launch-module', slug: 'launch-module',
  title: title('Launch QA', 'اختبار الإطلاق'), description: title('Local test lessons.'), order: 1,
  status: 'published', isPublished: true, concepts }], newConcepts: {} };
const course = '/#/fundamentals/programming/cpp/launch-module/hello';
const controls = () => `<!doctype html><html><body><h1>Local launch QA</h1><pre>${JSON.stringify(mode, null, 2)}</pre>
  <p><a href="/__qa?action=recover">Recover data</a> · <a href="/__qa?action=fail">Fail data loads</a></p>
  <p><a href="/__qa?action=out">Signed out</a> · <a href="/__qa?action=in">Signed in</a></p>
  <p><a href="/__qa?action=write-fail">Fail writes</a> · <a href="/__qa?action=write-ok">Healthy writes</a></p>
  <p><a href="/__qa?action=slow">Slow compiler</a> · <a href="/__qa?action=fast">Normal compiler</a></p>
  <p><a href="${course}">Open test lesson</a></p></body></html>`;
const fixture = {
  name: 'launch-ux-local-fixtures', enforce: 'pre',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      const url = new URL(req.url, 'http://localhost');
      if (url.pathname === '/__qa/mobile') {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(`<html><body><h1>Phone preview, 390px</h1><iframe title="Phone preview" src="${course}" width="390" height="844" style="border:0"></iframe></body></html>`);
        return;
      }
      if (url.pathname === '/__qa') {
        switch (url.searchParams.get('action')) {
          case 'recover': mode.failReads = false; break;
          case 'fail': mode.failReads = true; break;
          case 'out': mode.signedIn = false; break;
          case 'in': mode.signedIn = true; break;
          case 'write-fail': mode.failWrites = true; break;
          case 'write-ok': mode.failWrites = false; break;
          case 'slow': mode.slowCompiler = true; break;
          case 'fast': mode.slowCompiler = false; break;
        }
        res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.end(controls()); return;
      }
      if (mode.slowCompiler && url.pathname.startsWith('/emception/') && url.pathname.endsWith('.br')) {
        const file = path.join(root, 'public', 'emception', path.basename(url.pathname));
        const info = await stat(file);
        res.writeHead(200, { 'Content-Type': 'application/octet-stream', 'Content-Length': info.size });
        const stream = createReadStream(file, { highWaterMark: 512 * 1024 });
        const timer = setInterval(() => stream.resume(), 200);
        stream.on('data', chunk => { stream.pause(); res.write(chunk); });
        stream.on('end', () => { clearInterval(timer); res.end(); });
        res.on('close', () => { clearInterval(timer); stream.destroy(); });
        return;
      }
      if (!url.pathname.startsWith('/api/')) { next(); return; }
      const endpoint = url.pathname.slice(4);
      const send = (body, code = 200) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(body)); };
      if (endpoint === '/auth/dev-login') { mode.signedIn = true; send({ user }); return; }
      if (endpoint === '/auth/logout') { mode.signedIn = false; send({ ok: true }); return; }
      if (!mode.signedIn) { send({ error: 'Signed out' }, 401); return; }
      if (endpoint === '/auth/me') { send({ user }); return; }
      if (endpoint === '/content/mine') { send({ error: 'Forbidden' }, 403); return; }
      if (req.method === 'PUT' || req.method === 'POST') {
        send(mode.failWrites ? { error: 'Simulated connection failure' } : { xp: 0, completions: { programming: {}, osModules: {}, networking: [] } }, mode.failWrites ? 503 : 200);
        return;
      }
      if (mode.failReads && ['/content/published', '/progress'].includes(endpoint)) { send({ error: 'Simulated load failure' }, 503); return; }
      if (endpoint === '/content/published') { send({ buckets: { 'programming-patches': [patch] } }); return; }
      if (endpoint === '/progress') { send({ progress: null, xp: 0 }); return; }
      if (endpoint.startsWith('/leaderboard')) { send({ entries: [], me: null }); return; }
      send({});
    });
  },
};
const server = await createServer({ root, plugins: [fixture],
  define: { 'import.meta.env.VITE_API_URL': JSON.stringify('/api'), 'import.meta.env.VITE_GOOGLE_CLIENT_ID': JSON.stringify('') },
  server: { host: '127.0.0.1', port: 5177, strictPort: true, open: false },
});
await server.listen();
console.log(`Local QA: http://127.0.0.1:5177/__qa\nLesson: http://127.0.0.1:5177${course}`);
for (const event of ['SIGINT', 'SIGTERM']) process.on(event, async () => { await server.close(); process.exit(0); });
