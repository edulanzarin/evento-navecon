/**
 * RegistrationForm — the registration form (task 11.5).
 *
 * Responsibilities (Req 10):
 * - Provide controlled input fields for full name (required, ≤100), email
 *   (required, ≤254), phone (required, ≤11 digits), and company (optional,
 *   ≤100) (Req 10.1).
 * - On submit, validate with {@link validateRegistration}. On failure, show
 *   per-field pt-BR messages near each field and retain all entered values —
 *   controlled state already retains them (Req 10.3, 10.4, 10.5). Invalid
 *   fields get `aria-invalid` and are linked to their message via
 *   `aria-describedby`.
 * - On a valid submission, disable the submit control to prevent duplicate
 *   submissions (Req 10.6), then call the injected {@link RegistrationSubmitter}
 *   with a 30-second `AbortSignal` (Req 10.7).
 *   - Success → show a pt-BR success confirmation (Req 10.2).
 *   - Failure, rejection, or timeout → show a pt-BR error message, re-enable
 *     the submit control, and retain all field values (Req 10.7).
 * - Expose the full-name input via `firstInputRef` so CTAs can move focus to it
 *   after scrolling to the form (Req 9.6).
 *
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7
 */

import {
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type RefObject,
} from "react";
import {
  validateRegistration,
  type FieldErrors,
  type RegistrationInput,
} from "../logic/validation";
import {
  createRegistrationSubmitter,
  SUBMIT_TIMEOUT_MS,
  type RegistrationSubmitter,
} from "../logic/submitter";

/** pt-BR confirmation/error messages surfaced by the form (Req 10.2, 10.7). */
export const FORM_MESSAGES = {
  success: "Inscrição realizada com sucesso!",
  redirecting: "Tudo certo! Redirecionando para o pagamento seguro…",
  error: "Não foi possível concluir sua inscrição. Tente novamente.",
} as const;

/** Default browser navigation to the checkout URL (overridable for tests). */
const defaultRedirect = (url: string): void => {
  window.location.assign(url);
};

/** Maximum input lengths per field (Req 10.1). */
const MAX_LENGTHS = {
  fullName: 100,
  email: 254,
  // Phone allows formatting characters in the text box; validation enforces the
  // 10–11 digit rule. 15 leaves room for "(11) 91234-5678" style input.
  phone: 15,
  company: 100,
  coupon: 40,
} as const;

export interface RegistrationFormProps {
  /**
   * The submitter used to deliver a valid registration. Defaults to the
   * environment-selected submitter; tests inject a mock.
   */
  submitter?: RegistrationSubmitter;
  /**
   * Optional external ref attached to the full-name input (the form's first
   * input) so CTAs can focus it after scrolling (Req 9.6). When omitted an
   * internal ref is used.
   */
  firstInputRef?: RefObject<HTMLInputElement>;
  /**
   * Navigates the browser to the checkout URL on a successful submission that
   * returns one. Defaults to `window.location.assign`; injected in tests.
   */
  redirect?: (url: string) => void;
}

type SubmitState = "idle" | "submitting" | "redirecting" | "success" | "error";

/**
 * Controlled, accessible registration form. See module docs for the full
 * behavior contract (Req 10.1–10.7).
 */
export function RegistrationForm({
  submitter,
  firstInputRef,
  redirect = defaultRedirect,
}: RegistrationFormProps) {
  // Resolve the submitter once: prefer the injected one, else build the
  // environment-selected default.
  const resolvedSubmitter = useMemo(
    () => submitter ?? createRegistrationSubmitter(),
    [submitter],
  );

  // Fall back to an internal ref when no external first-input ref is provided.
  const internalFirstInputRef = useRef<HTMLInputElement>(null);
  const fullNameRef = firstInputRef ?? internalFirstInputRef;

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [coupon, setCoupon] = useState("");

  const [errors, setErrors] = useState<FieldErrors>({});
  const [state, setState] = useState<SubmitState>("idle");

  // Busy = the form is working or handing off to checkout; controls stay locked.
  const busy = state === "submitting" || state === "redirecting";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Guard against duplicate submissions while one is in flight (Req 10.6).
    if (busy) {
      return;
    }

    const input: RegistrationInput = { fullName, email, phone, company, couponCode: coupon };
    const result = validateRegistration(input);

    if (!result.valid) {
      // Show per-field messages; controlled state retains entered values
      // (Req 10.3–10.5).
      setErrors(result.errors);
      setState("idle");
      return;
    }

    // Valid: clear errors, disable submit, and start the network call.
    setErrors({});
    setState("submitting");

    // 30-second timeout via AbortSignal (Req 10.7).
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SUBMIT_TIMEOUT_MS);

    try {
      const outcome = await resolvedSubmitter.submit(
        result.value,
        controller.signal,
      );
      if (outcome.ok) {
        if (outcome.redirectUrl) {
          // Registration saved → hand off to the payment checkout (or, for a
          // courtesy coupon, straight to the success page). Keep controls locked
          // while the browser navigates away.
          setState("redirecting");
          redirect(outcome.redirectUrl);
        } else {
          // Success without a redirect URL (dev/placeholder) → confirmation.
          setState("success");
        }
      } else if (
        outcome.fieldErrors &&
        Object.keys(outcome.fieldErrors).length > 0
      ) {
        // Server validation rejection (e.g. an invalid/used coupon): show the
        // message on the field and return to idle so the visitor can fix it.
        setErrors(outcome.fieldErrors as FieldErrors);
        setState("idle");
      } else {
        // Other failure → generic error, re-enabling submit and retaining
        // values (Req 10.7).
        setState("error");
      }
    } catch {
      // Rejection/abort/timeout → error, re-enable submit, retain values
      // (Req 10.7).
      setState("error");
    } finally {
      clearTimeout(timeoutId);
    }
  };

  return (
    <section
      id="registration"
      className="section"
      aria-labelledby="registration-heading"
    >
      <div className="form-card">
        <div className="section-head">
          <span className="eyebrow">Garanta sua vaga</span>
          <h2 id="registration-heading" className="section-title">
            Inscreva-se
          </h2>
          <p className="lead">
            <strong>Vagas limitadas.</strong> Preencha os dados e siga para o
            pagamento seguro — cartão em até 6x ou pix.
          </p>
        </div>

        <form className="reg-form" onSubmit={handleSubmit} noValidate>
          {/* Full name — required, ≤100, also the CTA focus target (Req 9.6). */}
          <div className="field">
            <label htmlFor="reg-full-name">Nome completo *</label>
            <input
              id="reg-full-name"
              name="fullName"
              type="text"
              ref={fullNameRef}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              maxLength={MAX_LENGTHS.fullName}
              required
              autoComplete="name"
              aria-invalid={errors.fullName ? true : undefined}
              aria-describedby={
                errors.fullName ? "reg-full-name-error" : undefined
              }
              disabled={busy}
            />
            {errors.fullName && (
              <span id="reg-full-name-error" role="alert" className="field-error">
                {errors.fullName}
              </span>
            )}
          </div>

          {/* Email — required, ≤254. */}
          <div className="field">
            <label htmlFor="reg-email">E-mail *</label>
            <input
              id="reg-email"
              name="email"
              type="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={MAX_LENGTHS.email}
              required
              autoComplete="email"
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={errors.email ? "reg-email-error" : undefined}
              disabled={busy}
            />
            {errors.email && (
              <span id="reg-email-error" role="alert" className="field-error">
                {errors.email}
              </span>
            )}
          </div>

          {/* Phone — required, 10–11 digits (formatting allowed in the box). */}
          <div className="field">
            <label htmlFor="reg-phone">Telefone *</label>
            <input
              id="reg-phone"
              name="phone"
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              maxLength={MAX_LENGTHS.phone}
              required
              autoComplete="tel"
              aria-invalid={errors.phone ? true : undefined}
              aria-describedby={errors.phone ? "reg-phone-error" : undefined}
              disabled={busy}
            />
            {errors.phone && (
              <span id="reg-phone-error" role="alert" className="field-error">
                {errors.phone}
              </span>
            )}
          </div>

          {/* Company — optional, ≤100. */}
          <div className="field">
            <label htmlFor="reg-company">Empresa</label>
            <input
              id="reg-company"
              name="company"
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              maxLength={MAX_LENGTHS.company}
              autoComplete="organization"
              disabled={busy}
            />
          </div>

          {/* Coupon — optional discount code. A 100% coupon skips payment; a
              partial one just lowers the checkout amount. The server owns the
              rule and returns a per-field message when the code is invalid. */}
          <div className="field">
            <label htmlFor="reg-coupon">Cupom de desconto (opcional)</label>
            <input
              id="reg-coupon"
              name="coupon"
              type="text"
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
              maxLength={MAX_LENGTHS.coupon}
              autoComplete="off"
              autoCapitalize="characters"
              aria-invalid={errors.coupon ? true : undefined}
              aria-describedby={errors.coupon ? "reg-coupon-error" : undefined}
              disabled={busy}
            />
            {errors.coupon && (
              <span id="reg-coupon-error" role="alert" className="field-error">
                {errors.coupon}
              </span>
            )}
          </div>

          <button type="submit" disabled={busy} className="btn btn-primary">
            {state === "submitting"
              ? "Enviando…"
              : state === "redirecting"
                ? "Redirecionando…"
                : coupon.trim()
                  ? "Continuar"
                  : "Ir para o pagamento"}
          </button>

          {/* Async outcome messages (Req 10.2, 10.7). */}
          {state === "redirecting" && (
            <p
              data-testid="registration-redirecting"
              role="status"
              className="form-status form-status--ok"
            >
              {FORM_MESSAGES.redirecting}
            </p>
          )}
          {state === "success" && (
            <p
              data-testid="registration-success"
              role="status"
              className="form-status form-status--ok"
            >
              {FORM_MESSAGES.success}
            </p>
          )}
          {state === "error" && (
            <p
              data-testid="registration-error"
              role="alert"
              className="form-status form-status--err"
            >
              {FORM_MESSAGES.error}
            </p>
          )}
        </form>
      </div>
    </section>
  );
}

export default RegistrationForm;
