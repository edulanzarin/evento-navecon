/**
 * End-to-end integration smoke test for the full landing page (task 12.3).
 *
 * Renders the entire <App/> and asserts the three cross-cutting behaviors that
 * only emerge once every section is wired together:
 *
 *  1. Section order (Req 1.1): the sections inside <main> appear in the fixed
 *     top-to-bottom order Hero → About → Speakers → Themes → Audience →
 *     Location → FAQ → Registration.
 *  2. Both CTAs present with identical labels (Req 9.1, 9.2, 9.3): there are at
 *     least two registration CTAs (one in the hero, one above the footer) and
 *     every CTA renders the exact same pt-BR wording (CTA_LABEL).
 *  3. CTA activation scrolls to + focuses the form (Req 1.1 / 9.x integration):
 *     activating a CTA scrolls the registration form region into view and moves
 *     keyboard focus to the form's first input (full name).
 *
 * These are integration/smoke tests (NOT property-based) — no fast-check.
 *
 * Requirements: 1.1, 9.1, 9.2, 9.3
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, cleanup, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "./App";
import { CTA_LABEL } from "./components/RegistrationCta";

/** The required top-to-bottom section order inside <main> (Req 1.1). */
const EXPECTED_SECTION_ORDER = [
  "hero",
  "about",
  "speakers",
  "themes",
  "audience",
  "location",
  "faq",
  "registration",
];

describe("App integration — section order (Req 1.1)", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the sections inside <main> in the required order", () => {
    render(<App />);

    const main = screen.getByRole("main");
    const sectionIds = Array.from(
      main.querySelectorAll<HTMLElement>("section[id]")
    ).map((section) => section.id);

    expect(sectionIds).toEqual(EXPECTED_SECTION_ORDER);
  });
});

describe("App integration — registration CTAs (Req 9.1, 9.2, 9.3)", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders at least two CTAs, all with identical pt-BR wording", () => {
    render(<App />);

    const ctas = screen.getAllByRole("button", { name: CTA_LABEL });

    // One in the hero (Req 9.1) and one above the footer (Req 9.2).
    expect(ctas.length).toBeGreaterThanOrEqual(2);

    // Identical wording across every CTA instance (Req 9.3).
    for (const cta of ctas) {
      expect(cta.textContent).toBe(CTA_LABEL);
    }
  });

  it("places one CTA inside the hero and one outside it", () => {
    render(<App />);

    const hero = document.getElementById("hero") as HTMLElement;
    expect(hero).not.toBeNull();

    const heroCtas = within(hero).getAllByRole("button", { name: CTA_LABEL });
    expect(heroCtas.length).toBeGreaterThanOrEqual(1);

    const allCtas = screen.getAllByRole("button", { name: CTA_LABEL });
    const ctasOutsideHero = allCtas.filter((cta) => !hero.contains(cta));
    expect(ctasOutsideHero.length).toBeGreaterThanOrEqual(1);
  });
});

describe("App integration — CTA activation scrolls to + focuses the form", () => {
  // jsdom does not implement scrollIntoView, so `vi.spyOn` cannot wrap a
  // non-existent method. Assign a mock directly and restore the original
  // (undefined) afterwards.
  let scrollIntoViewMock: ReturnType<typeof vi.fn>;
  const originalScrollIntoView = HTMLElement.prototype.scrollIntoView;

  beforeEach(() => {
    // The form region is not fully visible under jsdom's zero-rect layout, so a
    // scroll is expected when a CTA is activated.
    scrollIntoViewMock = vi.fn();
    HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;
  });

  afterEach(() => {
    cleanup();
    HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
    vi.restoreAllMocks();
  });

  it("activating the hero CTA scrolls the form into view and focuses the first input", async () => {
    const user = userEvent.setup();
    render(<App />);

    const hero = document.getElementById("hero") as HTMLElement;
    const heroCta = within(hero).getAllByRole("button", { name: CTA_LABEL })[0];

    await user.click(heroCta);

    expect(scrollIntoViewMock).toHaveBeenCalled();

    const fullNameInput = screen.getByLabelText(/Nome completo/);
    expect(fullNameInput).toHaveFocus();
    expect(document.activeElement).toBe(fullNameInput);
  });

  it("activating the second (below-content) CTA also scrolls and focuses the form", async () => {
    const user = userEvent.setup();
    render(<App />);

    const hero = document.getElementById("hero") as HTMLElement;
    const secondCta = screen
      .getAllByRole("button", { name: CTA_LABEL })
      .find((cta) => !hero.contains(cta));
    expect(secondCta).toBeDefined();

    await user.click(secondCta as HTMLElement);

    expect(scrollIntoViewMock).toHaveBeenCalled();

    const fullNameInput = screen.getByLabelText(/Nome completo/);
    expect(fullNameInput).toHaveFocus();
  });
});
