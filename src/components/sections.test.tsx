/**
 * Example unit tests for the content-driven section components (task 10.6).
 *
 * These verify the section headings and the About/Speakers content contracts:
 *  - AboutSection renders the "Sobre o Evento" heading and the fixed event-format
 *    summary, and shows EXACTLY ONE of the finalized detail or the pending
 *    placeholder (Req 5.1, 5.2, 5.3, 5.4, 5.5).
 *  - SpeakersSection renders the "Quem são os palestrantes" heading, exactly two
 *    entries each pairing a name with its role, and a named-alt placeholder image
 *    when a speaker photo is missing (Req 6.1, 6.6).
 *  - ThemesSection and AudienceSection render their headings (Req 7.1, 8.1).
 *
 * These are example/edge tests (not property-based) — no fast-check.
 *
 * Requirements: 5.1, 5.2, 6.1, 6.6, 7.1, 8.1
 */
import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { AboutSection } from "./AboutSection";
import { SpeakersSection } from "./SpeakersSection";
import { ThemesSection } from "./ThemesSection";
import { AudienceSection } from "./AudienceSection";
import { eventContent } from "../content/eventContent";
import type { SpeakerContent } from "../content/types";

describe("AboutSection (Req 5.1, 5.2)", () => {
  it("renders the 'Sobre o Evento' heading", () => {
    render(<AboutSection aboutDetail={null} />);
    expect(
      screen.getByRole("heading", { name: "Sobre o Evento" })
    ).toBeInTheDocument();
  });

  it("always renders the fixed event-format summary (two-day immersion, dates, venue)", () => {
    render(<AboutSection aboutDetail="Conteúdo final" />);
    // A single summary element mentions all three fixed facts (Req 5.2).
    const summary = screen.getByText(/dois dias/);
    expect(summary).toHaveTextContent("16 e 17 de setembro de 2026");
    expect(summary).toHaveTextContent("Navecon Contabilidade – Unidade Brusque");
  });

  it("shows the finalized detail and NOT the pending placeholder when aboutDetail is provided (Req 5.3/5.5)", () => {
    render(<AboutSection aboutDetail="Conteúdo final" />);

    const detail = screen.getByTestId("about-detail");
    expect(detail).toHaveTextContent("Conteúdo final");
    expect(screen.queryByTestId("about-pending")).toBeNull();
  });

  it("shows the pending placeholder and NOT the detail when aboutDetail is null (Req 5.4/5.5)", () => {
    render(<AboutSection aboutDetail={null} />);

    const pending = screen.getByTestId("about-pending");
    expect(pending).toHaveTextContent("Descrição detalhada em breve.");
    expect(screen.queryByTestId("about-detail")).toBeNull();
  });
});

describe("SpeakersSection (Req 6.1, 6.6)", () => {
  it("renders the 'Quem são os palestrantes' heading", () => {
    render(<SpeakersSection speakers={eventContent.speakers} />);
    expect(
      screen.getByRole("heading", { name: "Quem são os palestrantes" })
    ).toBeInTheDocument();
  });

  it("renders exactly two speaker entries", () => {
    render(<SpeakersSection speakers={eventContent.speakers} />);
    expect(screen.getAllByRole("article")).toHaveLength(2);
  });

  it("pairs each speaker's name with their role within the same entry", () => {
    render(<SpeakersSection speakers={eventContent.speakers} />);
    const entries = screen.getAllByRole("article");

    const fabio = entries.find((el) =>
      within(el).queryByText("Fabio Edelberg")
    );
    expect(fabio).toBeDefined();
    expect(
      within(fabio as HTMLElement).getByText("CEO da Navecon Contabilidade")
    ).toBeInTheDocument();

    const mailson = entries.find((el) =>
      within(el).queryByText("Mailson Junior")
    );
    expect(mailson).toBeDefined();
    expect(
      within(mailson as HTMLElement).getByText(
        "Fundador do Império Moda Atacadista"
      )
    ).toBeInTheDocument();
  });

  it("renders a named-alt placeholder image for each speaker when photoSrc is null (Req 6.6)", () => {
    // eventContent speakers both have photoSrc: null → placeholder path.
    const speakers: [SpeakerContent, SpeakerContent] = [
      { name: "Fabio Edelberg", role: "CEO da Navecon Contabilidade", photoSrc: null },
      {
        name: "Mailson Junior",
        role: "Fundador do Império Moda Atacadista",
        photoSrc: null,
      },
    ];
    render(<SpeakersSection speakers={speakers} />);

    // No real <img> is attempted for unresolved paths; the placeholder exposes
    // an accessible image named after the speaker.
    expect(document.querySelector("img")).toBeNull();
    expect(
      screen.getByRole("img", { name: "Foto de Fabio Edelberg" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Foto de Mailson Junior" })
    ).toBeInTheDocument();
  });
});

describe("Section headings (Req 7.1, 8.1)", () => {
  it("ThemesSection renders the 'Temas abordados' heading", () => {
    render(<ThemesSection themes={[]} />);
    expect(
      screen.getByRole("heading", { name: "Temas abordados" })
    ).toBeInTheDocument();
  });

  it("AudienceSection renders the 'Para quem é' heading", () => {
    render(<AudienceSection audience={[]} />);
    expect(
      screen.getByRole("heading", { name: "Para quem é" })
    ).toBeInTheDocument();
  });
});
