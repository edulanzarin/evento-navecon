import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { toggle } from "./faqState";

/**
 * Property-based test for the FAQ accordion single-open reducer.
 *
 * The state is the index of the open item, or `null` when all items are
 * collapsed. We fold `toggle` over an arbitrary sequence of activation indices
 * (each within range for an arbitrary item count N >= 1), starting from the
 * all-collapsed state `null`, and assert the at-most-one-open invariant holds
 * after every step, along with the specific open/collapse transitions.
 */
// Feature: navecon-landing-page, Property 7: FAQ accordion keeps at most one item open
describe("faqState.toggle (Property 7)", () => {
  it("keeps at most one item open across arbitrary action sequences", () => {
    fc.assert(
      fc.property(
        // Arbitrary item count N >= 1, then a sequence of activations in 0..N-1.
        fc
          .integer({ min: 1, max: 50 })
          .chain((itemCount) =>
            fc.record({
              itemCount: fc.constant(itemCount),
              actions: fc.array(
                fc.integer({ min: 0, max: itemCount - 1 }),
                { minLength: 0, maxLength: 100 },
              ),
            }),
          ),
        ({ itemCount, actions }) => {
          // Initial state: all collapsed.
          let state: number | null = null;

          // Invariant check helper: state is null or a single index in range.
          const assertAtMostOneOpen = (s: number | null) => {
            if (s !== null) {
              expect(Number.isInteger(s)).toBe(true);
              expect(s).toBeGreaterThanOrEqual(0);
              expect(s).toBeLessThan(itemCount);
            }
          };

          // Invariant holds for the initial state.
          assertAtMostOneOpen(state);

          for (const index of actions) {
            const prev = state;
            const next = toggle(prev, index);

            // Specific transitions:
            if (prev === index) {
              // Activating the currently open item collapses it (none open).
              expect(next).toBeNull();
            } else {
              // Activating a collapsed item opens it, collapsing any other.
              expect(next).toBe(index);
            }

            state = next;

            // At-most-one-open invariant after every step.
            assertAtMostOneOpen(state);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
