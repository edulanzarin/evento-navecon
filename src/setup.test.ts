import { describe, expect, it } from "vitest";

/**
 * Trivial smoke test verifying the Vitest + jsdom toolchain is wired up correctly.
 * Replaced/expanded by real tests in later tasks.
 */
describe("test tooling smoke test", () => {
  it("runs a trivial assertion", () => {
    expect(1 + 1).toBe(2);
  });

  it("has a jsdom environment available", () => {
    expect(typeof document).toBe("object");
    const el = document.createElement("div");
    el.textContent = "navecon";
    expect(el.textContent).toBe("navecon");
  });
});
