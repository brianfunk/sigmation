import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: 'src/site',
  publicDir: '../../public',
  plugins: [react()],
  build: {
    outDir: '../../dist/site',
    emptyOutDir: true,
  },
  server: {
    port: 5600,
    strictPort: true,
    // During `vite` dev, proxy API calls to `netlify dev` (or `npm run dev:api`).
    proxy: Object.fromEntries(
      ['/svg', '/png', '/mml', '/html', '/badge', '/math', '/render', '/api'].map((p) => [p, 'http://localhost:8890']),
    ),
  },
});
