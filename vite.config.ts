import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { handleLocalSearch } from './api/onnuri/localSearch.mjs';

const localSearchPlugin = {
  name: 'local-onnuri-search',
  configureServer(server: { middlewares: { use: (path: string, handler: typeof handleLocalSearch) => void } }) {
    server.middlewares.use('/api/onnuri/products', handleLocalSearch);
  },
  configurePreviewServer(server: { middlewares: { use: (path: string, handler: typeof handleLocalSearch) => void } }) {
    server.middlewares.use('/api/onnuri/products', handleLocalSearch);
  },
};

export default defineConfig({
  plugins: [react(), localSearchPlugin],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
