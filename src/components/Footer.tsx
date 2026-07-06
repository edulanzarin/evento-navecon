/**
 * Footer — the page footer content (task 11.7).
 *
 * Renders the brand name "Navecon Contabilidade" (Req 13.1), the full Brusque
 * unit address (Req 13.2), and the light logo variant through {@link SafeImage}
 * (Req 13.3). If the logo fails to load, SafeImage swaps in an equal-dimension
 * placeholder block while the rest of the footer stays visible (Req 13.4).
 *
 * Contact details render as distinct items when at least one is provided
 * (Req 13.5); each item shows its label, wrapped in an `<a>` when an `href` is
 * supplied. When no contacts are provided, a visible pt-BR pending placeholder
 * is shown instead (Req 13.6). Exactly one of the two branches renders.
 *
 * This component renders its inner content in a `<div>` (NOT a nested
 * `<footer>`); task 12.1 places it inside the App's `<footer>` landmark.
 *
 * Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6
 */
import { ASSETS } from "../content/assets";
import { eventContent } from "../content/eventContent";
import { PENDING_MESSAGES } from "../content/resolvers";
import type { ContactDetail } from "../content/types";
import { SafeImage } from "./SafeImage";

/** Reserved logo box so the footer layout stays stable while media loads. */
const LOGO_SIZE = 44;

export interface FooterProps {
  /** Footer contact details; empty → pending placeholder (Req 13.5/13.6). */
  contacts: ContactDetail[];
  /** Full venue address; defaults to the Brusque unit address (Req 13.2). */
  address?: string;
}

/**
 * Footer content. See module docs for the full behavior contract. Renders the
 * brand name, address, light logo (with placeholder fallback), and either the
 * provided contacts or a pending placeholder.
 */
export function Footer({
  contacts,
  address = eventContent.fullAddress,
}: FooterProps) {
  const hasContacts = contacts.length >= 1;

  return (
    <div className="footer-content">
      {/* Light logo with an equal-dimension placeholder fallback (Req 13.3/13.4). */}
      <SafeImage
        src={ASSETS.logo.light}
        alt="Navecon Contabilidade"
        width={LOGO_SIZE}
        height={LOGO_SIZE}
        fallback={
          <div role="img" aria-label="Navecon Contabilidade">
            Navecon Contabilidade
          </div>
        }
      />

      {/* Brand name (Req 13.1). */}
      <p>Navecon Contabilidade</p>

      {/* Full Brusque unit address (Req 13.2). */}
      <address>{address}</address>

      {/* Exactly one of contacts or the pending placeholder (Req 13.5/13.6). */}
      {hasContacts ? (
        <ul className="footer-contacts" data-testid="footer-contacts">
          {contacts.map((contact, index) => (
            <li key={`${contact.kind}-${index}-${contact.label}`}>
              {contact.href ? (
                <a href={contact.href}>{contact.label}</a>
              ) : (
                contact.label
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p
          className="pending"
          data-testid="footer-contacts-pending"
          role="status"
        >
          {PENDING_MESSAGES.contacts}
        </p>
      )}
    </div>
  );
}

export default Footer;
