/**
 * AboutSection — the "Sobre o Evento" section.
 *
 * - Renders the heading "Sobre o Evento" (Req 5.1) and a fixed event-format
 *   summary that always shows (Req 5.2).
 * - Resolves the detailed copy via {@link resolveText}: renders EXACTLY ONE of
 *   the finalized detail or the pending placeholder, never both (Req 5.3–5.5).
 * - Optionally renders a side video (e.g. footage from a previous edition)
 *   beside the copy on wider screens, for extra context.
 *
 * Styling uses the design-system classes in src/index.css (no inline styles).
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

import { PENDING_MESSAGES, resolveText } from "../content/resolvers";
import { VideoPlayer } from "./VideoPlayer";

export interface AboutSectionProps {
  /** Detailed "Sobre o Evento" copy, or `null` → pending placeholder. */
  aboutDetail: string | null;
  /** Optional side video path (vertical) shown beside the copy. */
  sideVideo?: string;
}

/**
 * Fixed event-format summary (Req 5.2). Always renders regardless of whether
 * the detailed copy is finalized or pending.
 */
const FORMAT_SUMMARY =
  "Imersão presencial de dois dias, realizada em 16 e 17 de setembro de 2026, " +
  "na Navecon Contabilidade – Unidade Brusque.";

export function AboutSection({ aboutDetail, sideVideo }: AboutSectionProps) {
  const detail = resolveText(aboutDetail, PENDING_MESSAGES.about);

  const copy = (
    <div>
      <div className="section-head">
        <span className="eyebrow">Sobre o evento</span>
        <h2 id="about-heading" className="section-title">
          Sobre o Evento
        </h2>
      </div>

      {/* Fixed format summary — always shown (Req 5.2). */}
      <p className="lead">{FORMAT_SUMMARY}</p>

      {/* Exactly one of finalized detail or pending placeholder (Req 5.3–5.5). */}
      {detail.status === "finalized" ? (
        <p data-testid="about-detail">{detail.value}</p>
      ) : (
        <p className="pending" data-testid="about-pending" role="status">
          {detail.message}
        </p>
      )}
    </div>
  );

  return (
    <section id="about" className="section" aria-labelledby="about-heading">
      {sideVideo ? (
        <div className="about-grid">
          {copy}
          <VideoPlayer
            src={sideVideo}
            frameClass="video-frame--portrait about__video"
            label="edição anterior"
          />
        </div>
      ) : (
        copy
      )}
    </section>
  );
}

export default AboutSection;
