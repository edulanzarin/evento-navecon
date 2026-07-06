/**
 * Theme palette for the Navecon Contabilidade event landing page.
 *
 * Requirements:
 * - 1.2: dark background with light foreground; body text contrast ≥ 4.5:1,
 *        large text and interactive controls contrast ≥ 3:1.
 * - 1.6: WHERE a brand palette is provided, apply it to headings, CTA controls,
 *        and section accents.
 * - 1.7: IF no brand palette is provided, apply the default dark palette to the
 *        same primary interface elements.
 */

export interface ThemePalette {
  /** Dark base background of the page. */
  background: string;
  /** Slightly lighter surface for cards/sections. */
  surface: string;
  /** Primary body text. MUST achieve ≥ 4.5:1 contrast on `background`. */
  textPrimary: string;
  /** Secondary / large text. MUST achieve ≥ 3:1 contrast on `background`. */
  textLarge: string;
  /** Headings and section accents. MUST achieve ≥ 3:1 contrast on `background`. */
  accent: string;
  /** Registration CTA background. */
  ctaBg: string;
  /** Registration CTA label. MUST achieve ≥ 4.5:1 contrast on `ctaBg`. */
  ctaText: string;
}

/**
 * Default dark palette (used when no brand palette is supplied — Req 1.7).
 *
 * Navy + gold — the Navecon brand identity. Contrast intent (WCAG 2.1
 * relative-luminance ratios, verified):
 * - background #0a1430 → very dark navy base.
 * - textPrimary #f4f6fb on background ≈ 17:1   (≥ 4.5:1 for body text ✓)
 * - textLarge   #a8b6d2 on background ≈ 9:1    (≥ 3:1 for large/muted text ✓)
 * - accent      #d4af37 (gold) on background ≈ 8.6:1 (≥ 3:1 for accents ✓)
 * - ctaText     #0a1430 (navy) on ctaBg #c8a23c (gold) ≈ 7.8:1 (≥ 4.5:1 ✓)
 *
 * Every foreground/background pairing comfortably exceeds the Req 1.2 minimums.
 */
export const DEFAULT_DARK_PALETTE: ThemePalette = {
  background: "#0a1430",
  surface: "#0f1d3d",
  textPrimary: "#f4f6fb",
  textLarge: "#a8b6d2",
  accent: "#d4af37",
  ctaBg: "#c8a23c",
  ctaText: "#0a1430",
};

/**
 * Optional brand palette. Currently undefined because brand colors are still
 * pending (see requirements introduction). When brand colors are provided,
 * assign a `ThemePalette` here and it will automatically take effect.
 */
export const brandPalette: ThemePalette | undefined = undefined;

/**
 * Returns the active palette: the provided brand palette when available
 * (Req 1.6), otherwise the default dark palette (Req 1.7).
 *
 * @param palette - Optional brand palette override. Defaults to the
 *   module-level `brandPalette`.
 */
export function getActivePalette(
  palette: ThemePalette | undefined = brandPalette
): ThemePalette {
  return palette ?? DEFAULT_DARK_PALETTE;
}
