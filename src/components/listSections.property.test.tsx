import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { cleanup, render, within } from "@testing-library/react";
import { MAX_DISPLAY_ITEMS } from "../content/resolvers";
import { ThemesSection } from "./ThemesSection";
import { AudienceSection } from "./AudienceSection";

/**
 * Property-based test for list-section rendering (task 10.5).
 *
 * Both ThemesSection and AudienceSection are content-driven list sections: for
 * any non-empty list of content items they must render exactly one distinct
 * item per input element — none added, none dropped — preserving the declared
 * order (Req 7.2/7.3, 8.2, 13.5). ThemesSection additionally display-caps the
 * list at the first {@link MAX_DISPLAY_ITEMS} (20) items, so its rendered slice
 * is `items.slice(0, 20)`; AudienceSection renders every input item.
 *
 * Generators produce arbitrary NON-EMPTY arrays of UNIQUE, non-empty (after
 * trimming) strings. Uniqueness makes the "one distinct rendered item per
 * input" assertion robust: each rendered `<li>`'s text maps unambiguously back
 * to a single input element. Themes are capped at 20 inputs to stay close to
 * the supported 1..20 range while still exercising the cap boundary.
 *
 * RTL's global `cleanup` runs in `afterEach`, but each `fc.property` predicate
 * renders repeatedly within a single test, so `cleanup()` is called manually at
 * the end of every iteration to unmount the previous render and avoid duplicate
 * DOM nodes leaking across iterations.
 */

// A single non-empty (after trimming) string. Excludes whitespace-only values
// so every item is a "present" list element per the resolver's contract.
const nonEmptyString = fc
  .string({ minLength: 1 })
  .filter((s) => s.trim().length > 0);

// Feature: navecon-landing-page, Property 3: List sections render every item once, in order
describe("List sections render every item once, in order (Property 3)", () => {
  it("ThemesSection renders the first min(n,20) themes once, in order", () => {
    fc.assert(
      fc.property(
        // Unique, non-empty themes; 1..20 inputs (exercising the display cap).
        fc.uniqueArray(nonEmptyString, { minLength: 1, maxLength: 20 }),
        (themes) => {
          const { getByTestId } = render(<ThemesSection themes={themes} />);

          const list = getByTestId("themes-list");
          const items = within(list).getAllByRole("listitem");

          const expected = themes.slice(0, MAX_DISPLAY_ITEMS);

          // No items added or dropped: one <li> per displayed input element.
          expect(items).toHaveLength(expected.length);

          // Each rendered item equals the corresponding input, in order.
          const rendered = items.map((li) => li.textContent);
          expect(rendered).toEqual(expected);

          // Each rendered item is distinct (no duplication across <li>s).
          expect(new Set(rendered).size).toBe(rendered.length);

          cleanup();
        }
      ),
      { numRuns: 200 }
    );
  });

  it("AudienceSection renders every audience item once, in order", () => {
    fc.assert(
      fc.property(
        // Unique, non-empty audience descriptions; no display cap for audience.
        fc.uniqueArray(nonEmptyString, { minLength: 1, maxLength: 30 }),
        (audience) => {
          const { getByTestId } = render(
            <AudienceSection audience={audience} />
          );

          const list = getByTestId("audience-list");
          const items = within(list).getAllByRole("listitem");

          // No cap for audience: one <li> per input element.
          expect(items).toHaveLength(audience.length);

          // Each rendered item equals the corresponding input, in order.
          const rendered = items.map((li) => li.textContent);
          expect(rendered).toEqual(audience);

          // Each rendered item is distinct (no duplication across <li>s).
          expect(new Set(rendered).size).toBe(rendered.length);

          cleanup();
        }
      ),
      { numRuns: 200 }
    );
  });
});
