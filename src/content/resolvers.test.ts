import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { MAX_DISPLAY_ITEMS, resolveList, resolveText } from "./resolvers";

/**
 * Property-based test for the content resolvers.
 *
 * Property 2 states that a resolver returns the `pending` state when the value
 * is absent (null, whitespace-only string, or empty list) and the `finalized`
 * state otherwise — exactly one of the two, never both and never neither.
 *
 * `resolveText` accepts `string | null`; we generate null, whitespace-only
 * strings, and arbitrary strings (which may themselves be blank), then assert
 * the status matches the presence rule (non-null AND not whitespace-only).
 *
 * `resolveList` accepts `string[]`; we generate arbitrary arrays (including
 * empty) and assert `pending` iff the list is empty, else `finalized` with the
 * value capped to the first {@link MAX_DISPLAY_ITEMS} items, in order.
 */
// Feature: navecon-landing-page, Property 2: Content resolver yields exactly one of finalized or pending
describe("content resolvers (Property 2)", () => {
  // Whitespace-only strings (spaces, tabs, newlines, etc.).
  const whitespaceOnly = fc
    .array(fc.constantFrom(" ", "\t", "\n", "\r", "\f", "\v"), {
      minLength: 0,
      maxLength: 8,
    })
    .map((chars) => chars.join(""));

  const textValue = fc.oneof(
    fc.constant(null),
    whitespaceOnly,
    fc.string(),
  );

  it("resolveText yields exactly one of finalized or pending per presence rule", () => {
    fc.assert(
      fc.property(textValue, fc.string(), (value, pendingMsg) => {
        const result = resolveText(value, pendingMsg);

        const isPresent = value !== null && value.trim() !== "";

        if (isPresent) {
          // Finalized: status is "finalized", original value preserved, no message.
          expect(result.status).toBe("finalized");
          expect(result).toHaveProperty("value");
          expect(result).not.toHaveProperty("message");
          if (result.status === "finalized") {
            expect(result.value).toBe(value);
          }
        } else {
          // Pending: status is "pending", message preserved, no value.
          expect(result.status).toBe("pending");
          expect(result).toHaveProperty("message");
          expect(result).not.toHaveProperty("value");
          if (result.status === "pending") {
            expect(result.message).toBe(pendingMsg);
          }
        }

        // Never both, never neither: status is exactly one of the two.
        expect(["finalized", "pending"]).toContain(result.status);
      }),
      { numRuns: 100 },
    );
  });

  it("resolveList yields exactly one of finalized or pending per presence rule", () => {
    fc.assert(
      fc.property(fc.array(fc.string()), fc.string(), (items, pendingMsg) => {
        const result = resolveList(items, pendingMsg);

        const isPresent = items.length >= 1;

        if (isPresent) {
          // Finalized: status is "finalized", capped value, no message.
          expect(result.status).toBe("finalized");
          expect(result).toHaveProperty("value");
          expect(result).not.toHaveProperty("message");
          if (result.status === "finalized") {
            const expectedLength = Math.min(items.length, MAX_DISPLAY_ITEMS);
            expect(result.value).toHaveLength(expectedLength);
            // Value is the first N items, in input order.
            expect(result.value).toEqual(items.slice(0, MAX_DISPLAY_ITEMS));
          }
        } else {
          // Pending: status is "pending", message preserved, no value.
          expect(result.status).toBe("pending");
          expect(result).toHaveProperty("message");
          expect(result).not.toHaveProperty("value");
          if (result.status === "pending") {
            expect(result.message).toBe(pendingMsg);
          }
        }

        // Never both, never neither: status is exactly one of the two.
        expect(["finalized", "pending"]).toContain(result.status);
      }),
      { numRuns: 100 },
    );
  });
});
