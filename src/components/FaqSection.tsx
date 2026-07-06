/**
 * FaqSection — the FAQ accordion (task 11.3).
 *
 * Responsibilities:
 * - Render a non-empty heading ("Perguntas frequentes") and a list of at least
 *   three question items, each displaying its question text (Req 12.1).
 * - When fewer than three finalized FAQ items are provided (e.g. the content is
 *   still empty), render a Pending_Content_State set of at least three pt-BR
 *   placeholder items that support the exact same expand/collapse behavior as
 *   finalized items (Req 12.6).
 * - Drive the open/collapsed state with the pure single-open reducer
 *   `faqState.toggle`: every item starts collapsed (Req 12.4); activating a
 *   collapsed item expands it and collapses any other open item (Req 12.2/12.5);
 *   activating the open item collapses it (Req 12.3).
 * - Render each header as an accessible `<button>` carrying `aria-expanded` and
 *   `aria-controls`; the answer panel is a `role="region"` labeled by its
 *   header button and is hidden (via the `hidden` attribute) while collapsed.
 * - Animate expand/collapse with a CSS transition whose duration is ≤500ms
 *   (Req 12.2/12.3).
 *
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6
 */

import { useState } from "react";
import { toggle } from "../logic/faqState";
import type { FaqItem } from "../content/types";

export interface FaqSectionProps {
  /** Finalized FAQ items. Length < 3 → a pending placeholder set is used. */
  faq: FaqItem[];
}

/** Minimum number of question items the section must always display (Req 12.1). */
const MIN_ITEMS = 3;

/**
 * Pending_Content_State placeholder items (pt-BR). Used when fewer than three
 * finalized items are available. Each is distinct and supports the identical
 * expand/collapse behavior of finalized items (Req 12.6).
 */
const PLACEHOLDER_FAQ: FaqItem[] = [
  {
    question: "Como faço a minha inscrição?",
    answer: "Resposta em breve. As informações de inscrição serão divulgadas em breve.",
  },
  {
    question: "Qual é o horário do evento?",
    answer: "Resposta em breve. O horário do evento será confirmado em breve.",
  },
  {
    question: "O que está incluído na imersão?",
    answer: "Resposta em breve. Os detalhes do conteúdo serão divulgados em breve.",
  },
];

/**
 * The FAQ accordion. Renders the heading and a list of accessible, single-open
 * accordion items. See the module docs for the full behavior contract.
 */
export function FaqSection({ faq }: FaqSectionProps) {
  // Use finalized content only when it satisfies the minimum item count;
  // otherwise fall back to the pending placeholder set (Req 12.1/12.6).
  const usePlaceholders = faq.length < MIN_ITEMS;
  const items = usePlaceholders ? PLACEHOLDER_FAQ : faq;

  // Single-open state: index of the open item, or null when all collapsed.
  // Initialized to null so every item is collapsed on first render (Req 12.4).
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="section" aria-labelledby="faq-heading">
      <div className="section-head">
        <span className="eyebrow">Dúvidas frequentes</span>
        <h2 id="faq-heading" className="section-title">
          Perguntas frequentes
        </h2>
      </div>

      <ul
        className="faq-list"
        data-testid="faq-list"
        data-pending={usePlaceholders ? "true" : undefined}
      >
        {items.map((item, index) => {
          const isOpen = openIndex === index;
          const buttonId = `faq-button-${index}`;
          const panelId = `faq-panel-${index}`;

          return (
            <li key={`${index}-${item.question}`} className="faq-item">
              <h3>
                <button
                  type="button"
                  id={buttonId}
                  className="faq-question"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  // Single-open reducer: opening one collapses any other,
                  // re-activating the open one collapses it (Req 12.2/12.3/12.5).
                  onClick={() => setOpenIndex((prev) => toggle(prev, index))}
                >
                  <span>{item.question}</span>
                  <span aria-hidden="true" className="faq-question__icon">
                    +
                  </span>
                </button>
              </h3>

              {/* Answer panel: hidden while collapsed (Req 12.4), revealed when
                  expanded. The CSS transition (≤500ms) animates the reveal. */}
              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                className="faq-panel"
                hidden={!isOpen}
              >
                <p>{item.answer}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default FaqSection;
