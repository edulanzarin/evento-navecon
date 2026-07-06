import { describe, expect, it } from 'vitest';
import fc from 'fast-check';

import { isValidEmail } from './validation';

/**
 * Property-based test for email validation.
 *
 * Contract under test: `isValidEmail(value)` returns true iff `value` contains
 * exactly one "@" separating a non-empty local part from a domain part that
 * contains at least one ".".
 */
describe('isValidEmail property', () => {
  // Generators -------------------------------------------------------------

  // A segment with no "@" and no whitespace surprises. Allows letters, digits,
  // and a small set of common email-safe characters, including ".".
  const segment = fc
    .stringOf(
      fc.constantFrom(
        ...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789._+-'.split(''),
      ),
      { minLength: 1, maxLength: 12 },
    )
    .filter((s) => !s.includes('@'));

  // Non-empty local part with no "@".
  const localPart = segment;

  // A domain that contains at least one dot, with non-empty labels around it,
  // and no "@".
  const dottedDomain = fc
    .array(segment, { minLength: 2, maxLength: 4 })
    .map((labels) => labels.join('.'))
    .filter((d) => d.includes('.') && !d.includes('@'));

  // Well-formed: exactly one "@", non-empty local, dotted domain.
  const wellFormedEmail = fc
    .tuple(localPart, dottedDomain)
    .map(([local, domain]) => `${local}@${domain}`);

  // Malformed family A: zero "@".
  const noAtEmail = fc
    .stringOf(
      fc.constantFrom(
        ...'abcdefghijklmnopqrstuvwxyz0123456789.-_'.split(''),
      ),
      { minLength: 1, maxLength: 20 },
    )
    .filter((s) => !s.includes('@'));

  // Malformed family B: multiple "@" (2 or 3).
  const multipleAtEmail = fc
    .tuple(
      fc.array(segment, { minLength: 3, maxLength: 4 }),
      dottedDomain,
    )
    .map(([locals, domain]) => `${locals.join('@')}@${domain}`)
    .filter((s) => (s.match(/@/g) ?? []).length >= 2);

  // Malformed family C: empty local part (starts with "@"), dotted domain.
  const emptyLocalEmail = dottedDomain.map((domain) => `@${domain}`);

  // Malformed family D: dotless domain (exactly one "@", non-empty local,
  // domain has no dot).
  const dotlessDomain = segment.filter((d) => !d.includes('.'));
  const dotlessDomainEmail = fc
    .tuple(localPart, dotlessDomain)
    .map(([local, domain]) => `${local}@${domain}`);

  // Properties -------------------------------------------------------------

  // Feature: navecon-landing-page, Property 4: Email validation accepts well-formed and rejects malformed addresses
  it('accepts well-formed addresses (exactly one "@", non-empty local, dotted domain)', () => {
    fc.assert(
      fc.property(wellFormedEmail, (email) => {
        expect(isValidEmail(email)).toBe(true);
      }),
      { numRuns: 200 },
    );
  });

  // Feature: navecon-landing-page, Property 4: Email validation accepts well-formed and rejects malformed addresses
  it('rejects addresses with zero "@"', () => {
    fc.assert(
      fc.property(noAtEmail, (email) => {
        expect(isValidEmail(email)).toBe(false);
      }),
      { numRuns: 200 },
    );
  });

  // Feature: navecon-landing-page, Property 4: Email validation accepts well-formed and rejects malformed addresses
  it('rejects addresses with multiple "@"', () => {
    fc.assert(
      fc.property(multipleAtEmail, (email) => {
        expect(isValidEmail(email)).toBe(false);
      }),
      { numRuns: 200 },
    );
  });

  // Feature: navecon-landing-page, Property 4: Email validation accepts well-formed and rejects malformed addresses
  it('rejects addresses with an empty local part', () => {
    fc.assert(
      fc.property(emptyLocalEmail, (email) => {
        expect(isValidEmail(email)).toBe(false);
      }),
      { numRuns: 200 },
    );
  });

  // Feature: navecon-landing-page, Property 4: Email validation accepts well-formed and rejects malformed addresses
  it('rejects addresses whose domain contains no dot', () => {
    fc.assert(
      fc.property(dotlessDomainEmail, (email) => {
        expect(isValidEmail(email)).toBe(false);
      }),
      { numRuns: 200 },
    );
  });
});
