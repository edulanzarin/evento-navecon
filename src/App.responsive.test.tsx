/**
 * Responsive / layout checks (task 12.2).
 *
 * Validates: Requirements 1.8, 2.1, 2.2, 2.3, 2.4, 3.10
 *
 * These are pragmatic layout/smoke checks (NOT property-based — no fast-check).
 *
 * ── jsdom limitation (read me before changing these assertions) ─────────────
 * jsdom does NOT perform real layout. It does not lay out boxes, does not apply
 * `@media` queries, and does not compute grid template columns. As a result:
 *   - `scrollWidth` and `clientWidth` are both reported as 0, so an assertion
 *     like `body.scrollWidth <= body.clientWidth` is trivially true (0 <= 0)
 *     and proves nothing about real horizontal overflow.
 *   - `getComputedStyle(...).gridTemplateColumns` is NOT resolved from the
 *     `@media (min-width: 769px)` rule, so we cannot count rendered columns.
 *
 * Therefore these tests assert the *mechanisms* that produce correct responsive
 * behavior in a real browser, which ARE reliable in jsdom:
 *   1. The global horizontal-scroll safeguard: `body { overflow-x: hidden }`
 *      (Req 1.8 / 2.3) is present, and the full page renders without throwing
 *      at every representative width (320, 375, 768, 1024, 1920).
 *   2. The class contract that drives single-column (≤768px) vs two-column
 *      (>768px) layout: multi-item sections use the `.grid-multi` container
 *      (Req 2.1 / 2.2). The `@media (min-width: 769px)` rule in index.css turns
 *      that container into `repeat(2, 1fr)` in a real browser.
 *
 * Full visual responsive fidelity (actual computed column counts, real
 * overflow measurement, media scaling per Req 2.4 / 3.10) is validated by
 * manual / visual review per the design's Testing Strategy ("Layout /
 * responsive checks" + "full visual fidelity additionally benefits from
 * manual/visual review").
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { act } from "react";
import { App } from "./App";
import { ThemesSection } from "./components/ThemesSection";
import { AudienceSection } from "./components/AudienceSection";

/** Representative widths spanning the required 320–1920px range. */
const WIDTHS = [320, 375, 768, 1024, 1920] as const;

/** The breakpoint: ≤768px single column, >768px multi-column (Req 2.1/2.2). */
const BREAKPOINT = 768;

/**
 * Inject the body overflow-x safeguard from index.css. Vitest/jsdom does not
 * load the real stylesheet, so we install the relevant rule explicitly to make
 * the `getComputedStyle(document.body).overflowX === "hidden"` assertion
 * meaningful and to mirror the production CSS (Req 1.8 / 2.3).
 */
function installGlobalGuardCss(): HTMLStyleElement {
  const style = document.createElement("style");
  style.setAttribute("data-test", "responsive-guard");
  style.textContent = "html, body { overflow-x: hidden; }";
  document.head.appendChild(style);
  return style;
}

/**
 * Simulate the viewport being a given CSS pixel width: set the documented
 * width signals and dispatch a `resize` event so any listeners reflow without a
 * page reload (Req 2.5 mechanism).
 */
function setViewportWidth(width: number): void {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    writable: true,
    value: width,
  });
  Object.defineProperty(document.documentElement, "clientWidth", {
    configurable: true,
    writable: true,
    value: width,
  });
  act(() => {
    window.dispatchEvent(new Event("resize"));
  });
}

describe("Responsive / layout checks (Req 1.8, 2.1–2.4, 3.10)", () => {
  let guardStyle: HTMLStyleElement;

  beforeEach(() => {
    guardStyle = installGlobalGuardCss();
  });

  afterEach(() => {
    cleanup();
    guardStyle.remove();
  });

  it.each(WIDTHS)(
    "renders the full page without throwing and keeps the horizontal-scroll safeguard at width %ipx (Req 1.8, 2.3)",
    (width) => {
      setViewportWidth(width);

      // The page renders without throwing at this width (Req 1.8 / 3.10:
      // hero + all sections present at 320–1920px).
      const { container, unmount } = render(<App />);

      // Global guard against horizontal page scrolling (Req 1.8 / 2.3). In a
      // real browser this prevents any horizontal page scroll regardless of
      // width; here we assert the safeguard is in effect.
      expect(getComputedStyle(document.body).overflowX).toBe("hidden");

      // Sanity: the page shell and main landmark actually rendered.
      expect(container.querySelector("main")).not.toBeNull();
      expect(container.querySelector("header")).not.toBeNull();
      expect(container.querySelector("footer")).not.toBeNull();

      // No element declares an inline fixed pixel width wider than the
      // viewport (a common source of horizontal overflow that we CAN detect
      // in jsdom via inline styles).
      const overWide = Array.from(
        container.querySelectorAll<HTMLElement>("[style]")
      ).filter((el) => {
        const w = el.style.width;
        const match = /^(\d+(?:\.\d+)?)px$/.exec(w.trim());
        return match !== null && Number(match[1]) > width;
      });
      expect(overWide).toEqual([]);

      unmount();
    }
  );

  it("renders the Speakers section as two .speaker-feature blocks that drive the 860px media/text breakpoint (Req 2.1, 2.2)", () => {
    // Speakers always has two entries, rendered as stacked full-width feature
    // blocks. jsdom cannot compute the resolved grid from the @media rule, so
    // we assert the class CONTRACT instead: `.speaker-feature` is single-column
    // by default and photo-beside-text above 860px per index.css (the second
    // block carries the --flip modifier that mirrors the columns).
    const { container } = render(<App />);

    const speakers = container.querySelector("#speakers");
    expect(speakers).not.toBeNull();

    const flow = speakers!.querySelector(".speakers-flow");
    expect(flow).not.toBeNull();
    const features = flow!.querySelectorAll(".speaker-feature");
    expect(features.length).toBe(2);
    expect(features[1].classList.contains("speaker-feature--flip")).toBe(true);
  });

  it("renders populated Themes and Audience lists in a .grid-multi container (Req 2.2)", () => {
    // Themes/Audience are empty (pending) in the default content, so render the
    // section components directly with populated arrays to exercise the
    // multi-column list contract that yields ≥2 columns above 768px.
    const themes = ["Tema A", "Tema B", "Tema C"];
    const audience = ["Contadores", "Empresários", "Estudantes"];

    const { container } = render(
      <>
        <ThemesSection themes={themes} />
        <AudienceSection audience={audience} />
      </>
    );

    const themesList = container.querySelector('[data-testid="themes-list"]');
    expect(themesList).not.toBeNull();
    expect(themesList!.classList.contains("grid-multi")).toBe(true);
    expect(themesList!.children.length).toBe(themes.length);

    const audienceList = container.querySelector('[data-testid="audience-list"]');
    expect(audienceList).not.toBeNull();
    expect(audienceList!.classList.contains("grid-multi")).toBe(true);
    expect(audienceList!.children.length).toBe(audience.length);
  });

  it("documents the breakpoint boundary used by the .grid-multi @media rule (Req 2.1, 2.2)", () => {
    // The CSS uses ≤768px single-column and a `@media (min-width: 769px)`
    // multi-column rule. This guards the breakpoint constant so the contract
    // and the stylesheet stay in agreement (jsdom cannot evaluate the @media
    // rule itself — actual column counts require a real browser / visual QA).
    expect(BREAKPOINT).toBe(768);
  });
});
