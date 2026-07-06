/**
 * Content resolvers — convert raw content into a discriminated
 * `Resolved<T>` state (finalized vs. pending).
 *
 * These resolvers centralize the pending-vs-finalized decision so behavior is
 * uniform across content-driven sections (About, Themes, Audience, Footer
 * contacts, Hero event time). A section is either showing finalized content or
 * a pending placeholder — never both and never neither — enforced by
 * construction via the `Resolved<T>` discriminated union.
 *
 * This module is pure and framework-free (no React/DOM imports) so it can be
 * unit- and property-tested in isolation.
 */

import type { Resolved } from "./types";

/**
 * Centralized pt-BR pending placeholder messages for each content-driven
 * section.
 */
export const PENDING_MESSAGES = {
  about: "Descrição detalhada em breve.",
  themes: "Temas em breve.",
  audience: "Conteúdo em breve.",
  contacts: "Informações de contato em breve.",
  eventTime: "Horário a definir",
} as const;

/**
 * Maximum number of theme items displayed. Themes are display-capped so that a
 * collection with more than 20 items renders only the first 20.
 */
export const MAX_DISPLAY_ITEMS = 20;

/**
 * Resolve a text value into a finalized-or-pending state.
 *
 * A string is considered "present" only when it is non-null and not
 * whitespace-only. When present, the original (untrimmed) value is returned in
 * the `finalized` state. When absent (null, or whitespace-only), the `pending`
 * state is returned with the supplied placeholder message.
 *
 * @param value The raw text value, or `null` when not provided.
 * @param pendingMsg The pt-BR placeholder message to use when absent.
 * @returns A `Resolved<string>`: exactly one of `finalized` or `pending`.
 */
export function resolveText(
  value: string | null,
  pendingMsg: string
): Resolved<string> {
  if (value !== null && value.trim() !== "") {
    return { status: "finalized", value };
  }
  return { status: "pending", message: pendingMsg };
}

/**
 * Resolve a list of items into a finalized-or-pending state.
 *
 * A list is considered "present" only when it has at least one element. When
 * present, the returned value array is display-capped to the first
 * {@link MAX_DISPLAY_ITEMS} items (so themes with more than 20 items render
 * only the first 20). When empty, the `pending` state is returned with the
 * supplied placeholder message.
 *
 * @param items The raw list of items.
 * @param pendingMsg The pt-BR placeholder message to use when empty.
 * @returns A `Resolved<string[]>`: exactly one of `finalized` or `pending`.
 */
export function resolveList(
  items: string[],
  pendingMsg: string
): Resolved<string[]> {
  if (items.length >= 1) {
    return { status: "finalized", value: items.slice(0, MAX_DISPLAY_ITEMS) };
  }
  return { status: "pending", message: pendingMsg };
}
