/**
 * Example/interaction tests for the shared RegistrationCta (task 9.4).
 *
 * These verify the CTA's label and its scroll-to-form + focus behavior:
 *  - It renders a real <button> with the shared pt-BR label (Req 9.3 wording).
 *  - When the form is NOT fully visible, activating the CTA smooth-scrolls the
 *    form top into view AND moves focus to the first input (Req 9.4, 9.6).
 *  - When the form is ALREADY fully visible, activating the CTA keeps the scroll
 *    position (no scrollIntoView) and only moves focus (Req 9.7).
 *
 * The branch is controlled by mocking `getBoundingClientRect` + `innerHeight`
 * (consumed by `isFullyVisible`), and the side effects are observed by spying
 * on the real elements' `scrollIntoView` and `focus`.
 *
 * These are example tests (NOT property-based) — no fast-check.
 *
 * Requirements: 3.8, 9.4, 9.6, 9.7
 */
import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { RegistrationCta, CTA_LABEL } from "./RegistrationCta";

/**
 * Create a real <section> form and <input> appended to the document, returning
 * refs plus spies on the side-effecting methods.
 */
function setupFormElements() {
  const form = document.createElement("section");
  const input = document.createElement("input");
  form.appendChild(input);
  document.body.appendChild(form);

  const scrollSpy = vi.fn();
  form.scrollIntoView = scrollSpy;
  const focusSpy = vi.spyOn(input, "focus");

  const formRef = { current: form } as React.RefObject<HTMLElement>;
  const firstInputRef = { current: input } as React.RefObject<HTMLInputElement>;

  return { form, input, scrollSpy, focusSpy, formRef, firstInputRef };
}

/** Mark `el` as fully visible within an 800px viewport. */
function makeFullyVisible(el: HTMLElement) {
  window.innerHeight = 800;
  el.getBoundingClientRect = () =>
    ({
      top: 10,
      bottom: 100,
      left: 0,
      right: 0,
      width: 0,
      height: 90,
      x: 0,
      y: 10,
      toJSON: () => ({}),
    }) as DOMRect;
}

describe("RegistrationCta label (Req 9.3)", () => {
  afterEach(() => {
    cleanup();
    document.body.innerHTML = "";
  });

  it("renders a button with the shared CTA label", () => {
    const { formRef, firstInputRef } = setupFormElements();
    render(
      <RegistrationCta formRef={formRef} firstInputRef={firstInputRef} />
    );

    const button = screen.getByRole("button", { name: CTA_LABEL });
    expect(button).toBeInTheDocument();
    expect(button.tagName).toBe("BUTTON");
  });
});

describe("RegistrationCta scroll + focus (Req 9.4, 9.6)", () => {
  let env: ReturnType<typeof setupFormElements>;

  beforeEach(() => {
    env = setupFormElements();
  });

  afterEach(() => {
    cleanup();
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("scrolls the form into view and focuses the first input when the form is not visible", () => {
    // jsdom default: getBoundingClientRect returns zeros → isFullyVisible false,
    // so activation should both scroll and focus.
    render(
      <RegistrationCta
        formRef={env.formRef}
        firstInputRef={env.firstInputRef}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: CTA_LABEL }));

    expect(env.scrollSpy).toHaveBeenCalledTimes(1);
    expect(env.scrollSpy).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
    });
    expect(env.focusSpy).toHaveBeenCalledTimes(1);
  });
});

describe("RegistrationCta already-visible branch (Req 9.7)", () => {
  let env: ReturnType<typeof setupFormElements>;

  beforeEach(() => {
    env = setupFormElements();
  });

  afterEach(() => {
    cleanup();
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("keeps scroll position (no scrollIntoView) and only focuses when the form is fully visible", () => {
    makeFullyVisible(env.form);

    render(
      <RegistrationCta
        formRef={env.formRef}
        firstInputRef={env.firstInputRef}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: CTA_LABEL }));

    expect(env.scrollSpy).not.toHaveBeenCalled();
    expect(env.focusSpy).toHaveBeenCalledTimes(1);
  });
});
