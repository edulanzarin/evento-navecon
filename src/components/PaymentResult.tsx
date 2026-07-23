/**
 * PaymentResult — a página de retorno do checkout do Mercado Pago (back_urls
 * /pagamento/sucesso · /pendente · /erro). Ao montar, força uma conciliação
 * pelo `payment_id` que o MP anexa na volta e mostra o estado real vindo de
 * `GET /api/payment/status`. Se a API não responder, cai no palpite pela rota.
 *
 * É um carregamento de página inteira (o MP redireciona), então não precisa de
 * router — o {@link main} decide entre esta view e a landing pelo pathname.
 */
import { useEffect, useState } from "react";
import { getActivePalette } from "../theme/theme";
import { applyPalette } from "../theme/applyPalette";

type View = "loading" | "paid" | "pending" | "failed";

interface StatusResponse {
  status: string;
  method: string | null;
  installments: number | null;
  amount: string;
}

function mapView(status: string): View {
  if (status === "paid") return "paid";
  if (status === "pending" || status === "in_process") return "pending";
  return "failed";
}

function hintFromPath(pathname: string): View {
  if (pathname.includes("sucesso")) return "paid";
  if (pathname.includes("pendente")) return "pending";
  return "failed";
}

function methodLabel(
  method: string | null,
  installments: number | null,
): string | null {
  if (!method) return null;
  if (method === "pix") return "Pix";
  if (installments && installments > 1) return `Cartão em ${installments}x`;
  return "Cartão à vista";
}

const COPY: Record<Exclude<View, "loading">, { icon: string; title: string; body: string }> = {
  paid: {
    icon: "✓",
    title: "Pagamento confirmado!",
    body: "Sua vaga na imersão está garantida. Enviamos a confirmação para o seu e-mail.",
  },
  pending: {
    icon: "⏳",
    title: "Pagamento em processamento",
    body: "Estamos aguardando a confirmação — o pix pode levar alguns minutos. Assim que cair, você recebe um e-mail.",
  },
  failed: {
    icon: "✕",
    title: "Não foi possível confirmar o pagamento",
    body: "O pagamento não foi concluído. Você pode tentar novamente pela página de inscrição.",
  },
};

export function PaymentResult() {
  const [view, setView] = useState<View>("loading");
  const [detail, setDetail] = useState<{ amount?: string; method?: string | null }>({});

  useEffect(() => {
    applyPalette(getActivePalette());

    const params = new URLSearchParams(window.location.search);
    const paymentId = params.get("payment_id") ?? params.get("collection_id");
    const ref = params.get("external_reference");
    const hint = hintFromPath(window.location.pathname);

    if (!paymentId && !ref) {
      setView(hint);
      return;
    }

    const qs = new URLSearchParams();
    if (paymentId) qs.set("payment_id", paymentId);
    if (ref) qs.set("external_reference", ref);

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/payment/status?${qs.toString()}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as StatusResponse;
        if (cancelled) return;
        setDetail({
          amount: data.amount,
          method: methodLabel(data.method, data.installments),
        });
        setView(mapView(data.status));
      } catch {
        if (!cancelled) setView(hint);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="page">
      <div className="site-bg" aria-hidden="true">
        <span className="site-bg__orb site-bg__orb--1" />
        <span className="site-bg__orb site-bg__orb--2" />
        <div className="site-bg__grid" />
      </div>

      <main className="payment-result">
        <div className="form-card payment-result__card">
          {view === "loading" ? (
            <p className="lead" role="status">
              Confirmando seu pagamento…
            </p>
          ) : (
            <>
              <div
                className={`payment-result__badge payment-result__badge--${view}`}
                aria-hidden="true"
              >
                {COPY[view].icon}
              </div>
              <h1 className="section-title">{COPY[view].title}</h1>
              <p className="lead">{COPY[view].body}</p>

              {view !== "failed" && (detail.amount || detail.method) && (
                <div className="detail-grid payment-result__detail">
                  {detail.amount && (
                    <div>
                      <p className="detail-label">Valor</p>
                      <p className="detail-value">{detail.amount}</p>
                    </div>
                  )}
                  {detail.method && (
                    <div>
                      <p className="detail-label">Forma</p>
                      <p className="detail-value">{detail.method}</p>
                    </div>
                  )}
                </div>
              )}

              <a className="btn btn-primary payment-result__back" href="/">
                Voltar ao site
              </a>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default PaymentResult;
