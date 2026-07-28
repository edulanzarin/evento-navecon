/**
 * Environment & runtime configuration for the Navecon Contabilidade landing page.
 *
 * Requirements:
 * - 4.4: The Countdown_Timer computes remaining time using the Event_Start_Datetime
 *        of 16 September 2026 interpreted in Brasília time (UTC−03:00).
 * - 4.5: IF the event time of day has not been defined, compute remaining time using
 *        the start of day (00:00:00) on 16 September 2026 in Brasília time (UTC−03:00).
 *
 * The registration endpoint (Req 10.2 / 10.7, wired by the submitter) defaults to
 * a base-relative `…/api/register`, so it follows the app's base path and a
 * subpath deploy (e.g. `/imersao/api/register`) hits the same origin with no
 * extra config. An explicit `VITE_REGISTRATION_ENDPOINT` overrides the default.
 */

/**
 * Base-relative default registration endpoint. `BASE_URL` is `/` at the domain
 * root and `/imersao/` under a subpath, yielding `/api/register` or
 * `/imersao/api/register` respectively.
 */
function defaultRegistrationEndpoint(): string {
  const base = import.meta.env.BASE_URL.replace(/\/+$/, "");
  return `${base}/api/register`;
}

const explicitEndpoint = import.meta.env.VITE_REGISTRATION_ENDPOINT?.trim();

/**
 * Registration submit endpoint. An explicit, non-empty `VITE_REGISTRATION_ENDPOINT`
 * wins; otherwise it derives from the app's base path (see above).
 */
export const VITE_REGISTRATION_ENDPOINT: string =
  explicitEndpoint && explicitEndpoint.length > 0
    ? explicitEndpoint
    : defaultRegistrationEndpoint();

/**
 * Canonical ISO-8601 start instant of the event, expressed in Brasília time
 * (UTC−03:00). The event time of day is still pending, so it defaults to the
 * start of day (00:00:00) on 16 September 2026 (Req 4.5). When the official
 * time is confirmed, update the time portion here (Req 4.4).
 */
export const EVENT_START_ISO = "2026-09-16T00:00:00-03:00";

/**
 * Event_Start_Datetime as a `Date`. Parsed from {@link EVENT_START_ISO}; because
 * the string carries an explicit `-03:00` offset, the resulting instant is
 * unambiguous regardless of the runtime's local timezone.
 */
export const Event_Start_Datetime: Date = new Date(EVENT_START_ISO);

/**
 * Event_Start_Datetime as epoch milliseconds, convenient for the countdown's
 * `computeRemaining(nowMs, targetMs)` math.
 */
export const EVENT_START_MS: number = Event_Start_Datetime.getTime();
