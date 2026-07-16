/**
 * AudienceSection — the "Para quem é" section (task 10.4).
 *
 * Responsibilities:
 * - Render the section heading "Para quem é" (Req 8.1).
 * - Resolve the audience list via {@link resolveList}: when at least one
 *   audience description is provided, render each description as a distinct
 *   visible item (Req 8.2) inside a `.grid-multi` container so the layout is
 *   single-column on mobile and multi-column above 768px (Req 2.2). When no
 *   descriptions are provided, render a visible pt-BR pending placeholder
 *   (Req 8.3).
 * - Render EXACTLY ONE of the two — when pending, no audience items are shown
 *   (Req 8.4). The `Resolved<T>` discriminated union guarantees mutual
 *   exclusivity by construction.
 *
 * Requirements: 8.1, 8.2, 8.3, 8.4, 2.2
 */

import { PENDING_MESSAGES, resolveList } from "../content/resolvers";

export interface AudienceSectionProps {
  /** Target audience descriptions; empty → pending placeholder. */
  audience: string[];
}

/**
 * "Para quem é" section. Renders the heading, then either the finalized
 * audience items (multi-column above 768px) or the pending placeholder — never
 * both.
 */
export function AudienceSection({ audience }: AudienceSectionProps) {
  const resolved = resolveList(audience, PENDING_MESSAGES.audience);

  return (
    <section id="audience" className="section" aria-labelledby="audience-heading">
      <div className="section-head">
        <span className="eyebrow">Para quem é indicado</span>
        <h2 id="audience-heading" className="section-title">
          Para quem é
        </h2>
        <p className="lead">
          Feito para quem decide e quer crescer nos marketplaces com segurança
          e lucratividade.
        </p>
      </div>

      {/* Exactly one of finalized items or pending placeholder (Req 8.2–8.4). */}
      {resolved.status === "finalized" ? (
        <ul className="grid-multi" data-testid="audience-list">
          {resolved.value.map((description, index) => (
            <li key={`${index}-${description}`} className="list-card">
              {description}
            </li>
          ))}
        </ul>
      ) : (
        <p className="pending" data-testid="audience-pending" role="status">
          {resolved.message}
        </p>
      )}
    </section>
  );
}

export default AudienceSection;
