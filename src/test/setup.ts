/**
 * Vitest global test setup.
 *
 * - Registers @testing-library/jest-dom matchers (e.g. toBeInTheDocument).
 * - Cleans up the DOM rendered by React Testing Library after each test.
 */
import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});
