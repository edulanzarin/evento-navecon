/**
 * Example/interaction tests for the CountdownTimer (task 9.4).
 *
 * These verify the live ticking and started-state behavior:
 *  - The timer recomputes and updates the displayed remaining time at least once
 *    per second via a 1000ms interval (Req 4.2).
 *  - When the current time has reached/passed the target, it shows all-zero
 *    fields and the started-state message (Req 4.3, 4.6).
 *
 * Time is made deterministic with fake timers and a controllable `nowFn`. State
 * updates triggered by the interval are flushed inside `act`.
 *
 * These are example tests (NOT property-based) — no fast-check.
 *
 * Requirements: 4.2
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, act, cleanup } from "@testing-library/react";
import { CountdownTimer } from "./CountdownTimer";

/** Read the zero-padded value rendered for a given field label. */
function fieldValue(label: string): string {
  const li = screen.getByText(label).closest("li") as HTMLElement;
  const valueSpan = li.querySelector(
    'span[aria-hidden="true"]'
  ) as HTMLElement;
  return valueSpan.textContent ?? "";
}

describe("CountdownTimer ticking (Req 4.2)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("decrements the displayed seconds as time advances", () => {
    const base = 1_700_000_000_000;
    let now = base;
    const nowFn = () => now;
    const targetMs = base + 5_000; // 5 seconds in the future

    render(<CountdownTimer targetMs={targetMs} nowFn={nowFn} />);

    // Initial render: 5 seconds remaining, zero-padded.
    expect(fieldValue("Segundos")).toBe("05");

    // Advance the clock by 1s and let the interval fire.
    act(() => {
      now += 1_000;
      vi.advanceTimersByTime(1_000);
    });
    expect(fieldValue("Segundos")).toBe("04");

    // Advance again to confirm continuous ticking.
    act(() => {
      now += 1_000;
      vi.advanceTimersByTime(1_000);
    });
    expect(fieldValue("Segundos")).toBe("03");
  });
});

describe("CountdownTimer started state (Req 4.3, 4.6)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("shows all zeros and the started-state message when now is past the target", () => {
    const target = 1_700_000_000_000;
    const nowFn = () => target + 10_000; // already started

    render(<CountdownTimer targetMs={target} nowFn={nowFn} />);

    expect(fieldValue("Dias")).toBe("00");
    expect(fieldValue("Horas")).toBe("00");
    expect(fieldValue("Minutos")).toBe("00");
    expect(fieldValue("Segundos")).toBe("00");

    expect(screen.getByText("O evento começou!")).toBeInTheDocument();
  });
});
