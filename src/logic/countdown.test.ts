import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { computeRemaining, pad2 } from "./countdown";

const SECONDS_PER_DAY = 86_400;
const SECONDS_PER_HOUR = 3_600;
const SECONDS_PER_MINUTE = 60;

/**
 * Property-based test for the countdown computation.
 *
 * `computeRemaining` works in floored remaining *seconds*. The meaningful
 * boundary is therefore `floor((target - now) / 1000)`:
 * - when that floored value is > 0 (now is before target with at least one
 *   full second remaining) the timer is running (`started === false`);
 * - when it is <= 0 (now is at/after target, or only a sub-second sliver
 *   remains) the timer is in the started state with all fields clamped to 0
 *   (Req 4.3, 4.6).
 *
 * Generators produce `now`/`target` instants on both sides of the boundary:
 * a wide ±1-year delta exercises the general case while a narrow ±5s delta
 * concentrates samples right around the boundary (including the sub-second
 * window and exact equality).
 */
// Feature: navecon-landing-page, Property 1: Countdown computation is correct for all instants
describe("computeRemaining / pad2 (Property 1)", () => {
  // A plausible epoch-ms range for "now" (1970-01-01 .. ~2100).
  const nowArb = fc.integer({ min: 0, max: 4_102_444_800_000 });

  // Delta from now to target, biased to land on both sides of the boundary.
  const deltaArb = fc.oneof(
    // Wide range: ±1 year in milliseconds.
    fc.integer({ min: -31_536_000_000, max: 31_536_000_000 }),
    // Narrow range: ±5 seconds, to densely sample the boundary/sub-second window.
    fc.integer({ min: -5_000, max: 5_000 })
  );

  it("computes correct fields, ranges, recomposition, and started flag for all instants", () => {
    fc.assert(
      fc.property(nowArb, deltaArb, (now, delta) => {
        const target = now + delta;
        const r = computeRemaining(now, target);

        const flooredRemaining = Math.floor((target - now) / 1000);

        if (flooredRemaining > 0) {
          // Before the event (now < target) with at least one full second left.
          expect(r.started).toBe(false);

          // Field ranges.
          expect(r.days).toBeGreaterThanOrEqual(0);
          expect(r.hours).toBeGreaterThanOrEqual(0);
          expect(r.hours).toBeLessThanOrEqual(23);
          expect(r.minutes).toBeGreaterThanOrEqual(0);
          expect(r.minutes).toBeLessThanOrEqual(59);
          expect(r.seconds).toBeGreaterThanOrEqual(0);
          expect(r.seconds).toBeLessThanOrEqual(59);

          // Recomposition to the floored remaining seconds.
          const recomposed =
            r.days * SECONDS_PER_DAY +
            r.hours * SECONDS_PER_HOUR +
            r.minutes * SECONDS_PER_MINUTE +
            r.seconds;
          expect(recomposed).toBe(flooredRemaining);
          expect(r.total).toBe(flooredRemaining);
        } else {
          // At/after the event (now >= target), or a sub-second sliver remains:
          // started state with every field clamped to zero.
          expect(r.started).toBe(true);
          expect(r.days).toBe(0);
          expect(r.hours).toBe(0);
          expect(r.minutes).toBe(0);
          expect(r.seconds).toBe(0);
          expect(r.total).toBe(0);
        }

        // pad2 of every field is at least two characters long.
        for (const field of [r.days, r.hours, r.minutes, r.seconds]) {
          expect(pad2(field).length).toBeGreaterThanOrEqual(2);
        }
      }),
      { numRuns: 500 }
    );
  });
});
