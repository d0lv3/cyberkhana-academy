import fs from 'fs';
import { createHash } from 'crypto';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// The Pyodide runtime is self-hosted: scripts/copy-pyodide.mjs (predev/prebuild)
// copies it into public/pyodide, which Vite serves in dev and ships in dist.

/**
 * Serve the vendored C/C++ toolchain as opaque bytes.
 *
 * Its startup archive is named `<hash>.br`, and static servers — Vite's own
 * among them — read that extension as "this is brotli transfer encoding" and
 * answer with `Content-Encoding: br`. The browser then decompresses it on the
 * way in, which is precisely wrong: those bytes are the payload, and Emception
 * decompresses them itself with its own brotli.wasm. It cannot be renamed
 * either, because the same extension is what tells Emception to decompress.
 * The result of getting this wrong is a bare "FS error" at startup.
 *
 * Any server hosting public/emception needs the same treatment: serve .br
 * under this path as application/octet-stream, with no Content-Encoding.
 */
function emceptionRawAssets(): Plugin {
  /** dev reads from public/, preview from dist/; the rule is the same. */
  const serveRaw = (root: string) => (req: any, res: any, next: () => void) => {
    const url = (req.url ?? '').split('?')[0];
    if (!url.startsWith('/emception/') || !url.endsWith('.br')) return next();

    const dir = path.resolve(__dirname, root, 'emception');
    const file = path.resolve(__dirname, root, url.slice(1));
    // Refuse anything that climbs out of the toolchain directory.
    if (file !== dir && !file.startsWith(dir + path.sep)) return next();

    fs.stat(file, (err, stat) => {
      if (err) return next();
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Length', stat.size);
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      fs.createReadStream(file).pipe(res);
    });
  };

  return {
    name: 'emception-raw-assets',
    configureServer: (server) => void server.middlewares.use(serveRaw('public')),
    configurePreviewServer: (server) => void server.middlewares.use(serveRaw('dist')),
  };
}

/**
 * Serve the vendored Pyodide runtime as plain files in dev.
 *
 * public/ is copied as-is at build time, so nothing there goes through Vite's
 * transforms — and Vite enforces that by refusing to resolve a public file
 * imported as a module: "should not be imported from source code". On the main
 * thread the import slips past, because the browser asks for the URL directly.
 * Inside a worker it does not: that module graph is Vite's, so the request
 * reaches the transform middleware and is turned away, the worker falls back
 * to the jsDelivr CDN, and dev quietly stops exercising the self-hosted copy
 * we actually ship.
 *
 * So the runtime is answered before the transform middleware ever sees it, the
 * same trick emceptionRawAssets() plays above. Build and preview are untouched:
 * there is no transform step to get in the way there, and dist/pyodide is
 * already served correctly.
 */
function pyodideRawAssets(): Plugin {
  const TYPES: Record<string, string> = {
    '.mjs': 'text/javascript',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.wasm': 'application/wasm',
  };

  const serveRaw = (req: any, res: any, next: () => void) => {
    const url = (req.url ?? '').split('?')[0];
    if (!url.startsWith('/pyodide/')) return next();

    const dir = path.resolve(__dirname, 'public', 'pyodide');
    const file = path.resolve(__dirname, 'public', url.slice(1));
    // Refuse anything that climbs out of the runtime directory.
    if (file !== dir && !file.startsWith(dir + path.sep)) return next();

    fs.stat(file, (err, stat) => {
      if (err || !stat.isFile()) return next();
      res.setHeader('Content-Type', TYPES[path.extname(file)] ?? 'application/octet-stream');
      res.setHeader('Content-Length', stat.size);
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      fs.createReadStream(file).pipe(res);
    });
  };

  return {
    name: 'pyodide-raw-assets',
    configureServer: (server) => void server.middlewares.use(serveRaw),
  };
}

/**
 * The Content Security Policy, written into the built HTML.
 *
 * A second line behind the sanitiser in LessonMarkdown: that one decides what
 * creator prose may become, this one decides what the page will honour if
 * something ever gets past it. `script-src 'self'` holds because the build
 * emits no inline script (Vite puts everything in /assets), so nothing here
 * needs 'unsafe-inline' or a nonce.
 *
 * `'wasm-unsafe-eval'` is what the in-browser runtimes need — Pyodide for
 * Python, clang for C and C++ — and it buys WebAssembly compilation without
 * opening plain eval(). The API origin is read from VITE_API_URL at build
 * time, so a deploy pointing somewhere else gets a policy that matches it
 * rather than one that quietly blocks every request.
 *
 * Two entries exist for the C/C++ runner alone, because a sandboxed frame
 * inherits this policy while holding an opaque origin — `'self'` matches
 * nothing inside it, so it cannot be let in by origin:
 *   - the sha256 of emception/sandboxBootstrap.html's inline script, hashed
 *     from that file here so the two can never drift apart;
 *   - `'unsafe-eval'`, which the bootstrap needs to evaluate the program clang
 *     just compiled. It is far weaker than it sounds next to what is NOT here:
 *     without `'unsafe-inline'`, injected script cannot run at all, and eval()
 *     only widens what already-admitted script may do.
 *
 * Build only: Vite's dev server serves modules over inline script and a websocket
 * that this policy would refuse, and dev is not what ships.
 *
 * `frame-ancestors` is deliberately absent — browsers ignore it in a meta tag.
 * To stop the Academy being framed, the host must send it as a real header
 * (`frame-ancestors 'none'`), which is the one directive that cannot live here.
 */
function contentSecurityPolicy(): Plugin {
  const GOOGLE_SIGN_IN = 'https://accounts.google.com';
  /* The runtime falls back to the CDN when the vendored copy is missing. */
  const PYODIDE_CDN = 'https://cdn.jsdelivr.net';
  let policy = '';

  /**
   * The hash of the C/C++ sandbox's inline bootstrap, over the same bytes the
   * browser will hash: the script element's contents, with the newlines it
   * would see. Throws rather than emitting a policy that would silently stop
   * every C and C++ lesson from running.
   */
  const cppSandboxHash = (): string => {
    const file = path.resolve(__dirname, 'components/code-editor/emception/sandboxBootstrap.html');
    const html = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
    const open = html.indexOf('<script>');
    const close = html.lastIndexOf('</script>');
    if (open < 0 || close < 0) {
      throw new Error(`[csp] no <script> found in ${file}; the C/C++ sandbox hash cannot be built`);
    }
    const body = html.slice(open + '<script>'.length, close);
    return `sha256-${createHash('sha256').update(body, 'utf8').digest('base64')}`;
  };

  return {
    name: 'content-security-policy',
    apply: 'build',

    configResolved(config) {
      const raw = config.env?.VITE_API_URL;
      let apiOrigin: string | null = null;
      if (typeof raw === 'string' && /^https?:\/\//i.test(raw)) {
        try {
          apiOrigin = new URL(raw).origin;
        } catch {
          apiOrigin = null;
        }
      }

      // 'self' covers an API served from the app's own origin behind a proxy.
      const connect = ["'self'", PYODIDE_CDN, GOOGLE_SIGN_IN];
      if (apiOrigin) connect.push(apiOrigin);

      policy = [
        "default-src 'self'",
        "base-uri 'self'",
        "object-src 'none'",
        "form-action 'self'",
        `script-src 'self' 'wasm-unsafe-eval' 'unsafe-eval' '${cppSandboxHash()}' ${GOOGLE_SIGN_IN}`,
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' data: https://fonts.gstatic.com",
        // Avatars come from Google, lesson images from uploads and data: URLs.
        "img-src 'self' data: blob: https:",
        "media-src 'self' data: blob:",
        // The Python sandbox, and the C/C++ toolchain's own workers.
        "worker-src 'self' blob:",
        `frame-src 'self' ${GOOGLE_SIGN_IN}`,
        `connect-src ${[...new Set(connect)].join(' ')}`,
        "manifest-src 'self'",
      ].join('; ');
    },

    transformIndexHtml() {
      return [
        {
          tag: 'meta',
          attrs: { 'http-equiv': 'Content-Security-Policy', content: policy },
          injectTo: 'head-prepend' as const,
        },
      ];
    },
  };
}

export default defineConfig({
  server: {
    port: 3001,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:5002',
        changeOrigin: true,
      },
    },
  },
  plugins: [react(), emceptionRawAssets(), pyodideRawAssets(), contentSecurityPolicy()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      /* JSCPP's printf reaches for Node's `stream`; see shims/node-stream.ts.
         Without this, every printf/puts/sprintf in a C lesson throws. */
      stream: path.resolve(__dirname, 'shims/node-stream.ts'),
    },
  },
  build: {
    // The deploy host is memory-constrained (shared box also running the app,
    // API and Mongo). The gzip-size report buffers every output chunk through
    // gzip just to print the size table, which was OOM-killing the build at
    // "computing gzip size". It's cosmetic — turn it off so the build fits.
    reportCompressedSize: false,
    rollupOptions: {
      output: {
        // Split heavyweight, rarely-changing vendors into their own
        // long-cacheable chunks instead of one monolithic index bundle.
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-motion': ['framer-motion'],
          // Markdown + KaTeX only load once a lesson is opened.
          'vendor-markdown': [
            'react-markdown',
            'remark-gfm',
            'remark-math',
            'rehype-katex',
            'katex',
          ],
        },
      },
    },
  },
});
