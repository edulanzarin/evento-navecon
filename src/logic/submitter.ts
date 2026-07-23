/**
 * Configurable registration submitter — pure, framework-free TypeScript.
 *
 * The registration form submits through a single async handler behind the
 * {@link RegistrationSubmitter} interface, so the UI never knows the
 * destination — only the interface. The concrete implementation is selected by
 * the build-time env var `VITE_REGISTRATION_ENDPOINT`:
 *
 * - When set   → {@link HttpSubmitter} POSTs JSON to the configured endpoint.
 * - When unset → {@link PlaceholderSubmitter} simulates a successful submission
 *                and logs the payload (so the page is fully functional in
 *                development/preview).
 *
 * A 30-second timeout is enforced via `AbortSignal` (Req 10.7). Submitters
 * never let exceptions escape: any thrown/rejected fetch (including abort) is
 * caught and converted into a {@link SubmitResult}.
 *
 * Requirements:
 * - 10.2: A valid submission resolves to a success result the form can confirm.
 * - 10.7: A submission that fails, is rejected, or exceeds 30s resolves to a
 *         failure result the form can surface as an error.
 */

import type { RegistrationPayload } from './validation';
import { VITE_REGISTRATION_ENDPOINT } from '../theme/env';

/** Default submission timeout in milliseconds (Req 10.7). */
export const SUBMIT_TIMEOUT_MS = 30_000;

/**
 * Discriminated result of a registration submission. On success, the backend
 * may return a `redirectUrl` (the Mercado Pago checkout link) for the form to
 * navigate to; when absent (dev/placeholder), the form shows a confirmation.
 */
export type SubmitResult =
  | { ok: true; redirectUrl?: string }
  | { ok: false; reason: string };

/**
 * Abstraction over the registration destination. Implementations MUST resolve
 * (never reject) with a {@link SubmitResult}, and MUST respect the provided
 * `AbortSignal`.
 */
export interface RegistrationSubmitter {
  submit(payload: RegistrationPayload, signal: AbortSignal): Promise<SubmitResult>;
}

/**
 * Combines a caller-provided `AbortSignal` with an internal timeout that aborts
 * after `ms` milliseconds. Returns the combined signal plus a `cleanup`
 * function that clears the timer and detaches listeners (call it once the work
 * settles to avoid leaks).
 *
 * When either the caller's signal or the timeout fires, the returned signal is
 * aborted. If the caller passes no signal, only the timeout applies.
 */
export function withTimeout(
  signal: AbortSignal | undefined,
  ms: number,
): { signal: AbortSignal; cleanup: () => void } {
  const controller = new AbortController();

  const onAbort = () => controller.abort();

  // If the caller's signal is already aborted, propagate immediately.
  if (signal?.aborted) {
    controller.abort();
  }

  const timer = setTimeout(() => controller.abort(), ms);

  if (signal && !signal.aborted) {
    signal.addEventListener('abort', onAbort, { once: true });
  }

  const cleanup = () => {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  };

  return { signal: controller.signal, cleanup };
}

/**
 * Submits the registration payload by POSTing JSON to a configured HTTP
 * endpoint.
 *
 * Behavior:
 * - A response with `res.ok === true` → `{ ok: true }`.
 * - A non-OK HTTP status            → `{ ok: false, reason }`.
 * - A thrown/rejected fetch (network error, abort, timeout)
 *                                   → `{ ok: false, reason }`.
 *
 * Exceptions never escape: they are caught and converted to a
 * {@link SubmitResult}.
 */
export class HttpSubmitter implements RegistrationSubmitter {
  constructor(private readonly endpoint: string) {}

  async submit(payload: RegistrationPayload, signal: AbortSignal): Promise<SubmitResult> {
    const { signal: combined, cleanup } = withTimeout(signal, SUBMIT_TIMEOUT_MS);
    try {
      const res = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: combined,
      });

      if (res.ok) {
        // The backend returns `{ checkoutUrl }` to redirect to payment; a body
        // that is missing/not JSON (e.g. a plain 200) is still a success.
        let redirectUrl: string | undefined;
        try {
          const data = (await res.json()) as { checkoutUrl?: unknown };
          if (typeof data?.checkoutUrl === "string") redirectUrl = data.checkoutUrl;
        } catch {
          /* no JSON body — plain OK */
        }
        return redirectUrl ? { ok: true, redirectUrl } : { ok: true };
      }

      return { ok: false, reason: `HTTP ${res.status}` };
    } catch (error) {
      return { ok: false, reason: describeError(error) };
    } finally {
      cleanup();
    }
  }
}

/**
 * Simulates a successful submission without performing any network request.
 * Logs the payload via `console.info` so the page works in development when no
 * endpoint is configured.
 *
 * Still respects an already-aborted signal: if the caller's signal is aborted
 * before submission, it resolves to a failure result rather than logging a
 * spurious "success".
 */
export class PlaceholderSubmitter implements RegistrationSubmitter {
  async submit(payload: RegistrationPayload, signal: AbortSignal): Promise<SubmitResult> {
    if (signal?.aborted) {
      return { ok: false, reason: 'aborted' };
    }

    // eslint-disable-next-line no-console
    console.info('[PlaceholderSubmitter] Registration payload (simulated):', payload);
    return { ok: true };
  }
}

/**
 * Selects the submitter implementation based on configuration.
 *
 * @param endpoint - The registration endpoint. Defaults to
 *   `VITE_REGISTRATION_ENDPOINT`. When a non-empty endpoint is provided, an
 *   {@link HttpSubmitter} is returned; otherwise a {@link PlaceholderSubmitter}.
 */
export function createRegistrationSubmitter(
  endpoint: string | undefined = VITE_REGISTRATION_ENDPOINT,
): RegistrationSubmitter {
  if (endpoint && endpoint.trim().length > 0) {
    return new HttpSubmitter(endpoint);
  }
  return new PlaceholderSubmitter();
}

/** Produces a human-readable reason string from an unknown thrown value. */
function describeError(error: unknown): string {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return 'aborted';
  }
  if (error instanceof Error) {
    return error.message || error.name;
  }
  return String(error);
}
