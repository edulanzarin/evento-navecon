/**
 * MediaFallback — the default placeholder rendered by `SafeImage` / `SafeVideo`
 * when an asset cannot be shown.
 *
 * It fills its parent box exactly (the wrapper reserves the fixed dimensions),
 * so swapping a failed asset for this placeholder never causes layout shift
 * (Req 14.3/14.4). It exposes an accessible name via `role="img"` + `aria-label`
 * and also renders a visible "mídia indisponível" indication for sighted users
 * (Req 14.5). The remaining page stays fully interactive because the fallback is
 * inert, non-blocking markup (Req 14.4).
 *
 * Colors are driven by CSS custom properties with sensible dark-theme fallbacks,
 * so the placeholder looks correct before and after the theme layer sets the
 * `:root` palette.
 *
 * Requirements: 14.3, 14.4, 14.5
 */
import type { CSSProperties } from "react";
import { MEDIA_UNAVAILABLE_LABEL } from "./media";

export interface MediaFallbackProps {
  /** Visible caption. Defaults to "mídia indisponível". */
  label?: string;
  /**
   * Accessible name for assistive technology (e.g. an image's `alt` text). Falls
   * back to the visible label when not provided.
   */
  ariaLabel?: string;
  /** Optional extra class for styling hooks. */
  className?: string;
}

const fallbackStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  height: "100%",
  boxSizing: "border-box",
  padding: "0.5rem",
  textAlign: "center",
  fontSize: "0.875rem",
  lineHeight: 1.3,
  color: "var(--media-fallback-text, #c2c8cf)",
  background: "var(--media-fallback-bg, #161a20)",
  border: "1px dashed var(--media-fallback-border, #3a414b)",
};

/**
 * Renders the equal-dimension media placeholder with a visible "media
 * unavailable" indication and an accessible name.
 */
export function MediaFallback({ label, ariaLabel, className }: MediaFallbackProps) {
  const visibleText = label ?? MEDIA_UNAVAILABLE_LABEL;
  return (
    <div
      role="img"
      aria-label={ariaLabel ?? visibleText}
      className={className}
      style={fallbackStyle}
    >
      <span aria-hidden="true">{visibleText}</span>
    </div>
  );
}
