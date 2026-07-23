/**
 * Tests for the PaymentResult return page. It reconciles via the status API on
 * mount and reflects the real payment state, falling back to the path hint when
 * the API is unreachable.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PaymentResult } from "./PaymentResult";

function setLocation(url: string): void {
  window.history.pushState({}, "", url);
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  window.history.pushState({}, "", "/");
});

describe("PaymentResult", () => {
  it("shows an approved result with amount and method from the status API", async () => {
    setLocation("/pagamento/sucesso?payment_id=123&external_reference=abc");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: "paid",
        method: "pix",
        installments: null,
        amount: "R$ 1.899,00",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<PaymentResult />);

    expect(
      await screen.findByText("Pagamento confirmado!"),
    ).toBeInTheDocument();
    expect(screen.getByText("R$ 1.899,00")).toBeInTheDocument();
    expect(screen.getByText("Pix")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain("payment_id=123");
  });

  it("falls back to the path hint when the status API fails", async () => {
    setLocation("/pagamento/pendente?payment_id=999");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500 }),
    );

    render(<PaymentResult />);

    expect(
      await screen.findByText("Pagamento em processamento"),
    ).toBeInTheDocument();
  });

  it("uses the path hint without calling the API when there are no identifiers", async () => {
    setLocation("/pagamento/erro");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(<PaymentResult />);

    expect(
      await screen.findByText("Não foi possível confirmar o pagamento"),
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
