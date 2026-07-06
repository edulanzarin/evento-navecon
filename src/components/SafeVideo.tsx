/**
 * SafeVideo — a `<video>` wrapper that degrades gracefully.
 *
 * Analogous to `SafeImage`: it reserves a fixed box (from `width`/`height`) up
 * front so a slow or failed load causes no layout shift (Req 14.3). It renders
 * the video while loading and starts a load timeout; if the video neither
 * becomes playable (`onLoadedData`) nor errors within `loadTimeoutMs`
 * (default 10s), or fires an `onError`, the wrapper swaps to an equal-dimension
 * fallback that keeps the page interactive (Req 14.4). When `src` is null/empty
 * (an unresolved path), it renders the fallback with a visible "mídia
 * indisponível" indication immediately (Req 14.5).
 *
 * Standard video props (`muted`, `loop`, `autoPlay`, `controls`, `playsInline`,
 * `poster`, …) are passed through. Consumers can pass a custom `fallback` node
 * to override the default placeholder while keeping the same reserved box.
 *
 * Requirements: 14.3, 14.4, 14.5
 */
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type VideoHTMLAttributes,
} from "react";
import {
  hasResolvableSrc,
  MEDIA_LOAD_TIMEOUT_MS,
  toCssSize,
  type Dimension,
  type MediaStatus,
} from "./media";
import { MediaFallback } from "./MediaFallback";

export interface SafeVideoProps
  extends Omit<
    VideoHTMLAttributes<HTMLVideoElement>,
    "src" | "width" | "height"
  > {
  /** Video source path, or `null`/empty for an unresolved path → fallback. */
  src: string | null | undefined;
  /** Reserved box width (number → px, or any CSS length). */
  width: Dimension;
  /** Reserved box height (number → px, or any CSS length). */
  height: Dimension;
  /** Accessible name for the fallback placeholder (defaults to the visible label). */
  ariaLabel?: string;
  /** Visible caption for the default fallback (defaults to "mídia indisponível"). */
  fallbackLabel?: string;
  /** Custom fallback content that replaces the default placeholder. */
  fallback?: ReactNode;
  /** Override the load timeout (ms). Mainly for testing. */
  loadTimeoutMs?: number;
}

/**
 * Video with layout-stable fixed box, error/timeout fallback, and unresolved-path
 * handling. See module docs for the full behavior contract.
 */
export function SafeVideo({
  src,
  width,
  height,
  ariaLabel,
  fallbackLabel,
  fallback,
  loadTimeoutMs = MEDIA_LOAD_TIMEOUT_MS,
  style,
  ...videoProps
}: SafeVideoProps) {
  const resolvable = hasResolvableSrc(src);
  const [status, setStatus] = useState<MediaStatus>(
    resolvable ? "loading" : "failed"
  );
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const clearTimer = () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    if (!resolvable) {
      setStatus("failed");
      return clearTimer;
    }

    // (Re)start the load lifecycle whenever the source changes.
    setStatus("loading");
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      // Only fail if still loading — a completed load/error already won.
      setStatus((prev) => (prev === "loading" ? "failed" : prev));
    }, loadTimeoutMs);

    return clearTimer;
  }, [src, resolvable, loadTimeoutMs]);

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleLoadedData = () => {
    clearTimer();
    setStatus("loaded");
  };

  const handleError = () => {
    clearTimer();
    setStatus("failed");
  };

  const boxStyle: CSSProperties = {
    display: "inline-block",
    position: "relative",
    width: toCssSize(width),
    height: toCssSize(height),
    overflow: "hidden",
    ...style,
  };

  const videoStyle: CSSProperties = {
    display: "block",
    width: "100%",
    height: "100%",
    objectFit: "cover",
  };

  return (
    <span style={boxStyle}>
      {status === "failed" ? (
        fallback ?? (
          <MediaFallback label={fallbackLabel} ariaLabel={ariaLabel} />
        )
      ) : (
        <video
          {...videoProps}
          src={src as string}
          style={videoStyle}
          onLoadedData={handleLoadedData}
          onError={handleError}
        />
      )}
    </span>
  );
}
