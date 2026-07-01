import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The Pyodide runtime is self-hosted: scripts/copy-pyodide.mjs (predev/prebuild)
// copies it into public/pyodide, which Vite serves in dev and ships in dist.
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
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
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
        },
      },
    },
  },
});
