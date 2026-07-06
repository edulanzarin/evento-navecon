/**
 * Shared helpers and constants for the media wrappers (`SafeImage`, `SafeVideo`).
 *
 * Both wrappers reserve a fixed box up front (to prevent layout shift) and swap
 * to an equal-dimension fallback on load error or load timeout, keeping the rest
 * of the page interactive.
 *
 * Requirements: 14.3, 14.4, 14.5
 */

/** A CSS box dimension: a pixel number (e.g. `320`) or any CSS length (`"20rem"`, `"100%"`). */
export type Dimension = number | string;

/**
 * Maximum time to wait for a media asset to load before treating it as failed
 * and showing the equal-dimension fallback (Req 14.4).
 */
export const MEDIA_LOAD_TIMEOUT_MS = 10_000;

/**
 * Visible text shown when a media asset is unavailable — used both for an
 * unresolved/empty path (Req 14.5) and as the default fallback caption on a
 * load error or timeout (Req 14.4).
 */
export const MEDIA_UNAVAILABLE_LABEL = "mídia indisponível";

/** The lifecycle status of a media asset within a wrapper. */
export type MediaStatus = "loading" | "loaded" | "failed";

/**
 * Normalizes a {@link Dimension} into a CSS size string. Numbers are treated as
 * pixels; strings are passed through verbatim.
 */
export function toCssSize(value: Dimension): string {
  return typeof value === "number" ? `${value}px` : value;
}

/**
 * Returns whether a `src` value resolves to a usable, non-empty path. An empty
 * or whitespace-only string (or `null`/`undefined`) is treated as an unresolved
 * path that should render the "media unavailable" fallback (Req 14.5).
 */
export function hasResolvableSrc(src: string | null | undefined): src is string {
  return typeof src === "string" && src.trim().length > 0;
}
