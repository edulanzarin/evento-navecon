/**
 * RegistrationCta — the shared registration call-to-action (Req 9).
 *
 * A single reusable component used everywhere a registration prompt appears
 * (the Hero_Section and the below-Audience position). Because the visible label
 * comes from the shared {@link CTA_LABEL} constant, every instance renders
 * identical pt-BR wording (Req 9.3).
 *
 * It renders a real `<button type="button">` so keyboard activation (Enter and
 * Space) is handled natively (Req 9.4) and the control exposes a discernible
 * accessible name. A 44×44px minimum touch target is applied for comfortable
 * tapping on small viewports (Req 2.6).
 *
 * On activation (pointer click, touch tap, or keyboard) it invokes
 * {@link scrollToForm} with the form and first-input elements: it smooth-scrolls
 * the form's top into view and focuses the first input, or — when the form is
 * already fully visible — keeps the scroll position and only focuses the first
 * input (Req 9.4–9.7). An optional `onActivate` override replaces this behavior,
 * primarily to simplify testing.
 */

import type { ButtonHTMLAttributes, CSSProperties, RefObject } from "react";
import { scrollToForm } from "../logic/scrollToForm";

/**
 * The single source of truth for the CTA label, in Brazilian Portuguese.
 * Sharing one constant guarantees identical wording across all CTA instances
 * (Req 9.3).
 */
export const CTA_LABEL = "Quero garantir minha vaga";

export interface RegistrationCtaProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> {
  /** Reference to the Registration_Form element (scroll target). */
  formRef: RefObject<HTMLElement | null>;
  /** Reference to the form's first input field (focus target). */
  firstInputRef: RefObject<HTMLElement | HTMLInputElement | null>;
  /**
   * Optional override for the activation behavior. When provided it is called
   * instead of the built-in scroll/focus logic (useful for testing).
   */
  onActivate?: () => void;
  /** Optional visible label override; defaults to {@link CTA_LABEL}. */
  label?: string;
}

/** Minimum touch target of 44×44px for comfortable tapping (Req 2.6). */
const TOUCH_TARGET_STYLE: CSSProperties = {
  minWidth: "44px",
  minHeight: "44px",
};

/**
 * Shared registration call-to-action button. See module docs for the full
 * behavior contract (Req 9.1–9.7, 2.6).
 */
export function RegistrationCta({
  formRef,
  firstInputRef,
  onActivate,
  label = CTA_LABEL,
  style,
  ...buttonProps
}: RegistrationCtaProps) {
  const handleClick = () => {
    if (onActivate) {
      onActivate();
      return;
    }

    scrollToForm({
      form: formRef.current,
      firstInput: firstInputRef.current,
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      style={{ ...TOUCH_TARGET_STYLE, ...style }}
      {...buttonProps}
    >
      {label}
    </button>
  );
}
