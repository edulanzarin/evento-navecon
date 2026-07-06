/**
 * CountdownTimer — live countdown to the Event_Start_Datetime.
 *
 * Consumes the pure `computeRemaining` math from `logic/countdown.ts` and the
 * configured `EVENT_START_MS` from `theme/env.ts`. It drives a 1000ms interval
 * that recomputes the remaining time each tick (Req 4.2) and cleans the
 * interval up on unmount. Once the event has started (`now >= target`), it
 * stops ticking, renders all-zero fields, and shows a pt-BR started-state
 * message (Req 4.3, 4.6).
 *
 * The four fields (days/hours/minutes/seconds) are zero-padded to a minimum of
 * two digits via `pad2` and labeled in pt-BR (Req 4.1). State is initialized
 * from the first `computeRemaining` call so the first paint (and SSR) is
 * correct; if the event has already started at mount, no interval is started.
 *
 * Props `targetMs` and `nowFn` exist to make the component deterministically
 * testable with fake timers; in production they default to the configured
 * event start and `Date.now`.
 *
 * Requirements: 4.1, 4.2, 4.3, 4.6
 */
import { useEffect, useState } from "react";
import { computeRemaining, pad2, type Remaining } from "../logic/countdown";
import { EVENT_START_MS } from "../theme/env";

export interface CountdownTimerProps {
  /** Target instant in epoch ms. Defaults to the configured event start. */
  targetMs?: number;
  /** Clock source for the current instant. Defaults to `Date.now`. */
  nowFn?: () => number;
}

/** pt-BR field labels in display order. */
const FIELD_LABELS: Record<keyof Pick<Remaining, "days" | "hours" | "minutes" | "seconds">, string> = {
  days: "Dias",
  hours: "Horas",
  minutes: "Minutos",
  seconds: "Segundos",
};

const TICK_INTERVAL_MS = 1000;

const STARTED_MESSAGE = "O evento começou!";

/**
 * Renders the live countdown. See the module docs for the full behavior
 * contract (ticking, cleanup, started-state).
 */
export function CountdownTimer({
  targetMs = EVENT_START_MS,
  nowFn = Date.now,
}: CountdownTimerProps) {
  // Initialize from the first computation so first paint is already correct.
  const [remaining, setRemaining] = useState<Remaining>(() =>
    computeRemaining(nowFn(), targetMs)
  );

  useEffect(() => {
    // Recompute immediately in case props/clock changed since first paint.
    const current = computeRemaining(nowFn(), targetMs);
    setRemaining(current);

    // Already started → nothing to tick (Req 4.3); no interval is created.
    if (current.started) {
      return;
    }

    const intervalId = window.setInterval(() => {
      const next = computeRemaining(nowFn(), targetMs);
      setRemaining(next);
      // Once started, stop ticking — no need to keep updating (Req 4.3).
      if (next.started) {
        window.clearInterval(intervalId);
      }
    }, TICK_INTERVAL_MS);

    // Clean up the interval on unmount or when inputs change.
    return () => window.clearInterval(intervalId);
  }, [targetMs, nowFn]);

  const fields: Array<{ key: keyof typeof FIELD_LABELS; value: number }> = [
    { key: "days", value: remaining.days },
    { key: "hours", value: remaining.hours },
    { key: "minutes", value: remaining.minutes },
    { key: "seconds", value: remaining.seconds },
  ];

  return (
    <div className="countdown">
      <ul className="countdown__list" aria-label="Tempo restante para o evento">
        {fields.map(({ key, value }) => {
          const label = FIELD_LABELS[key];
          return (
            <li key={key} className="countdown__field">
              <span className="countdown__value" aria-hidden="true">
                {pad2(value)}
              </span>
              <span className="countdown__label">{label}</span>
              {/* Accessible composite for screen readers. */}
              <span className="sr-only">{`${value} ${label}`}</span>
            </li>
          );
        })}
      </ul>
      {remaining.started ? (
        <p className="countdown__started" role="status">
          {STARTED_MESSAGE}
        </p>
      ) : null}
    </div>
  );
}
