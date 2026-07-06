/**
 * Example/interaction tests for the HeroSection (task 9.4).
 *
 * These verify the hero's fixed content and pending-time behavior:
 *  - The event name renders as the main <h1> (Req 3.1).
 *  - Both speaker names, dates, and venue render (Req 3.1–3.4).
 *  - The event time shows "HH:MM" when defined (Req 3.5) and the pending label
 *    "Horário a definir" when null (Req 3.6).
 *  - The primary RegistrationCta is present within the hero with its shared
 *    pt-BR label (Req 3.8 presence).
 *
 * These are example tests (NOT property-based) — no fast-check.
 *
 * Requirements: 3.1, 3.5, 3.6, 3.8
 */
import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { HeroSection } from "./HeroSection";
import { CTA_LABEL } from "./RegistrationCta";

/** Build the refs every HeroSection render needs. */
function makeRefs() {
  const formRef = React.createRef<HTMLElement>();
  const firstInputRef = React.createRef<HTMLInputElement>();
  return { formRef, firstInputRef };
}

const SPEAKERS: [string, string] = ["Fabio Edelberg", "Mailson Junior"];
const DATE_LABEL = "16 e 17 de setembro de 2026";
const VENUE_LABEL = "Navecon Contabilidade – Unidade Brusque";
const EVENT_NAME = "Imersão Presencial com Mailson Junior e Fabio Edelberg";

describe("HeroSection content (Req 3.1–3.4)", () => {
  it("renders the event name as the main <h1>", () => {
    const { formRef, firstInputRef } = makeRefs();
    render(
      <HeroSection
        eventName={EVENT_NAME}
        speakerNames={SPEAKERS}
        dateLabel={DATE_LABEL}
        venueLabel={VENUE_LABEL}
        eventTime={null}
        formRef={formRef}
        firstInputRef={firstInputRef}
      />
    );

    const heading = screen.getByRole("heading", { level: 1, name: EVENT_NAME });
    expect(heading).toBeInTheDocument();
  });

  it("renders both speaker names, the dates, and the venue", () => {
    const { formRef, firstInputRef } = makeRefs();
    render(
      <HeroSection
        eventName={EVENT_NAME}
        speakerNames={SPEAKERS}
        dateLabel={DATE_LABEL}
        venueLabel={VENUE_LABEL}
        eventTime={null}
        formRef={formRef}
        firstInputRef={firstInputRef}
      />
    );

    const speakers = screen.getByTestId("hero-speakers");
    expect(speakers).toHaveTextContent("Fabio Edelberg");
    expect(speakers).toHaveTextContent("Mailson Junior");

    expect(screen.getByTestId("hero-dates")).toHaveTextContent(DATE_LABEL);
    expect(screen.getByTestId("hero-venue")).toHaveTextContent(VENUE_LABEL);
  });
});

describe("HeroSection event time (Req 3.5, 3.6)", () => {
  it("shows the configured time when eventTime is defined (Req 3.5)", () => {
    const { formRef, firstInputRef } = makeRefs();
    render(
      <HeroSection
        eventName={EVENT_NAME}
        speakerNames={SPEAKERS}
        dateLabel={DATE_LABEL}
        venueLabel={VENUE_LABEL}
        eventTime="09:00"
        formRef={formRef}
        firstInputRef={firstInputRef}
      />
    );

    const time = screen.getByTestId("hero-time");
    expect(time).toHaveTextContent("09:00");
    expect(time).not.toHaveTextContent("Horário a definir");
  });

  it("shows the pending label when eventTime is null (Req 3.6)", () => {
    const { formRef, firstInputRef } = makeRefs();
    render(
      <HeroSection
        eventName={EVENT_NAME}
        speakerNames={SPEAKERS}
        dateLabel={DATE_LABEL}
        venueLabel={VENUE_LABEL}
        eventTime={null}
        formRef={formRef}
        firstInputRef={firstInputRef}
      />
    );

    expect(screen.getByTestId("hero-time")).toHaveTextContent(
      "Horário a definir"
    );
  });
});

describe("HeroSection registration CTA (Req 3.8 presence)", () => {
  it("renders the primary RegistrationCta with the shared label inside the hero", () => {
    const { formRef, firstInputRef } = makeRefs();
    render(
      <HeroSection
        eventName={EVENT_NAME}
        speakerNames={SPEAKERS}
        dateLabel={DATE_LABEL}
        venueLabel={VENUE_LABEL}
        eventTime={null}
        formRef={formRef}
        firstInputRef={firstInputRef}
      />
    );

    const hero = document.getElementById("hero") as HTMLElement;
    expect(hero).not.toBeNull();

    const cta = within(hero).getByRole("button", { name: CTA_LABEL });
    expect(cta).toBeInTheDocument();
  });
});
