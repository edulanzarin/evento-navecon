/**
 * Applies a {@link ThemePalette} to the document as `:root` CSS custom
 * properties (Req 1.2, 1.6, 1.7).
 *
 * Each palette key maps to a stable, semantic CSS variable name so the
 * stylesheet can reference colors without knowing whether they came from a
 * brand palette (Req 1.6) or the default dark palette (Req 1.7). Centralizing
 * the mapping here keeps the variable names in one place and makes the function
 * trivially unit-testable in isolation (it depends only on a palette object and
 * a target element).
 */

import type { ThemePalette } from "./theme";

/**
 * Maps each {@link ThemePalette} key to its corresponding CSS custom property
 * name. Exported so tests can assert the full set of variables is applied.
 */
export const PALETTE_CSS_VARS: Record<keyof ThemePalette, string> = {
  background: "--color-background",
  surface: "--color-surface",
  textPrimary: "--color-text-primary",
  textLarge: "--color-text-large",
  accent: "--color-accent",
  ctaBg: "--color-cta-bg",
  ctaText: "--color-cta-text",
};

/**
 * Sets every palette color as a CSS custom property on the given element
 * (defaults to `document.documentElement`, i.e. `:root`).
 *
 * @param palette - The resolved theme palette to apply.
 * @param target - The element to set the custom properties on. Defaults to the
 *   document root so the variables cascade to the whole page.
 */
export function applyPalette(
  palette: ThemePalette,
  target: HTMLElement = document.documentElement
): void {
  (Object.keys(PALETTE_CSS_VARS) as Array<keyof ThemePalette>).forEach((key) => {
    target.style.setProperty(PALETTE_CSS_VARS[key], palette[key]);
  });
}
