import { describe, expect, it } from 'vitest';
import fc from 'fast-check';

import { isValidBrazilPhone } from './validation';

/**
 * Property-based test for Brazilian phone validation.
 *
 * Contract under test: `isValidBrazilPhone(value)` strips every non-digit
 * character and returns true iff the resulting digit count is exactly 10 or 11
 * (a 2-digit DDD plus an 8- or 9-digit number). Non-digit characters (spaces,
 * parentheses, dashes, "+") never affect the outcome other than being stripped
 * before counting.
 */
describe('isValidBrazilPhone property', () => {
  // Generators -------------------------------------------------------------

  // The non-digit "noise" characters that may appear in a formatted phone.
  const noiseChars = [' ', '(', ')', '-', '+'];
  const noiseChar = fc.constantFrom(...noiseChars);

  // A single digit "0".."9".
  const digitChar = fc.constantFrom(...'0123456789'.split(''));

  // Arbitrary digit string of a given exact length.
  const digitsOfLength = (len: number) =>
    fc.array(digitChar, { minLength: len, maxLength: len }).map((d) => d.join(''));

  /**
   * Given a digit string, produces an arbitrary that interleaves non-digit
   * noise characters at random positions (before the first digit, between any
   * pair of digits, and after the last digit). The digit count is preserved,
   * so the expected validity of the noisy string equals that of `digits`.
   *
   * Returns a `{ digits, noisy }` pair so the property can assert against the
   * exact digit count that produced the noisy string.
   */
  function withNoise(digits: string): fc.Arbitrary<{ digits: string; noisy: string }> {
    const gapCount = digits.length + 1;
    return fc
      .array(fc.array(noiseChar, { minLength: 0, maxLength: 3 }), {
        minLength: gapCount,
        maxLength: gapCount,
      })
      .map((gaps) => {
        const chars = digits.split('');
        let noisy = gaps[0].join('');
        for (let i = 0; i < chars.length; i += 1) {
          noisy += chars[i] + gaps[i + 1].join('');
        }
        return { digits, noisy };
      });
  }

  // Arbitrary digit string of arbitrary length (0..18 spans well below 10, the
  // valid 10/11 band, and well above 11) with formatting noise injected.
  const noisyArbitraryLength = fc
    .array(digitChar, { minLength: 0, maxLength: 18 })
    .map((d) => d.join(''))
    .chain(withNoise);

  // Properties -------------------------------------------------------------

  // Feature: navecon-landing-page, Property 5: Brazilian phone validation depends only on digit count
  it('returns true iff the stripped digit count is 10 or 11, regardless of formatting noise', () => {
    fc.assert(
      fc.property(noisyArbitraryLength, ({ digits, noisy }) => {
        const digitCount = digits.length;
        const expected = digitCount === 10 || digitCount === 11;
        expect(isValidBrazilPhone(noisy)).toBe(expected);
      }),
      { numRuns: 200 },
    );
  });

  // Feature: navecon-landing-page, Property 5: Brazilian phone validation depends only on digit count
  it('accepts noisy inputs that reduce to exactly 10 or 11 digits', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(10, 11).chain((len) => digitsOfLength(len).chain(withNoise)),
        ({ noisy }) => {
          expect(isValidBrazilPhone(noisy)).toBe(true);
        },
      ),
      { numRuns: 200 },
    );
  });

  // Feature: navecon-landing-page, Property 5: Brazilian phone validation depends only on digit count
  it('rejects noisy inputs with fewer than 10 digits', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 9 }).chain((len) => digitsOfLength(len).chain(withNoise)),
        ({ noisy }) => {
          expect(isValidBrazilPhone(noisy)).toBe(false);
        },
      ),
      { numRuns: 200 },
    );
  });

  // Feature: navecon-landing-page, Property 5: Brazilian phone validation depends only on digit count
  it('rejects noisy inputs with more than 11 digits', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 12, max: 20 }).chain((len) => digitsOfLength(len).chain(withNoise)),
        ({ noisy }) => {
          expect(isValidBrazilPhone(noisy)).toBe(false);
        },
      ),
      { numRuns: 200 },
    );
  });

  // Feature: navecon-landing-page, Property 5: Brazilian phone validation depends only on digit count
  it('treats pure noise (no digits) as invalid', () => {
    fc.assert(
      fc.property(fc.array(noiseChar, { minLength: 0, maxLength: 12 }), (noise) => {
        expect(isValidBrazilPhone(noise.join(''))).toBe(false);
      }),
      { numRuns: 100 },
    );
  });
});
