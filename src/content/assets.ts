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

export const ASSETS: AssetMap = {
  logo: {
    light: "/assets/logo/icon-light.png",
    dark: "/assets/logo/icon-dark.png",
  },
  video: {
    background: "/assets/video/background.mp4",
    imersao: "/assets/video/imersao.mp4",
    evento: "/assets/video/evento.mp4",
    navecon: "/assets/video/navecon.mp4",
  },
  gallery: {
    ambient1: "/assets/gallery/ambient-1.jpeg",
    ambient2: "/assets/gallery/ambient-2.jpeg",
  },
} as const;
