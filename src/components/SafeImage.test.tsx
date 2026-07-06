/**
 * Example/edge tests for the `SafeImage` media wrapper.
 *
 * Verifies the graceful-degradation contract from the design (Media wrappers,
 * Error Handling):
 *  - unresolved/empty src → fallback with a visible "mídia indisponível"
 *    indication immediately (Req 14.5);
 *  - an `onError` swaps to the fallback (Req 14.4);
 *  - a load timeout (no load/error fired) swaps to the fallback (Req 14.4);
 *  - the reserved box keeps equal width/height across loading and fallback
 *    states so there is no layout shift (Req 14.3);
 *  - the page stays interactive while the fallback shows (Req 14.4).
 *
 * Requirements: 14.3, 14.4, 14.5
 */
import { describe, it, expect, afterEach, vi } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { SafeImage } from "./SafeImage";
import { MEDIA_UNAVAILABLE_LABEL } from "./media";

const BOX_W = 320;
const BOX_H = 180;

/** The reserved-box wrapper is the <span> that owns the fixed dimensions. */
function getBox(container: HTMLElement): HTMLElement {
  const span = container.querySelector("span");
  if (!span) throw new Error("expected a wrapper <span> reserving the box");
  return span;
}

afterEach(() => {
  vi.useRealTimers();
});

describe("SafeImage", () => {
  it("renders the fallback with visible 'mídia indisponível' text immediately for an unresolved src (Req 14.5)", () => {
    render(<SafeImage src={null} alt="Logo" width={BOX_W} height={BOX_H} />);

    // No <img> is attempted for an unresolved path; the fallback shows at once.
    expect(document.querySelector("img")).toBeNull();
    expect(screen.getByText(MEDIA_UNAVAILABLE_LABEL)).toBeInTheDocument();
    // The fallback exposes an accessible name (the alt) via role="img".
    expect(screen.getByRole("img", { name: "Logo" })).toBeInTheDocument();
  });

  it("treats an empty/whitespace-only src as unresolved and shows the fallback (Req 14.5)", () => {
    render(<SafeImage src="   " alt="Foto" width={BOX_W} height={BOX_H} />);

    expect(document.querySelector("img")).toBeNull();
    expect(screen.getByText(MEDIA_UNAVAILABLE_LABEL)).toBeInTheDocument();
  });

  it("swaps to the fallback when the image fires onError (Req 14.4)", () => {
    render(
      <SafeImage src="/assets/logo/icon-light.png" alt="Logo" width={BOX_W} height={BOX_H} />
    );

    // While loading, the real <img> is present and no fallback yet.
    const img = document.querySelector("img");
    expect(img).not.toBeNull();
    expect(screen.queryByText(MEDIA_UNAVAILABLE_LABEL)).toBeNull();

    fireEvent.error(img as HTMLImageElement);

    // After the error the fallback replaces the image.
    expect(document.querySelector("img")).toBeNull();
    expect(screen.getByRole("img", { name: "Logo" })).toBeInTheDocument();
    expect(screen.getByText(MEDIA_UNAVAILABLE_LABEL)).toBeInTheDocument();
  });

  it("swaps to the fallback after the load timeout when neither load nor error fired (Req 14.4)", () => {
    vi.useFakeTimers();
    render(
      <SafeImage
        src="/assets/video/slow.png"
        alt="Ambiente"
        width={BOX_W}
        height={BOX_H}
        loadTimeoutMs={50}
      />
    );

    // Still loading before the timeout elapses.
    expect(document.querySelector("img")).not.toBeNull();
    expect(screen.queryByText(MEDIA_UNAVAILABLE_LABEL)).toBeNull();

    act(() => {
      vi.advanceTimersByTime(60);
    });

    // Timeout fired with no load/error → fallback.
    expect(document.querySelector("img")).toBeNull();
    expect(screen.getByRole("img", { name: "Ambiente" })).toBeInTheDocument();
    expect(screen.getByText(MEDIA_UNAVAILABLE_LABEL)).toBeInTheDocument();
  });

  it("keeps the reserved box at equal dimensions in the loading and fallback states (Req 14.3)", () => {
    // Loading state box dimensions.
    const loading = render(
      <SafeImage src="/assets/logo/icon-light.png" alt="Logo" width={BOX_W} height={BOX_H} />
    );
    const loadingBox = getBox(loading.container);
    expect(loadingBox.style.width).toBe(`${BOX_W}px`);
    expect(loadingBox.style.height).toBe(`${BOX_H}px`);

    // Fallback state (unresolved src) box dimensions.
    const fallback = render(
      <SafeImage src={null} alt="Logo" width={BOX_W} height={BOX_H} />
    );
    const fallbackBox = getBox(fallback.container);
    expect(fallbackBox.style.width).toBe(`${BOX_W}px`);
    expect(fallbackBox.style.height).toBe(`${BOX_H}px`);

    // Equal dimensions across both states → no layout shift.
    expect(fallbackBox.style.width).toBe(loadingBox.style.width);
    expect(fallbackBox.style.height).toBe(loadingBox.style.height);
  });

  it("keeps a sibling interactive control usable while the fallback shows (Req 14.4)", () => {
    const onClick = vi.fn();
    render(
      <div>
        <SafeImage src={null} alt="Logo" width={BOX_W} height={BOX_H} />
        <button type="button" onClick={onClick}>
          Inscreva-se
        </button>
      </div>
    );

    // Fallback is shown.
    expect(screen.getByText(MEDIA_UNAVAILABLE_LABEL)).toBeInTheDocument();

    // The sibling button is present and still responds to interaction.
    const button = screen.getByRole("button", { name: "Inscreva-se" });
    expect(button).toBeEnabled();
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("renders a custom fallback inside the same reserved box (Req 14.4/14.5)", () => {
    const { container } = render(
      <SafeImage
        src={null}
        alt="Logo"
        width={BOX_W}
        height={BOX_H}
        fallback={<span>Navecon Contabilidade</span>}
      />
    );

    const box = getBox(container);
    expect(box.style.width).toBe(`${BOX_W}px`);
    expect(box.style.height).toBe(`${BOX_H}px`);
    expect(within(box).getByText("Navecon Contabilidade")).toBeInTheDocument();
  });
});
