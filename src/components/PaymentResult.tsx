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
import { eventContent } from "../content/eventContent";

type View = "loading" | "paid" | "pending" | "failed";

interface StatusResponse {
  status: string;
  method: string | null;
  installments: number | null;
  amount: string | null;
  courtesy?: boolean;
  name?: string | null;
  locator?: string | null;
}

interface TicketDetail {
  amount?: string | null;
  method?: string | null;
  courtesy?: boolean;
  name?: string | null;
  locator?: string | null;
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
  if (method === "cortesia") return "Cortesia (convite)";
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
  const [detail, setDetail] = useState<TicketDetail>({});

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
          courtesy: data.courtesy,
          name: data.name,
          locator: data.locator,
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
              <h1 className="section-title">
                {view === "paid" && detail.courtesy
                  ? "Vaga garantida!"
                  : COPY[view].title}
              </h1>
              <p className="lead">
                {view === "paid" && detail.courtesy
                  ? "Sua vaga na imersão está garantida como cortesia. Enviamos a confirmação para o seu e-mail."
                  : COPY[view].body}
              </p>

              {/* Ingresso digital — o "algo bonito com o nome" pra quem pagou
                  ou entrou por cortesia. */}
              {view === "paid" && (
                <div className="ticket" role="group" aria-label="Ingresso da imersão">
                  <div className="ticket__head">
                    <span className="ticket__brand">Imersão Navecon</span>
                    <span
                      className={`ticket__badge${detail.courtesy ? " ticket__badge--courtesy" : ""}`}
                    >
                      {detail.courtesy ? "Cortesia" : "Confirmado"}
                    </span>
                  </div>
                  <div className="ticket__body">
                    <p className="ticket__label">Participante</p>
                    <p className="ticket__name">{detail.name ?? "—"}</p>
                    <div className="ticket__meta">
                      <div>
                        <p className="ticket__meta-label">Data</p>
                        <p className="ticket__meta-value">
                          {eventContent.dateLabel}
                        </p>
                      </div>
                      <div>
                        <p className="ticket__meta-label">Local</p>
                        <p className="ticket__meta-value">
                          {eventContent.venueLabel}
                        </p>
                      </div>
                      {!detail.courtesy && detail.amount && (
                        <div>
                          <p className="ticket__meta-label">Valor</p>
                          <p className="ticket__meta-value">{detail.amount}</p>
                        </div>
                      )}
                      {detail.method && (
                        <div>
                          <p className="ticket__meta-label">Forma</p>
                          <p className="ticket__meta-value">{detail.method}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  {detail.locator && (
                    <div className="ticket__stub">
                      <span className="ticket__locator-label">Localizador</span>
                      <span className="ticket__locator">{detail.locator}</span>
                    </div>
                  )}
                </div>
              )}

              {view === "pending" && (detail.amount || detail.method) && (
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
