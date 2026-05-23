import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';
import { getAgricultureUpdates, getMarketPrices } from './api/src/agricultureSources.js';

const json = (res, status, body) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
};

const agricultureApi = () => ({
  name: 'annadatha-local-agriculture-api',
  configureServer(server) {
    server.middlewares.use('/api/market-prices', async (req, res) => {
      try {
        const url = new URL(req.url || '/', 'http://localhost');
        json(res, 200, await getMarketPrices({
          district: url.searchParams.get('district') || undefined,
          limit: url.searchParams.get('limit') || undefined,
        }));
      } catch (error) {
        json(res, 502, { error: 'Unable to load official mandi prices.', detail: error.message });
      }
    });

    server.middlewares.use('/api/agriculture-updates', async (_req, res) => {
      try {
        json(res, 200, await getAgricultureUpdates());
      } catch (error) {
        json(res, 502, { error: 'Unable to load official agriculture updates.', detail: error.message });
      }
    });
  },
});

export default defineConfig({
  plugins: [react(), tailwindcss(), agricultureApi()],

  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },

  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
        },
      },
    },
  },

  server: {
    port: 3000,
    open: true,
  },

  preview: {
    port: 4173,
  },
});
