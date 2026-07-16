/**
 * ThemesSection — "Temas abordados" (task 10.3).
 *
 * Responsibilities:
 * - Render the section heading "Temas abordados" (Req 7.1).
 * - Resolve the themes list via {@link resolveList}: when one or more themes are
 *   defined, render each theme as a distinct visible item (an `<li>` in a
 *   `<ul>`) in the same order they were declared (Req 7.2/7.3). The resolver
 *   caps display at the first 20 items, so 1–20 themes are supported.
 * - When no themes are defined (empty list), render a visible pt-BR pending
 *   placeholder instead (Req 7.4).
 * - Render EXACTLY ONE of the list or the pending placeholder — never both —
 *   guaranteed by construction via the `Resolved<T>` discriminated union.
 * - The list container carries the `.grid-multi` class so the layout is
 *   single-column on mobile and multi-column above 768px (Req 2.2).
 *
 * Requirements: 7.1, 7.2, 7.3, 7.4, 2.2
 */

import { PENDING_MESSAGES, resolveList } from "../content/resolvers";

export interface ThemesSectionProps {
  /** Event themes. Empty → pending placeholder; 1–20 items render as list. */
  themes: string[];
}

/**
 * The "Temas abordados" section. Renders the heading, then either the list of
 * themes (multi-column above 768px) or the pending placeholder.
 */
export function ThemesSection({ themes }: ThemesSectionProps) {
  const resolved = resolveList(themes, PENDING_MESSAGES.themes);

  return (
    <section id="themes" className="section" aria-labelledby="themes-heading">
      <div className="section-head">
        <span className="eyebrow">O que você vai aprender</span>
        <h2 id="themes-heading" className="section-title">
          Temas abordados
        </h2>
        <p className="lead">
          Conteúdo intensivo distribuído ao longo dos dois dias de imersão.
        </p>
      </div>

      {/* Exactly one of the themes list or the pending placeholder (Req 7.2–7.4). */}
      {resolved.status === "finalized" ? (
        <ul className="grid-multi numbered-list" data-testid="themes-list">
          {resolved.value.map((theme, index) => (
            <li key={`${index}-${theme}`} className="numbered-item">
              {theme}
            </li>
          ))}
        </ul>
      ) : (
        <p className="pending" data-testid="themes-pending" role="status">
          {resolved.message}
        </p>
      )}
    </section>
  );
}

export default ThemesSection;
