import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      // Proxy API calls to the gateway
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
        secure: false,
      },
      // DO NOT proxy /oauth2 or /login/oauth2 — these are browser redirects
      // to the gateway and must be navigated to directly (not proxied).
    },
  },
});