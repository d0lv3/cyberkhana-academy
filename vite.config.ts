import fs from 'fs';
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
  plugins: [react(), emceptionRawAssets()],
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
