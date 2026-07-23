/**
 * Footer — the page footer content (task 11.7).
 *
 * Renders the full Navecon footer lockup — the symbol plus the "Navecon
 * Contabilidade e Assessoria" wordmark as a single image (Req 13.1/13.3) —
 * along with the full Brusque unit address (Req 13.2), through {@link SafeImage}.
 * If the logo fails to load, SafeImage swaps in an equal-dimension placeholder
 * carrying the brand name so the rest of the footer stays visible (Req 13.4).
 *
 * Layout follows the Navecon institutional footer: centered lockup, a divided
 * row of columns (Endereço · Contato · social icons), and a copyright line.
 *
 * Contact details render as distinct items when at least one is provided
 * (Req 13.5): phone/email/other kinds list under "Contato" (linked when an
 * `href` is supplied); instagram/whatsapp render as icon-only link columns.
 * When no contacts are provided, a visible pt-BR pending placeholder is shown
 * instead (Req 13.6). Exactly one of the two branches renders.
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

/** Reserved logo box so the footer layout stays stable while media loads.
 *  Matches the footer lockup aspect ratio (~1.82:1) so it fills without letterbox. */
const LOGO_WIDTH = 200;
const LOGO_HEIGHT = 110;

/** Contact kinds rendered as icon-only social columns. */
const SOCIAL_KINDS: ContactDetail["kind"][] = ["instagram", "whatsapp"];

const PinIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="26"
    height="26"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const PhoneIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="26"
    height="26"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const InstagramIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="30"
    height="30"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" />
    <circle cx="12" cy="12" r="4.2" />
    <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none" />
  </svg>
);

const WhatsAppIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="30"
    height="30"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
  </svg>
);

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

  // Phone/email/other list under "Contato"; instagram/whatsapp become icons.
  const listedContacts = contacts.filter(
    (c) => !SOCIAL_KINDS.includes(c.kind)
  );
  const socialContacts = contacts.filter((c) =>
    SOCIAL_KINDS.includes(c.kind)
  );

  // Display version: three lines (street/sala, bairro/cidade, CEP).
  const displayAddress = address
    .replace(" – Centro ", "\nCentro ")
    .replace(", CEP ", "\nCEP ");

  return (
    <div className="footer-content">
      {/* Full footer lockup (symbol + brand text) with a placeholder fallback
          (Req 13.1/13.3/13.4). */}
      <SafeImage
        src={ASSETS.logo.footer}
        alt="Navecon Contabilidade"
        width={LOGO_WIDTH}
        height={LOGO_HEIGHT}
        fallback={
          <div role="img" aria-label="Navecon Contabilidade">
            Navecon Contabilidade
          </div>
        }
      />

      <div className="footer-cols">
        {/* Full Brusque unit address (Req 13.2). */}
        <div className="footer-col">
          <span className="footer-col__icon">
            <PinIcon />
          </span>
          <span className="footer-col__label">Endereço</span>
          <address data-testid="footer-address">{displayAddress}</address>
        </div>

        {/* Exactly one of contacts or the pending placeholder (Req 13.5/13.6). */}
        {hasContacts ? (
          <>
            {listedContacts.length > 0 && (
              <div className="footer-col">
                <span className="footer-col__icon">
                  <PhoneIcon />
                </span>
                <span className="footer-col__label">Contato</span>
                <ul className="footer-contacts" data-testid="footer-contacts">
                  {listedContacts.map((contact, index) => (
                    <li key={`${contact.kind}-${index}-${contact.label}`}>
                      {contact.href ? (
                        <a href={contact.href}>{contact.label}</a>
                      ) : (
                        contact.label
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {socialContacts.map((contact, index) => (
              <div className="footer-col" key={`${contact.kind}-${index}`}>
                <span className="footer-col__icon">
                  {contact.kind === "instagram" ? (
                    <InstagramIcon />
                  ) : (
                    <WhatsAppIcon />
                  )}
                </span>
                <span className="footer-col__label">
                  {contact.kind === "instagram" ? "Instagram" : "WhatsApp"}
                </span>
                <a
                  className="footer-social-link"
                  href={contact.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {contact.label}
                </a>
              </div>
            ))}
          </>
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

      <p className="footer-copy">
        © {new Date().getFullYear()} Navecon Contabilidade — Todos os direitos
        reservados.
      </p>
    </div>
  );
}

export default Footer;
