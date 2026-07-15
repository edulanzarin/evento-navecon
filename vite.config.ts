/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  // GitHub Pages serves the site under /<repo>/; root everywhere else
  // (dev server, tests, the nginx/Docker deploy).
  base: process.env.GH_PAGES ? "/evento-navecon/" : "/",
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    css: true,
  },
});
