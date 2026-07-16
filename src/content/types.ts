/**
 * Content model types for the Navecon Contabilidade event landing page.
 *
 * All event content flows from a single typed configuration object
 * (see `eventContent.ts`). Sections never hardcode pending/finalized
 * branching in markup; instead, resolvers convert raw content into a
 * discriminated `Resolved<T>` state.
 */

/**
 * A generic resolved content state used by content-driven sections.
 *
 * A section is either showing finalized content or a pending placeholder,
 * never both and never neither — enforced by construction.
 */
export type Resolved<T> =
  | { status: "finalized"; value: T }
  | { status: "pending"; message: string };

/** A single speaker entry. */
export interface SpeakerContent {
  name: string;
  role: string;
  /**
   * Bio copy (optional). "\n\n" separates paragraphs; when a paragraph starts
   * with the speaker's name, the name renders in bold.
   */
  bio?: string;
  /** Key metric chips shown under the role (e.g. "+17 anos de experiência"). */
  highlights?: string[];
  /** "Na imersão" callout copy, rendered in an accented box after the bio. */
  immersion?: string;
  /** Relative asset path, or `null` to render a placeholder image. */
  photoSrc: string | null;
}

/** A single footer contact detail. */
export interface ContactDetail {
  kind: "phone" | "email" | "instagram" | "whatsapp" | "other";
  label: string;
  href?: string;
}

/** A single FAQ question/answer pair. */
export interface FaqItem {
  question: string;
  answer: string;
}

/**
 * The complete event content configuration.
 *
 * Fixed fields are known now; pending-capable fields use `null`/empty
 * values that resolvers convert into a `Pending_Content_State`.
 */
export interface EventContent {
  // Fixed, known-now content
  /** Hero headline, e.g. "Transforme sua empresa física em uma operação…" */
  eventName: string;
  /** e.g. ["Fábio Edelberg", "Mailson Junior"] */
  speakerNames: [string, string];
  /** e.g. "16 e 17 de setembro de 2026" */
  dateLabel: string;
  /** e.g. "Navecon Contabilidade – Unidade Brusque" */
  venueLabel: string;
  /** e.g. "Av. 1º de Maio, 38 – Sala 12 – Centro 2, Brusque – SC, CEP 88353202" */
  fullAddress: string;

  // Pending-capable content (null/empty → pending state)
  /** "HH:MM" when defined, or `null` → "Horário a definir" */
  eventTime: string | null;
  /** Detailed "Sobre o Evento" copy, or `null` → pending placeholder */
  aboutDetail: string | null;
  /** Event themes; `[]` → pending; 1..20 items otherwise */
  themes: string[];
  /** Target audience descriptions; `[]` → pending */
  audience: string[];
  /** Exactly two speaker entries */
  speakers: [SpeakerContent, SpeakerContent];
  /** FAQ items; length < 3 → use placeholder set */
  faq: FaqItem[];
  /** Footer contact details; `[]` → pending */
  contacts: ContactDetail[];

  // Event timing
  /** ISO string with -03:00 offset, e.g. "2026-09-16T00:00:00-03:00" */
  eventStartDatetime: string;
}
