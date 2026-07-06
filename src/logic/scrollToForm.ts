/**
 * Scroll-to-form behavior for Registration CTAs (Req 9.4–9.7).
 *
 * Given the Registration_Form element and the first input to focus, this helper
 * decides whether a scroll is needed and then moves keyboard focus:
 * - If the form is NOT fully visible in the viewport, it smooth-scrolls the
 *   form's top into view (`block: "start"`) and then focuses the first input
 *   (Req 9.4, 9.5, 9.6).
 * - If the form is ALREADY fully visible, it skips scrolling and only focuses
 *   the first input, retaining the current scroll position (Req 9.7).
 *
 * The module is deliberately defensive so it stays testable under jsdom, which
 * implements neither layout (`getBoundingClientRect` returns zeros) nor
 * `scrollIntoView`. Capability checks guard every browser-only call and a
 * sensible visibility fallback is used when measurements are unavailable.
 */

/**
 * Determine whether `element`'s top edge is positioned such that the element is
 * fully visible within the current viewport.
 *
 * "Fully visible" means the element's top is at or below the viewport top and
 * its bottom is at or above the viewport bottom. When measurements are not
 * available (e.g. jsdom returns an all-zero rect, or APIs are missing), the
 * element is treated as NOT fully visible so the caller defaults to scrolling.
 *
 * @param element The element to measure (typically the Registration_Form).
 * @returns `true` if the element is fully within the viewport, else `false`.
 */
export function isFullyVisible(element: HTMLElement): boolean {
  if (typeof element.getBoundingClientRect !== "function") {
    return false;
  }

  const rect = element.getBoundingClientRect();

  const viewportHeight =
    typeof window !== "undefined" && typeof window.innerHeight === "number"
      ? window.innerHeight
      : 0;

  // No usable viewport/layout information (common in jsdom): default to "not
  // fully visible" so the caller scrolls rather than silently skipping.
  if (viewportHeight <= 0) {
    return false;
  }

  // A zero-height rect at the origin means layout was never computed.
  if (rect.top === 0 && rect.bottom === 0) {
    return false;
  }

  return rect.top >= 0 && rect.bottom <= viewportHeight;
}

/** Options for {@link scrollToForm}. */
export interface ScrollToFormOptions {
  /** The Registration_Form element (scroll target). */
  form: HTMLElement | null | undefined;
  /** The first input field of the form (focus target). */
  firstInput: HTMLElement | null | undefined;
}

/**
 * Scroll the Registration_Form into view (when needed) and focus its first input.
 *
 * Behavior:
 * - When the form is not fully visible, smooth-scrolls its top into view, then
 *   focuses the first input (Req 9.4–9.6).
 * - When the form is already fully visible, skips scrolling and only focuses the
 *   first input (Req 9.7).
 *
 * All browser-only calls (`scrollIntoView`, `focus`) are capability-guarded so
 * the function is safe to call in environments without full DOM/layout support.
 *
 * @param options The form and first-input elements.
 */
export function scrollToForm({ form, firstInput }: ScrollToFormOptions): void {
  if (form && !isFullyVisible(form)) {
    if (typeof form.scrollIntoView === "function") {
      form.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  if (firstInput && typeof firstInput.focus === "function") {
    firstInput.focus();
  }
}
