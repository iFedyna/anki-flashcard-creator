import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      // Proxy AnkiConnect to avoid CORS during development
      '/anki': {
        target: 'http://127.0.0.1:8765',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/anki/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            // AnkiConnect by default allows Origin http://localhost. Set it to satisfy its CORS check.
            proxyReq.setHeader('Origin', 'http://localhost');
            proxyReq.setHeader('Referer', 'http://localhost');
            proxyReq.setHeader('Accept', 'application/json');
            proxyReq.setHeader('Content-Type', 'application/json');
          });
        },
      },
    },
  }
});
