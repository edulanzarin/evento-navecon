/**
 * Example/edge tests for the `LocationSection` component.
 *
 * The map now uses MapLibre GL (OpenFreeMap) loaded on demand. In jsdom there
 * is no WebGL, so map initialization fails and the component shows its fallback
 * — which is exactly the graceful-degradation path we want to verify.
 *
 * Verified:
 *  - the full venue address is rendered (Req 11.1);
 *  - the map container is present (Req 11.2);
 *  - the external "Abrir no mapa" link opens in a new tab with safe rel attrs
 *    and a Google Maps href (Req 11.3);
 *  - when the map cannot initialize, the fallback (address + external link)
 *    appears while the heading stays visible (Req 11.4).
 *
 * Requirements: 11.1, 11.2, 11.3, 11.4
 */
import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { LocationSection } from "./LocationSection";

const FULL_ADDRESS =
  "Av. 1º de Maio, 38 – Sala 12 – Centro 2, Brusque – SC, CEP 88353202";

/** What the card shows: two lines, without the dash before "Centro". */
const DISPLAY_ADDRESS =
  "Av. 1º de Maio, 38 – Sala 12 Centro 2, Brusque – SC, CEP 88353202";

describe("LocationSection", () => {
  it("renders the full venue address text (Req 11.1)", () => {
    render(<LocationSection />);
    const address = screen.getByTestId("location-address");
    expect(address).toBeInTheDocument();
    expect(address).toHaveTextContent(DISPLAY_ADDRESS);
  });

  it("renders the map container (Req 11.2)", () => {
    render(<LocationSection />);
    expect(screen.getByTestId("location-map")).toBeInTheDocument();
  });

  it("renders an external 'Abrir no mapa' link opening in a new tab (Req 11.3)", () => {
    render(<LocationSection />);
    const link = screen.getByTestId("location-external-link");
    expect(link).toHaveTextContent("Abrir no mapa");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    const href = link.getAttribute("href") ?? "";
    expect(href).toContain("google.com/maps");
    expect(href).toContain(encodeURIComponent(FULL_ADDRESS));
  });

  it("shows the fallback (address + link) when the map cannot initialize, keeping the heading visible (Req 11.4)", async () => {
    render(<LocationSection />);

    // jsdom has no WebGL → MapLibre init fails → fallback appears.
    const fallback = await screen.findByTestId("location-fallback");
    expect(fallback).toHaveAttribute("role", "status");
    expect(within(fallback).getByText(FULL_ADDRESS)).toBeInTheDocument();
    expect(
      within(fallback).getByTestId("location-external-link")
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { name: "Localização" })
    ).toBeInTheDocument();
  });

  it("uses a provided address override when passed (Req 11.1)", () => {
    const custom = "Rua de Teste, 100 – Centro, Cidade – SC";
    render(<LocationSection address={custom} />);
    expect(screen.getByTestId("location-address")).toHaveTextContent(custom);
  });
});
