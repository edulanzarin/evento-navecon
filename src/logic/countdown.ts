/**
 * Countdown math for the Navecon Contabilidade event landing page.
 *
 * This is a pure, framework-free module (no React/DOM imports) so the
 * countdown logic can be unit- and property-tested in isolation. The
 * `CountdownTimer` component consumes `computeRemaining` and drives a 1s
 * interval; all the actual time arithmetic lives here.
 *
 * Requirements:
 * - 4.1: when now < target, expose days (≥ 0), hours (0–23), minutes (0–59),
 *        and seconds (0–59) of remaining time, each zero-padded to ≥ 2 digits
 *        (padding is applied by `pad2` at the render layer).
 * - 4.3: when now ≥ target, stop decrementing — fields are all zero and the
 *        started flag is set so the UI can show the started-state message.
 * - 4.6: when the remaining computation is zero or less, all fields are zero
 *        and the started flag is set.
 */

/**
 * Remaining time broken into calendar-style fields.
 *
 * `total` is the floored remaining **seconds** until the target
 * (`floor((target - now) / 1000)`), clamped to `0` once the target is reached.
 * The four fields recompose exactly to `total`:
 * `days * 86400 + hours * 3600 + minutes * 60 + seconds === total`.
 */
export interface Remaining {
  /** Floored remaining seconds until target, clamped to 0 once started. */
  total: number;
  /** Whole days remaining (≥ 0). */
  days: number;
  /** Hours within the current day (0–23). */
  hours: number;
  /** Minutes within the current hour (0–59). */
  minutes: number;
  /** Seconds within the current minute (0–59). */
  seconds: number;
  /** True once `now >= target` (the event has begun). */
  started: boolean;
}

const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 60 * 60;
const SECONDS_PER_DAY = 24 * SECONDS_PER_HOUR;

/**
 * Computes the remaining time between two instants expressed in milliseconds.
 *
 * When `nowMs < targetMs`, returns the floored remaining seconds split into
 * days/hours/minutes/seconds with `started = false`. When `nowMs >= targetMs`,
 * clamps every field (and `total`) to `0` and sets `started = true`
 * (Req 4.3, 4.6).
 *
 * The split is exact: the four fields always recompose to `total`
 * (`days * 86400 + hours * 3600 + minutes * 60 + seconds === total`), and the
 * bounded fields stay within range (hours 0–23, minutes 0–59, seconds 0–59).
 *
 * @param nowMs - The current instant in milliseconds since the epoch.
 * @param targetMs - The event start instant in milliseconds since the epoch.
 */
export function computeRemaining(nowMs: number, targetMs: number): Remaining {
  const totalSeconds = Math.floor((targetMs - nowMs) / 1000);

  if (totalSeconds <= 0) {
    return {
      total: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      started: true,
    };
  }

  const days = Math.floor(totalSeconds / SECONDS_PER_DAY);
  const hours = Math.floor((totalSeconds % SECONDS_PER_DAY) / SECONDS_PER_HOUR);
  const minutes = Math.floor(
    (totalSeconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE
  );
  const seconds = totalSeconds % SECONDS_PER_MINUTE;

  return {
    total: totalSeconds,
    days,
    hours,
    minutes,
    seconds,
    started: false,
  };
}

/**
 * Left-pads a number with `0` to a minimum width of two characters.
 *
 * Values that already have two or more digits are returned unchanged, so
 * `pad2(5) === "05"` and `pad2(123) === "123"`. The result is always at least
 * two characters long (Req 4.1).
 *
 * @param n - The value to format (expected non-negative for display).
 */
export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}
