/**
 * Example/async unit tests for the `RegistrationForm` component (task 11.6).
 *
 * Verifies the registration form's async submission contract from the design
 * (RegistrationForm) and Requirement 10:
 *  - all four fields render with their character limits and required markers
 *    (Req 10.1);
 *  - on a valid submission the form calls the injected submitter with the
 *    normalized payload and an AbortSignal and shows a success confirmation
 *    (Req 10.2);
 *  - on an invalid submission per-field pt-BR messages appear, the submitter is
 *    not called, and all entered values are retained (Req 10.3);
 *  - the submit control is disabled while a submission is in flight (Req 10.6);
 *  - a failed/rejected/timed-out submission shows an error, re-enables submit,
 *    and retains values (Req 10.7).
 *
 * These are example-based async unit tests (not property-based).
 *
 * Requirements: 10.1, 10.2, 10.3, 10.6, 10.7
 */
import { describe, it, expect, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RegistrationForm, FORM_MESSAGES } from "./RegistrationForm";
import { VALIDATION_MESSAGES } from "../logic/validation";
import type {
  RegistrationSubmitter,
  SubmitResult,
} from "../logic/submitter";
import type { RegistrationPayload } from "../logic/validation";

/** A submitter whose `submit` is a spy resolving to the given result. */
function mockSubmitter(result: SubmitResult): {
  submitter: RegistrationSubmitter;
  submit: ReturnType<typeof vi.fn>;
} {
  const submit = vi.fn(
    (_payload: RegistrationPayload, _signal: AbortSignal): Promise<SubmitResult> =>
      Promise.resolve(result),
  );
  return { submitter: { submit }, submit };
}

/** A submitter whose `submit` rejects/throws. */
function rejectingSubmitter(): {
  submitter: RegistrationSubmitter;
  submit: ReturnType<typeof vi.fn>;
} {
  const submit = vi.fn(
    (_payload: RegistrationPayload, _signal: AbortSignal): Promise<SubmitResult> =>
      Promise.reject(new Error("network down")),
  );
  return { submitter: { submit }, submit };
}

const VALID = {
  name: "Maria Silva",
  email: "maria@example.com",
  phone: "47999998888",
} as const;

function getNameInput(): HTMLInputElement {
  return screen.getByLabelText(/Nome completo/) as HTMLInputElement;
}
function getEmailInput(): HTMLInputElement {
  return screen.getByLabelText(/E-mail/) as HTMLInputElement;
}
function getPhoneInput(): HTMLInputElement {
  return screen.getByLabelText(/Telefone/) as HTMLInputElement;
}
function getCompanyInput(): HTMLInputElement {
  return screen.getByLabelText(/Empresa/) as HTMLInputElement;
}
function getSubmitButton(): HTMLButtonElement {
  return screen.getByRole("button", {
    name: /(Confirmar inscrição|Enviando)/,
  }) as HTMLButtonElement;
}

/** Fills the form with valid values via userEvent typing. */
async function fillValid(user: ReturnType<typeof userEvent.setup>) {
  await user.type(getNameInput(), VALID.name);
  await user.type(getEmailInput(), VALID.email);
  await user.type(getPhoneInput(), VALID.phone);
}

describe("RegistrationForm", () => {
  describe("field set + limits (Req 10.1)", () => {
    it("renders all four inputs with their maxLength limits", () => {
      // A passing submitter keeps the form happy; not exercised here.
      const { submitter } = mockSubmitter({ ok: true });
      render(<RegistrationForm submitter={submitter} />);

      expect(getNameInput()).toBeInTheDocument();
      expect(getEmailInput()).toBeInTheDocument();
      expect(getPhoneInput()).toBeInTheDocument();
      expect(getCompanyInput()).toBeInTheDocument();

      expect(getNameInput()).toHaveAttribute("maxLength", "100");
      expect(getEmailInput()).toHaveAttribute("maxLength", "254");
      expect(getPhoneInput()).toHaveAttribute("maxLength", "15");
      expect(getCompanyInput()).toHaveAttribute("maxLength", "100");
    });

    it("marks name, email, and phone as required and company as optional", () => {
      const { submitter } = mockSubmitter({ ok: true });
      render(<RegistrationForm submitter={submitter} />);

      expect(getNameInput()).toBeRequired();
      expect(getEmailInput()).toBeRequired();
      expect(getPhoneInput()).toBeRequired();
      expect(getCompanyInput()).not.toBeRequired();
    });
  });

  describe("validation messages + retained values (Req 10.3)", () => {
    it("shows per-field messages on an empty submit and does not call the submitter", async () => {
      const user = userEvent.setup();
      const { submitter, submit } = mockSubmitter({ ok: true });
      render(<RegistrationForm submitter={submitter} />);

      await user.click(getSubmitButton());

      const alerts = await screen.findAllByRole("alert");
      const messages = alerts.map((a) => a.textContent);
      expect(messages).toContain(VALIDATION_MESSAGES.fullNameRequired);
      expect(messages).toContain(VALIDATION_MESSAGES.emailRequired);
      expect(messages).toContain(VALIDATION_MESSAGES.phoneRequired);

      // The submitter must not be invoked for an invalid form.
      expect(submit).not.toHaveBeenCalled();
    });

    it("flags an invalid email while other fields are valid", async () => {
      const user = userEvent.setup();
      const { submitter, submit } = mockSubmitter({ ok: true });
      render(<RegistrationForm submitter={submitter} />);

      await user.type(getNameInput(), VALID.name);
      await user.type(getEmailInput(), "not-an-email");
      await user.type(getPhoneInput(), VALID.phone);
      await user.click(getSubmitButton());

      expect(
        await screen.findByText(VALIDATION_MESSAGES.emailInvalid),
      ).toBeInTheDocument();
      expect(getEmailInput()).toHaveAttribute("aria-invalid", "true");
      expect(submit).not.toHaveBeenCalled();
    });

    it("flags an invalid phone while other fields are valid", async () => {
      const user = userEvent.setup();
      const { submitter, submit } = mockSubmitter({ ok: true });
      render(<RegistrationForm submitter={submitter} />);

      await user.type(getNameInput(), VALID.name);
      await user.type(getEmailInput(), VALID.email);
      await user.type(getPhoneInput(), "123"); // too few digits
      await user.click(getSubmitButton());

      expect(
        await screen.findByText(VALIDATION_MESSAGES.phoneInvalid),
      ).toBeInTheDocument();
      expect(getPhoneInput()).toHaveAttribute("aria-invalid", "true");
      expect(submit).not.toHaveBeenCalled();
    });

    it("retains the typed values after an invalid submit", async () => {
      const user = userEvent.setup();
      const { submitter } = mockSubmitter({ ok: true });
      render(<RegistrationForm submitter={submitter} />);

      await user.type(getNameInput(), VALID.name);
      await user.type(getEmailInput(), "not-an-email");
      await user.type(getPhoneInput(), VALID.phone);
      await user.type(getCompanyInput(), "Acme Ltda");

      await user.click(getSubmitButton());

      // The error appears...
      expect(
        await screen.findByText(VALIDATION_MESSAGES.emailInvalid),
      ).toBeInTheDocument();

      // ...and every field still holds what the visitor typed (Req 10.3).
      expect(getNameInput()).toHaveValue(VALID.name);
      expect(getEmailInput()).toHaveValue("not-an-email");
      expect(getPhoneInput()).toHaveValue(VALID.phone);
      expect(getCompanyInput()).toHaveValue("Acme Ltda");
    });
  });

  describe("success (Req 10.2)", () => {
    it("calls the submitter with the normalized payload and shows the success message", async () => {
      const user = userEvent.setup();
      const { submitter, submit } = mockSubmitter({ ok: true });
      render(<RegistrationForm submitter={submitter} />);

      await fillValid(user);
      await user.click(getSubmitButton());

      // Success confirmation surfaces once the promise resolves.
      const success = await screen.findByTestId("registration-success");
      expect(success).toHaveTextContent(FORM_MESSAGES.success);

      // Submitter called exactly once with the normalized payload + a signal.
      expect(submit).toHaveBeenCalledTimes(1);
      const [payload, signal] = submit.mock.calls[0];
      expect(payload).toEqual({
        fullName: VALID.name,
        email: VALID.email,
        phoneDigits: "47999998888",
        company: null,
      });
      expect(signal).toBeInstanceOf(AbortSignal);
    });
  });

  describe("submit disabled during processing (Req 10.6)", () => {
    it("disables the submit button while submitting and re-enables on resolve", async () => {
      const user = userEvent.setup();

      // A deferred promise we resolve manually to hold the form in-flight.
      let resolveFn!: (value: SubmitResult) => void;
      const pending = new Promise<SubmitResult>((resolve) => {
        resolveFn = resolve;
      });
      const submit = vi.fn(
        (_payload: RegistrationPayload, _signal: AbortSignal) => pending,
      );
      const submitter: RegistrationSubmitter = { submit };

      render(<RegistrationForm submitter={submitter} />);

      await fillValid(user);
      await user.click(getSubmitButton());

      // While in flight: button disabled and labeled "Enviando…".
      const button = getSubmitButton();
      expect(button).toBeDisabled();
      expect(button).toHaveTextContent("Enviando…");

      // Resolve the deferred submission → success.
      await act(async () => {
        resolveFn({ ok: true });
        await pending;
      });

      expect(
        await screen.findByTestId("registration-success"),
      ).toBeInTheDocument();
      // On success the form stays in the success state (no longer submitting),
      // so the submit control is no longer disabled.
      expect(getSubmitButton()).not.toBeDisabled();
    });
  });

  describe("rejection / error path (Req 10.7)", () => {
    it("shows the error message and re-enables submit when the submitter resolves not-ok", async () => {
      const user = userEvent.setup();
      const { submitter, submit } = mockSubmitter({
        ok: false,
        reason: "HTTP 500",
      });
      render(<RegistrationForm submitter={submitter} />);

      await fillValid(user);
      await user.click(getSubmitButton());

      const error = await screen.findByTestId("registration-error");
      expect(error).toHaveTextContent(FORM_MESSAGES.error);
      expect(submit).toHaveBeenCalledTimes(1);

      // Submit re-enabled and values retained (Req 10.7).
      expect(getSubmitButton()).not.toBeDisabled();
      expect(getNameInput()).toHaveValue(VALID.name);
      expect(getEmailInput()).toHaveValue(VALID.email);
      expect(getPhoneInput()).toHaveValue(VALID.phone);
    });

    it("shows the error message when the submitter rejects/throws", async () => {
      const user = userEvent.setup();
      const { submitter, submit } = rejectingSubmitter();
      render(<RegistrationForm submitter={submitter} />);

      await fillValid(user);
      await user.click(getSubmitButton());

      const error = await screen.findByTestId("registration-error");
      expect(error).toHaveTextContent(FORM_MESSAGES.error);
      expect(submit).toHaveBeenCalledTimes(1);

      // Submit re-enabled and values retained.
      expect(getSubmitButton()).not.toBeDisabled();
      expect(getNameInput()).toHaveValue(VALID.name);
      expect(getEmailInput()).toHaveValue(VALID.email);
      expect(getPhoneInput()).toHaveValue(VALID.phone);
    });
  });
});
