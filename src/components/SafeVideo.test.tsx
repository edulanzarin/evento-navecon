/**
 * Example/edge tests for the `SafeVideo` media wrapper.
 *
 * Mirrors the `SafeImage` tests for the video element, verifying the
 * graceful-degradation contract (Media wrappers, Error Handling):
 *  - unresolved/empty src → fallback with a visible "mídia indisponível"
 *    indication immediately (Req 14.5);
 *  - an `onError` swaps to the fallback (Req 14.4);
 *  - a load timeout (no `onLoadedData`/error fired) swaps to the fallback
 *    (Req 14.4);
 *  - the reserved box keeps equal width/height across loading and fallback
 *    states so there is no layout shift (Req 14.3);
 *  - the page stays interactive while the fallback shows (Req 14.4).
 *
 * Requirements: 14.3, 14.4, 14.5
 */
import { describe, it, expect, afterEach, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { SafeVideo } from "./SafeVideo";
import { MEDIA_UNAVAILABLE_LABEL } from "./media";

const BOX_W = 640;
const BOX_H = 360;

/** The reserved-box wrapper is the <span> that owns the fixed dimensions. */
function getBox(container: HTMLElement): HTMLElement {
  const span = container.querySelector("span");
  if (!span) throw new Error("expected a wrapper <span> reserving the box");
  return span;
}

afterEach(() => {
  vi.useRealTimers();
});

describe("SafeVideo", () => {
  it("renders the fallback with visible 'mídia indisponível' text immediately for an unresolved src (Req 14.5)", () => {
    render(
      <SafeVideo src={null} ariaLabel="Vídeo do evento" width={BOX_W} height={BOX_H} />
    );

    expect(document.querySelector("video")).toBeNull();
    expect(screen.getByText(MEDIA_UNAVAILABLE_LABEL)).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Vídeo do evento" })).toBeInTheDocument();
  });

  it("treats an empty/whitespace-only src as unresolved and shows the fallback (Req 14.5)", () => {
    render(<SafeVideo src="  " width={BOX_W} height={BOX_H} />);

    expect(document.querySelector("video")).toBeNull();
    expect(screen.getByText(MEDIA_UNAVAILABLE_LABEL)).toBeInTheDocument();
  });

  it("swaps to the fallback when the video fires onError (Req 14.4)", () => {
    render(
      <SafeVideo
        src="/assets/video/evento.mp4"
        ariaLabel="Vídeo do evento"
        width={BOX_W}
        height={BOX_H}
      />
    );

    const video = document.querySelector("video");
    expect(video).not.toBeNull();
    expect(screen.queryByText(MEDIA_UNAVAILABLE_LABEL)).toBeNull();

    fireEvent.error(video as HTMLVideoElement);

    expect(document.querySelector("video")).toBeNull();
    expect(screen.getByRole("img", { name: "Vídeo do evento" })).toBeInTheDocument();
    expect(screen.getByText(MEDIA_UNAVAILABLE_LABEL)).toBeInTheDocument();
  });

  it("swaps to the fallback after the load timeout when neither loadeddata nor error fired (Req 14.4)", () => {
    vi.useFakeTimers();
    render(
      <SafeVideo
        src="/assets/video/slow.mp4"
        ariaLabel="Vídeo do evento"
        width={BOX_W}
        height={BOX_H}
        loadTimeoutMs={50}
      />
    );

    expect(document.querySelector("video")).not.toBeNull();
    expect(screen.queryByText(MEDIA_UNAVAILABLE_LABEL)).toBeNull();

    act(() => {
      vi.advanceTimersByTime(60);
    });

    expect(document.querySelector("video")).toBeNull();
    expect(screen.getByRole("img", { name: "Vídeo do evento" })).toBeInTheDocument();
    expect(screen.getByText(MEDIA_UNAVAILABLE_LABEL)).toBeInTheDocument();
  });

  it("does NOT show the fallback when the video becomes playable before the timeout (Req 14.4)", () => {
    vi.useFakeTimers();
    render(
      <SafeVideo
        src="/assets/video/evento.mp4"
        ariaLabel="Vídeo do evento"
        width={BOX_W}
        height={BOX_H}
        loadTimeoutMs={50}
      />
    );

    const video = document.querySelector("video");
    expect(video).not.toBeNull();

    // The video becomes playable, then time advances past the would-be timeout.
    act(() => {
      fireEvent.loadedData(video as HTMLVideoElement);
      vi.advanceTimersByTime(100);
    });

    expect(document.querySelector("video")).not.toBeNull();
    expect(screen.queryByText(MEDIA_UNAVAILABLE_LABEL)).toBeNull();
  });

  it("keeps the reserved box at equal dimensions in the loading and fallback states (Req 14.3)", () => {
    const loading = render(
      <SafeVideo
        src="/assets/video/evento.mp4"
        ariaLabel="Vídeo do evento"
        width={BOX_W}
        height={BOX_H}
      />
    );
    const loadingBox = getBox(loading.container);
    expect(loadingBox.style.width).toBe(`${BOX_W}px`);
    expect(loadingBox.style.height).toBe(`${BOX_H}px`);

    const fallback = render(
      <SafeVideo src={null} ariaLabel="Vídeo do evento" width={BOX_W} height={BOX_H} />
    );
    const fallbackBox = getBox(fallback.container);
    expect(fallbackBox.style.width).toBe(`${BOX_W}px`);
    expect(fallbackBox.style.height).toBe(`${BOX_H}px`);

    expect(fallbackBox.style.width).toBe(loadingBox.style.width);
    expect(fallbackBox.style.height).toBe(loadingBox.style.height);
  });

  it("keeps a sibling interactive control usable while the fallback shows (Req 14.4)", () => {
    const onClick = vi.fn();
    render(
      <div>
        <SafeVideo src={null} ariaLabel="Vídeo do evento" width={BOX_W} height={BOX_H} />
        <button type="button" onClick={onClick}>
          Inscreva-se
        </button>
      </div>
    );

    expect(screen.getByText(MEDIA_UNAVAILABLE_LABEL)).toBeInTheDocument();

    const button = screen.getByRole("button", { name: "Inscreva-se" });
    expect(button).toBeEnabled();
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
