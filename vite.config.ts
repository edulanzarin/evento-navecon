/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // GitHub Pages serves the site under /<repo>/ (build with --mode ghpages);
  // root everywhere else (dev server, tests, the nginx/Docker deploy).
  base: mode === "ghpages" ? "/evento-navecon/" : "/",
  plugins: [react()],
  // Dev only: proxy /api to the backend (app container / npm run server:dev on
  // 4099), so `npm run dev` exercises the real registration + payment flow.
  server: {
    proxy: {
      "/api": "http://localhost:4099",
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    css: true,
  },
}));
