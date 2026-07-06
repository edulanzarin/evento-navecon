/**
 * WCAG 2.1 contrast tests for the default dark palette (task 7.4).
 *
 * Covers Req 1.2: the dark theme must maintain a contrast ratio of at least
 * 4.5:1 for body text and at least 3:1 for large text and interactive controls.
 *
 * The contrast helper below implements the WCAG 2.1 relative-luminance formula
 * locally in the test so the assertion is self-contained and independent of the
 * palette's own documented numbers. These are example/edge tests (not
 * property-based).
 */
import { describe, it, expect } from "vitest";
import { DEFAULT_DARK_PALETTE } from "./theme";

/** Parses a `#rrggbb` (or `#rgb`) hex color into 0–255 RGB channels. */
function parseHex(hex: string): { r: number; g: number; b: number } {
  let h = hex.replace(/^#/, "").trim();
  if (h.length === 3) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (!/^[0-9a-fA-F]{6}$/.test(h)) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

/** Linearizes a single sRGB channel (0–1) per WCAG 2.1. */
function linearize(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** Relative luminance of a hex color per WCAG 2.1. */
function relativeLuminance(hex: string): number {
  const { r, g, b } = parseHex(hex);
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

/** Contrast ratio between two hex colors per WCAG 2.1 (1:1 .. 21:1). */
function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

describe("contrast helper sanity checks", () => {
  it("computes 21:1 for black on white", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 1);
  });

  it("computes 1:1 for identical colors", () => {
    expect(contrastRatio("#123456", "#123456")).toBeCloseTo(1, 5);
  });

  it("supports shorthand 3-digit hex", () => {
    expect(contrastRatio("#000", "#fff")).toBeCloseTo(21, 1);
  });
});

describe("DEFAULT_DARK_PALETTE WCAG contrast (Req 1.2)", () => {
  const p = DEFAULT_DARK_PALETTE;

  it("body text (textPrimary on background) meets >= 4.5:1", () => {
    expect(contrastRatio(p.textPrimary, p.background)).toBeGreaterThanOrEqual(
      4.5
    );
  });

  it("large text (textLarge on background) meets >= 3:1", () => {
    expect(contrastRatio(p.textLarge, p.background)).toBeGreaterThanOrEqual(3);
  });

  it("accent (headings/accents on background) meets >= 3:1", () => {
    expect(contrastRatio(p.accent, p.background)).toBeGreaterThanOrEqual(3);
  });

  it("control text (ctaText on ctaBg) meets >= 4.5:1", () => {
    expect(contrastRatio(p.ctaText, p.ctaBg)).toBeGreaterThanOrEqual(4.5);
  });
});
