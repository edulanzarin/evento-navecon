/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/**
 * Public base path the SPA is served under — the single source of truth for a
 * subpath deploy (e.g. navecon.net.br/imersao). Resolution order:
 *   1. APP_BASE_PATH (explicit, e.g. "/imersao/");
 *   2. the path of PUBLIC_BASE_URL (e.g. https://navecon.net.br/imersao → /imersao/);
 *   3. "/evento-navecon/" for the GitHub Pages build (--mode ghpages);
 *   4. "/" (domain root) — the default for local dev and root deploys.
 *
 * Assets (withBase), the registration endpoint and the /pagamento return route
 * all inherit this through import.meta.env.BASE_URL, so a subpath deploy needs
 * nothing else changed in the frontend.
 */
function resolveBase(mode: string): string {
  const raw =
    process.env.APP_BASE_PATH?.trim() ||
    pathnameFromUrl(process.env.PUBLIC_BASE_URL) ||
    (mode === "ghpages" ? "/evento-navecon/" : "/");
  const withLead = raw.startsWith("/") ? raw : `/${raw}`;
  return withLead.endsWith("/") ? withLead : `${withLead}/`;
}

/** Non-root pathname of a URL (e.g. "/imersao"), or undefined for root/invalid. */
function pathnameFromUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    const path = new URL(url).pathname.replace(/\/+$/, "");
    return path || undefined;
  } catch {
    return undefined;
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: resolveBase(mode),
  plugins: [react()],
  // Dev only: proxy /api to the backend (app container / npm run server:dev on
  // 4099), so `npm run dev` exercises the real registration + payment flow.
  // Local dev is served at the root ("/"); the subpath only applies to builds.
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
