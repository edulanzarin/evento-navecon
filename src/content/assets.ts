/**
 * Centralized asset path map for the Navecon landing page.
 *
 * All logo, image, and video assets live under the project's `public/assets`
 * directory and are served by Vite at the site root. Paths here are therefore
 * absolute relative to the public root (e.g. `/assets/logo/icon-light.png`),
 * which resolves correctly at both build time and runtime.
 *
 * Keeping every asset path in this single object means a missing or renamed
 * asset is updated in exactly one place.
 *
 * Requirements: 14.1, 14.2
 */

export interface AssetMap {
  readonly logo: {
    /** Light logo variant for dark-theme header/footer. */
    readonly light: string;
    /** Dark logo variant reserved for light-on-light contexts. */
    readonly dark: string;
    /** Full footer lockup: symbol + "Navecon Contabilidade e Assessoria" text. */
    readonly footer: string;
  };
  readonly video: {
    /** Hero ambient background loop (first 10s, muted). */
    readonly background: string;
    /** Hero ambient video — desktop aspect (speaker / event). */
    readonly imersao: string;
    /** Hero ambient video — mobile aspect (event). */
    readonly evento: string;
    /** Institutional video about Navecon — mobile/vertical aspect. */
    readonly navecon: string;
  };
  readonly gallery: {
    /** Ambient imagery. */
    readonly ambient1: string;
    /** Ambient imagery. */
    readonly ambient2: string;
  };
}

/**
 * Prefixes a public-root-absolute path (`/assets/...`) with Vite's configured
 * base. A no-op under the default `/` base (dev, tests, root deploys); under a
 * subpath base (e.g. GitHub Pages' `/evento-navecon/`) it rebases the URL so
 * runtime string paths resolve like statically imported assets do.
 */
export function withBase(path: string): string {
  return import.meta.env.BASE_URL.replace(/\/$/, "") + path;
}

export const ASSETS: AssetMap = {
  logo: {
    light: withBase("/assets/logo/icon-light.png"),
    dark: withBase("/assets/logo/icon-dark.png"),
    footer: withBase("/assets/logo/logo-footer.png"),
  },
  video: {
    background: withBase("/assets/video/background.mp4"),
    imersao: withBase("/assets/video/imersao.mp4"),
    evento: withBase("/assets/video/evento.mp4"),
    navecon: withBase("/assets/video/navecon.mp4"),
  },
  gallery: {
    ambient1: withBase("/assets/gallery/ambient-1.jpeg"),
    ambient2: withBase("/assets/gallery/ambient-2.jpeg"),
  },
} as const;
