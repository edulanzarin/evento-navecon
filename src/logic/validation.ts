/**
 * Registration form validation — pure, framework-free TypeScript.
 *
 * This module contains the validation primitives and the top-level
 * `validateRegistration` function used by the registration form. It has no
 * React/DOM imports so it can be unit- and property-tested in isolation.
 *
 * `validateRegistration` never mutates its input, so the UI can safely retain
 * the values a Visitor already entered when a submission fails validation.
 */

/** Raw, unvalidated registration input as captured from the form fields. */
export interface RegistrationInput {
  fullName: string; // required, ≤100
  email: string; // required, ≤254
  phone: string; // required, raw input; normalized to digits for validation; ≤11 digits
  company: string; // optional, ≤100
}

/** Per-field validation messages (pt-BR). A field key is present only when invalid. */
export interface FieldErrors {
  fullName?: string;
  email?: string;
  phone?: string;
}

/** Normalized, validated payload ready to be submitted. */
export interface RegistrationPayload {
  fullName: string;
  email: string;
  phoneDigits: string; // normalized digits only
  company: string | null;
}

/** Discriminated result of validating a {@link RegistrationInput}. */
export type ValidationResult =
  | { valid: true; value: RegistrationPayload }
  | { valid: false; errors: FieldErrors };

/** pt-BR validation messages used by {@link validateRegistration}. */
export const VALIDATION_MESSAGES = {
  fullNameRequired: 'Informe seu nome completo.',
  emailRequired: 'Informe seu e-mail.',
  emailInvalid: 'Informe um e-mail válido.',
  phoneRequired: 'Informe seu telefone.',
  phoneInvalid: 'Informe um telefone válido com DDD (10 ou 11 dígitos).',
} as const;

/**
 * Returns `true` when the value contains at least one non-whitespace character.
 * Rejects the empty string and whitespace-only strings.
 */
export function isNonEmpty(value: string): boolean {
  return value.trim().length > 0;
}

/**
 * Returns `true` iff the value contains exactly one "@" that separates a
 * non-empty local part from a domain part containing at least one ".".
 */
export function isValidEmail(value: string): boolean {
  const atParts = value.split('@');
  if (atParts.length !== 2) {
    return false; // zero or multiple "@"
  }
  const [local, domain] = atParts;
  if (local.length === 0) {
    return false; // empty local part
  }
  return domain.includes('.');
}

/**
 * Returns `true` iff the value, reduced to its numeric digits, has a length of
 * exactly 10 or 11 (a 2-digit DDD plus an 8- or 9-digit number). Non-digit
 * characters (spaces, parentheses, dashes, "+") are stripped before counting.
 */
export function isValidBrazilPhone(value: string): boolean {
  const digitCount = value.replace(/\D/g, '').length;
  return digitCount === 10 || digitCount === 11;
}

/**
 * Validates a registration input without mutating it.
 *
 * Required fields:
 * - `fullName`: invalid when empty/whitespace-only.
 * - `email`: invalid when empty/whitespace-only OR fails {@link isValidEmail}.
 * - `phone`: invalid when empty/whitespace-only OR fails {@link isValidBrazilPhone}.
 *
 * The optional `company` field never produces an error.
 *
 * On success returns `{ valid: true, value }` where the payload uses the
 * trimmed full name, trimmed email, digits-only phone, and the trimmed company
 * or `null` when the company is empty/whitespace-only.
 */
export function validateRegistration(input: RegistrationInput): ValidationResult {
  const errors: FieldErrors = {};

  if (!isNonEmpty(input.fullName)) {
    errors.fullName = VALIDATION_MESSAGES.fullNameRequired;
  }

  if (!isNonEmpty(input.email)) {
    errors.email = VALIDATION_MESSAGES.emailRequired;
  } else if (!isValidEmail(input.email)) {
    errors.email = VALIDATION_MESSAGES.emailInvalid;
  }

  if (!isNonEmpty(input.phone)) {
    errors.phone = VALIDATION_MESSAGES.phoneRequired;
  } else if (!isValidBrazilPhone(input.phone)) {
    errors.phone = VALIDATION_MESSAGES.phoneInvalid;
  }

  if (errors.fullName || errors.email || errors.phone) {
    return { valid: false, errors };
  }

  const trimmedCompany = input.company.trim();
  const value: RegistrationPayload = {
    fullName: input.fullName.trim(),
    email: input.email.trim(),
    phoneDigits: input.phone.replace(/\D/g, ''),
    company: trimmedCompany.length > 0 ? trimmedCompany : null,
  };

  return { valid: true, value };
}
