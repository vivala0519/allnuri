import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { handleLocalSearch } from './server/onnuri/localSearch.mjs';

const localSearchPlugin = {
  name: 'local-onnuri-search',
  configureServer(server: { middlewares: { use: (path: string, handler: typeof handleLocalSearch) => void } }) {
    server.middlewares.use('/api/onnuri/products', handleLocalSearch);
  },
  configurePreviewServer(server: { middlewares: { use: (path: string, handler: typeof handleLocalSearch) => void } }) {
    server.middlewares.use('/api/onnuri/products', handleLocalSearch);
  },
};

export default defineConfig(({ mode }) => ({
  plugins: [react(), localSearchPlugin, {
    name: 'toss-viewport',
    transformIndexHtml(html: string) {
      return mode === 'toss' ? html.replace('width=device-width, initial-scale=1.0', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover') : html;
    },
  }],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
}));
