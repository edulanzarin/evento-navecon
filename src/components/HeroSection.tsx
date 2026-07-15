/**
 * HeroSection — the top banner of the landing page.
 *
 * - Event name as the main `<h1>` (Req 3.1); speaker names (Req 3.2); dates
 *   (Req 3.3); venue/city (Req 3.4).
 * - Event time as "HH:MM" when defined, else "Horário a definir" (Req 3.5/3.6),
 *   resolved via {@link resolveText}.
 * - The primary {@link RegistrationCta} sits above the fold (Req 3.7/3.8); the
 *   hero uses a tall min-height so it is within the initial viewport.
 * - A countdown and a glass info card group the key event facts.
 * - Text wraps fluidly so nothing truncates at 320–1920px (Req 3.10).
 *
 * The accessible name of the `<h1>` equals `eventName` exactly (decorative
 * spans add no extra text), satisfying the heading-name assertion.
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.10
 */

import type { RefObject } from "react";
import { PENDING_MESSAGES, resolveText } from "../content/resolvers";
import { ASSETS } from "../content/assets";
import { RegistrationCta } from "./RegistrationCta";
import { CountdownTimer } from "./CountdownTimer";

export interface HeroSectionProps {
  eventName: string;
  speakerNames: [string, string];
  dateLabel: string;
  venueLabel: string;
  eventTime: string | null;
  formRef: RefObject<HTMLElement | null>;
  firstInputRef: RefObject<HTMLInputElement | null>;
}

/** Extracts up to two day numbers, the month word, and the year from a label. */
function parseDate(dateLabel: string): {
  days: string[];
  month: string;
  year: string;
} {
  const days = (dateLabel.match(/\b\d{1,2}\b/g) ?? []).slice(0, 2);
  const month = (dateLabel.match(/de\s+([A-Za-zÀ-ú]+)/) ?? [])[1] ?? "";
  const year = (dateLabel.match(/\b\d{4}\b/) ?? [])[0] ?? "";
  return { days, month: month.toUpperCase(), year };
}

export function HeroSection({
  eventName,
  speakerNames,
  dateLabel,
  venueLabel,
  eventTime,
  formRef,
  firstInputRef,
}: HeroSectionProps) {
  const time = resolveText(eventTime, PENDING_MESSAGES.eventTime);
  const timeText = time.status === "finalized" ? time.value : time.message;
  const { days, month, year } = parseDate(dateLabel);

  return (
    <section id="hero" className="hero" aria-label="Destaque do evento">
      {/* Decorative ambient background: looping muted video (cover). */}
      <div className="hero__bg" aria-hidden="true">
        <video
          className="hero__bg-video"
          src={ASSETS.video.background}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        />
      </div>
      <div className="hero__beams" aria-hidden="true" />

      <div className="container">
        <div className="hero__grid">
        {/* Left column — headline + CTA + countdown. */}
        <div>
          <span className="eyebrow">Imersão presencial · Navecon</span>

          {/* h1 text content equals eventName exactly. */}
          <h1 className="hero__title">{eventName}</h1>

          <p className="hero__speakers" data-testid="hero-speakers">
            Com <span className="with">{speakerNames[0]}</span> e{" "}
            <span className="with">{speakerNames[1]}</span>
          </p>

          <p className="hero__lead">
            Dois dias de imersão prática com estratégias de operação, gestão,
            vendas e inteligência tributária para empresários que querem
            crescer com segurança e lucratividade.
          </p>

          <p className="hero__proof">Vagas limitadas · turma fechada</p>

          <div className="hero__actions">
            <RegistrationCta
              className="btn btn-primary"
              formRef={formRef}
              firstInputRef={firstInputRef}
            />
            <a className="btn btn-ghost" href="#speakers">
              Conhecer os palestrantes
            </a>
          </div>

          <div className="countdown">
            <CountdownTimer />
          </div>
        </div>

        {/* Right column — glass info card. */}
        <aside className="info-card" aria-label="Informações do evento">
          <span className="info-card__badge">Inscrições abertas</span>

          <div className="info-card__dates">
            {days.length === 2 ? (
              <>
                <span className="info-card__day">{days[0]}</span>
                <span className="info-card__day">{days[1]}</span>
                <span className="info-card__month">
                  {month}
                  <strong>{year}</strong>
                </span>
              </>
            ) : (
              <span className="info-card__month">
                <strong>{dateLabel}</strong>
              </span>
            )}
          </div>

          <p className="sr-only" data-testid="hero-dates">
            {dateLabel}
          </p>
          <p className="info-card__dateline" aria-hidden="true">
            {dateLabel}
          </p>

          <div className="info-card__rows">
            <div className="info-row">
              <span className="info-row__icon" aria-hidden="true">
                ◎
              </span>
              <div>
                <div className="info-row__label">Local</div>
                <div className="info-row__value" data-testid="hero-venue">
                  {venueLabel}
                  <small>Brusque · SC</small>
                </div>
              </div>
            </div>

            <div className="info-row">
              <span className="info-row__icon" aria-hidden="true">
                ◷
              </span>
              <div>
                <div className="info-row__label">Horário</div>
                <div className="info-row__value" data-testid="hero-time">
                  {timeText}
                </div>
              </div>
            </div>

            <div className="info-row">
              <span className="info-row__icon" aria-hidden="true">
                ▣
              </span>
              <div>
                <div className="info-row__label">Formato</div>
                <div className="info-row__value">
                  2 dias imersivos
                  <small>100% presencial · turma fechada</small>
                </div>
              </div>
            </div>
          </div>

          <p className="info-card__note">Vagas limitadas · turma fechada</p>
        </aside>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
