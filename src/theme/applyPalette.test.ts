/**
 * Tests for theme palette application and active-palette selection (task 7.4).
 *
 * Covers:
 * - Req 1.6: a provided brand palette is applied to primary interface elements.
 * - Req 1.7: when no brand palette is provided, the default dark palette is
 *   applied to the same elements.
 *
 * Verified via the CSS custom properties set by `applyPalette` and the palette
 * returned by `getActivePalette`. These are example tests (not property-based).
 */
import { describe, it, expect } from "vitest";
import { applyPalette, PALETTE_CSS_VARS } from "./applyPalette";
import {
  DEFAULT_DARK_PALETTE,
  getActivePalette,
  type ThemePalette,
} from "./theme";

/** A distinct custom palette standing in for a provided brand palette. */
const CUSTOM_PALETTE: ThemePalette = {
  background: "#001122",
  surface: "#112233",
  textPrimary: "#fefefe",
  textLarge: "#cccccc",
  accent: "#ff6600",
  ctaBg: "#00aa55",
  ctaText: "#000000",
};

describe("applyPalette (Req 1.6, 1.7)", () => {
  it("applies every default-dark-palette color to its CSS custom property (Req 1.7)", () => {
    const el = document.createElement("div");

    applyPalette(DEFAULT_DARK_PALETTE, el);

    (Object.keys(PALETTE_CSS_VARS) as Array<keyof ThemePalette>).forEach(
      (key) => {
        expect(el.style.getPropertyValue(PALETTE_CSS_VARS[key])).toBe(
          DEFAULT_DARK_PALETTE[key]
        );
      }
    );
  });

  it("applies a provided palette's colors to the CSS custom properties (Req 1.6)", () => {
    const el = document.createElement("div");

    applyPalette(CUSTOM_PALETTE, el);

    (Object.keys(PALETTE_CSS_VARS) as Array<keyof ThemePalette>).forEach(
      (key) => {
        expect(el.style.getPropertyValue(PALETTE_CSS_VARS[key])).toBe(
          CUSTOM_PALETTE[key]
        );
      }
    );
  });

  it("overrides previously applied vars when a new palette is applied (provided takes effect — Req 1.6)", () => {
    const el = document.createElement("div");

    applyPalette(DEFAULT_DARK_PALETTE, el);
    applyPalette(CUSTOM_PALETTE, el);

    expect(el.style.getPropertyValue(PALETTE_CSS_VARS.accent)).toBe(
      CUSTOM_PALETTE.accent
    );
    expect(el.style.getPropertyValue(PALETTE_CSS_VARS.ctaBg)).toBe(
      CUSTOM_PALETTE.ctaBg
    );
  });

  it("maps each palette key to a distinct CSS variable name", () => {
    const varNames = Object.values(PALETTE_CSS_VARS);

    expect(new Set(varNames).size).toBe(varNames.length);
  });
});

describe("getActivePalette (Req 1.6, 1.7)", () => {
  it("returns the default dark palette when no brand palette is provided (Req 1.7)", () => {
    expect(getActivePalette(undefined)).toBe(DEFAULT_DARK_PALETTE);
  });

  it("returns the provided palette when one is given (Req 1.6)", () => {
    expect(getActivePalette(CUSTOM_PALETTE)).toBe(CUSTOM_PALETTE);
  });
});
