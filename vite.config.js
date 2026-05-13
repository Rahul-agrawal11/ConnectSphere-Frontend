import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: 'localhost',
    port: 3000,
    proxy: {
      // Optional: proxy API calls to avoid CORS in dev
      // '/api': {
      //   target: 'http://localhost:8080',
      //   changeOrigin: true,
      // },
    },
  },
});