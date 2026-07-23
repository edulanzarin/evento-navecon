/**
 * Example/edge tests for the `Footer` content component.
 *
 * Verifies the footer behavior contract from the design:
 *  - renders the brand name "Navecon Contabilidade" (Req 13.1);
 *  - renders the full Brusque unit address in an <address> (Req 13.2);
 *  - renders the light logo via SafeImage (src/alt) (Req 13.3);
 *  - swaps to a role="img" fallback when the logo fails to load while the rest
 *    of the footer stays visible (Req 13.4);
 *  - renders contacts as a list with one item per contact, links when an href
 *    is present (Req 13.5);
 *  - renders a pt-BR pending placeholder when no contacts are provided (Req 13.6).
 *
 * Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6
 */
import { describe, it, expect } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Footer } from "./Footer";
import { PENDING_MESSAGES } from "../content/resolvers";
import type { ContactDetail } from "../content/types";

describe("Footer", () => {
  it("renders the brand lockup and full address (Req 13.1/13.2/13.3)", () => {
    render(<Footer contacts={[]} />);

    // Full Brusque unit address in an <address> element (Req 13.2).
    // Displayed across three lines, so assert each fact separately.
    const address = screen.getByTestId("footer-address");
    expect(address).toBeInTheDocument();
    expect(address.tagName.toLowerCase()).toBe("address");
    expect(address).toHaveTextContent("Av. 1º de Maio, 38 – Sala 12");
    expect(address).toHaveTextContent("Centro 2, Brusque – SC");
    expect(address).toHaveTextContent("CEP 88353202");

    // While loading, SafeImage renders the real <img> for the footer lockup;
    // its alt carries the brand name (Req 13.1/13.3).
    const logo = document.querySelector("img");
    expect(logo).not.toBeNull();
    expect((logo as HTMLImageElement).getAttribute("src")).toMatch(
      /\/assets\/logo\/logo-footer\.png$/
    );
    expect((logo as HTMLImageElement).alt).toBe("Navecon Contabilidade");
  });

  it("swaps to the logo fallback on load error while keeping the rest of the footer visible (Req 13.4)", () => {
    render(<Footer contacts={[]} />);

    const logo = document.querySelector("img");
    expect(logo).not.toBeNull();

    fireEvent.error(logo as HTMLImageElement);

    // The <img> is replaced by the custom fallback block (role="img") that
    // still carries the brand name (Req 13.1).
    expect(document.querySelector("img")).toBeNull();
    expect(
      screen.getByRole("img", { name: "Navecon Contabilidade" })
    ).toBeInTheDocument();

    // The rest of the footer stays visible: the address.
    expect(screen.getByTestId("footer-address")).toHaveTextContent(
      "Av. 1º de Maio, 38 – Sala 12"
    );
  });

  it("renders contacts as a list with links for href and text otherwise (Req 13.5)", () => {
    const contacts: ContactDetail[] = [
      {
        kind: "email",
        label: "contato@navecon.com",
        href: "mailto:contato@navecon.com",
      },
      { kind: "phone", label: "(47) 99999-9999" },
    ];

    render(<Footer contacts={contacts} />);

    const list = screen.getByTestId("footer-contacts");
    expect(list).toBeInTheDocument();
    expect(list.tagName.toLowerCase()).toBe("ul");

    // One <li> per contact.
    const items = list.querySelectorAll("li");
    expect(items).toHaveLength(2);

    // The email renders as a link carrying its href.
    const emailLink = screen.getByRole("link", { name: "contato@navecon.com" });
    expect(emailLink).toHaveAttribute("href", "mailto:contato@navecon.com");

    // The phone (no href) renders as plain text, not a link.
    expect(screen.getByText("(47) 99999-9999")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "(47) 99999-9999" })
    ).toBeNull();

    // The pending placeholder is not shown when contacts exist.
    expect(screen.queryByTestId("footer-contacts-pending")).toBeNull();
  });

  it("renders the pt-BR pending placeholder when no contacts are provided (Req 13.6)", () => {
    render(<Footer contacts={[]} />);

    const pending = screen.getByTestId("footer-contacts-pending");
    expect(pending).toBeInTheDocument();
    expect(pending).toHaveTextContent(PENDING_MESSAGES.contacts);
    expect(pending).toHaveTextContent("Informações de contato em breve.");

    // The contacts list is not shown in the pending branch.
    expect(screen.queryByTestId("footer-contacts")).toBeNull();
  });
});
