/**
 * Tests for the App page shell, document language/title, and section order
 * (task 7.4).
 *
 * Covers:
 * - Req 1.5: document language attribute is "pt-BR" and the document title is
 *   non-empty and identifies the event.
 * - Req 1.1: the semantic landmarks (header, main, footer) render and the
 *   sections appear in the fixed top-to-bottom order Hero → About → Speakers →
 *   Themes → Audience → Location → FAQ → Registration.
 *
 * These are example/smoke tests (not property-based).
 */
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { App } from "./App";
import { eventContent } from "./content/eventContent";

describe("App page shell (Req 1.5, 1.1)", () => {
  it("sets the document language attribute to pt-BR (Req 1.5)", () => {
    render(<App />);

    expect(document.documentElement.lang).toBe("pt-BR");
  });

  it("sets a non-empty document title that identifies the event (Req 1.5)", () => {
    render(<App />);

    expect(document.title.trim().length).toBeGreaterThan(0);
    expect(document.title).toContain(eventContent.eventName);
  });

  it("renders the header, main, and footer landmarks (Req 1.1)", () => {
    const { container } = render(<App />);

    expect(container.querySelector("header")).not.toBeNull();
    expect(container.querySelector("main")).not.toBeNull();
    expect(container.querySelector("footer")).not.toBeNull();
  });

  it("renders all sections in the fixed top-to-bottom order (Req 1.1)", () => {
    const { container } = render(<App />);

    const expectedOrder = [
      "hero",
      "about",
      "speakers",
      "themes",
      "audience",
      "location",
      "faq",
      "registration",
    ];

    const renderedOrder = Array.from(
      container.querySelectorAll("main section[id]")
    ).map((section) => section.id);

    expect(renderedOrder).toEqual(expectedOrder);
  });
});
