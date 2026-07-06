/**
 * FAQ accordion state — single-open reducer.
 *
 * The state is the index of the currently open item, or `null` when all items
 * are collapsed. The initial state is `null` (all collapsed).
 *
 * This module is pure and framework-free (no React/DOM imports) so it can be
 * unit- and property-tested in isolation.
 */

/**
 * Single-open reducer for the FAQ accordion.
 *
 * Activating an item:
 * - If the activated item is already open (`state === index`) it collapses,
 *   returning `null` (no item open).
 * - Otherwise the activated item opens, collapsing any other open item, by
 *   returning `index`.
 *
 * This guarantees at most one item is open at any time.
 *
 * @param state The index of the currently open item, or `null` if all collapsed.
 * @param index The index of the item being activated.
 * @returns The next state: `null` (all collapsed) or the index of the open item.
 */
export function toggle(state: number | null, index: number): number | null {
  return state === index ? null : index;
}
