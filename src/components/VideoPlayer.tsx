/**
 * VideoPlayer — a minimal, on-brand video player.
 *
 * - No native controls: only a custom play/pause button (and click-to-toggle
 *   on the video itself).
 * - Auto-pauses when the video scrolls out of the viewport (IntersectionObserver),
 *   and stays paused until the visitor plays it again.
 * - The big play button shows while paused; while playing it fades out and
 *   reveals a pause control on hover/focus.
 *
 * Styling comes from the design-system classes in src/index.css. The outer
 * `.video-frame` (+ optional `frameClass`) provides the framed box; this
 * component adds the overlay button layer.
 */

import { useEffect, useRef, useState, type CSSProperties } from "react";

export interface VideoPlayerProps {
  /** Video source path. */
  src: string;
  /** Extra class for the frame (e.g. "video-frame--wide" / "--portrait"). */
  frameClass?: string;
  /** Optional inline style for the frame. */
  style?: CSSProperties;
  /** Accessible label describing the video. */
  label?: string;
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
      <path d="M8 5.5v13l11-6.5z" fill="currentColor" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
      <path d="M7 5h3.2v14H7zM13.8 5H17v14h-3.2z" fill="currentColor" />
    </svg>
  );
}

export function VideoPlayer({
  src,
  frameClass = "",
  style,
  label = "Vídeo",
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      void v.play();
    } else {
      v.pause();
    }
  };

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);

    // Pause automatically when the video leaves the viewport.
    let observer: IntersectionObserver | undefined;
    if (typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting && !v.paused) {
              v.pause();
            }
          }
        },
        { threshold: 0.35 }
      );
      observer.observe(v);
    }

    return () => {
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      observer?.disconnect();
    };
  }, []);

  return (
    <div className={`video-frame video-player ${frameClass}`} style={style}>
      <video
        ref={videoRef}
        src={src}
        playsInline
        preload="metadata"
        onClick={toggle}
        data-playing={playing ? "true" : "false"}
      />
      <button
        type="button"
        className="video-player__btn"
        data-playing={playing ? "true" : "false"}
        onClick={toggle}
        aria-label={playing ? `Pausar ${label}` : `Reproduzir ${label}`}
      >
        <span className="video-player__icon">
          {playing ? <PauseIcon /> : <PlayIcon />}
        </span>
      </button>
    </div>
  );
}

export default VideoPlayer;
