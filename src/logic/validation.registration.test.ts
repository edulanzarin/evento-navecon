import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  validateRegistration,
  isNonEmpty,
  isValidEmail,
  isValidBrazilPhone,
  type RegistrationInput,
} from './validation';

/**
 * Generates a varied pool of strings for each registration field so the
 * property explores empty, whitespace-only, valid, and invalid shapes for
 * full name, email, and phone alike.
 */
const fieldArb: fc.Arbitrary<string> = fc.oneof(
  // empty / whitespace-only (invalid for required fields)
  fc.constant(''),
  fc.constantFrom(' ', '   ', '\t', '\n', ' \t \n '),
  // well-formed emails
  fc.constantFrom('a@b.co', 'user@example.com', 'x.y@sub.domain.org'),
  // malformed emails
  fc.constantFrom('no-at-sign', 'a@@b.com', 'a@bcom', '@b.com', 'a@b@c.com'),
  // valid BR phones (10 or 11 digits, with/without formatting noise)
  fc.constantFrom('4733334444', '47933334444', '(47) 3333-4444', '+55 47 93333-4444'),
  // invalid phones (wrong digit count)
  fc.constantFrom('123', '123456789', '123456789012'),
  // arbitrary free-form strings
  fc.string(),
  fc.string({ minLength: 1, maxLength: 20 }),
);

const inputArb: fc.Arbitrary<RegistrationInput> = fc.record({
  fullName: fieldArb,
  email: fieldArb,
  phone: fieldArb,
  company: fieldArb,
});

describe('validateRegistration (Property 6)', () => {
  // Feature: navecon-landing-page, Property 6: Registration validation flags exactly the invalid required fields and never mutates input
  it('flags exactly the invalid required fields, never errors company, and never mutates input', () => {
    fc.assert(
      fc.property(inputArb, (input) => {
        // Snapshot the input before the call to detect any mutation.
        const snapshot = { ...input };

        // Compute the EXPECTED per-field validity using the same primitive rules.
        const fullNameExpectedInvalid = !isNonEmpty(input.fullName);
        const emailExpectedInvalid = !isNonEmpty(input.email) || !isValidEmail(input.email);
        const phoneExpectedInvalid = !isNonEmpty(input.phone) || !isValidBrazilPhone(input.phone);
        const expectedValid =
          !fullNameExpectedInvalid && !emailExpectedInvalid && !phoneExpectedInvalid;

        const result = validateRegistration(input);

        // valid:true exactly when all required fields pass.
        expect(result.valid).toBe(expectedValid);

        if (result.valid) {
          // No errors object exists in the success branch.
          expect(expectedValid).toBe(true);
        } else {
          const errors = result.errors;
          // A field key is present iff that field is expected invalid.
          expect('fullName' in errors).toBe(fullNameExpectedInvalid);
          expect('email' in errors).toBe(emailExpectedInvalid);
          expect('phone' in errors).toBe(phoneExpectedInvalid);
          // company never appears in errors (it is optional).
          expect('company' in errors).toBe(false);
        }

        // Input object is unchanged after the call (deep-equal to the snapshot).
        expect(input).toEqual(snapshot);
      }),
      { numRuns: 200 },
    );
  });
});
