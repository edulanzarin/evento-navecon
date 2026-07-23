/**
 * Cliente do Mercado Pago (Checkout Pro). O access token é secreto e vive só
 * aqui, no servidor. Toda chamada externa tem timeout e erro tratado.
 *
 * - createPreference: cria a cobrança e devolve o link de checkout (init_point).
 * - getPayment / searchPaymentsByReference: usados pela conciliação (webhook e
 *   poller) para descobrir o estado real do pagamento.
 */
import { config } from "./config";

const MP_API = "https://api.mercadopago.com";
const TIMEOUT_MS = 15_000;

/** True quando a URL pública é acessível de fora (habilita auto_return/webhook). */
const isPublicUrl =
  /^https:\/\//i.test(config.publicBaseUrl) &&
  !/localhost|127\.0\.0\.1/.test(config.publicBaseUrl);

async function mpFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${MP_API}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${config.mp.accessToken}`,
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
    const text = await res.text();
    const data = text ? JSON.parse(text) : {};
    if (!res.ok) {
      throw new Error(
        `Mercado Pago ${path} → HTTP ${res.status}: ${text.slice(0, 300)}`,
      );
    }
    return data as T;
  } finally {
    clearTimeout(timer);
  }
}

export interface PreferenceInput {
  registrationId: string;
  title: string;
  amountCents: number;
  maxInstallments: number;
  payer: { name: string; email: string };
}

export interface MpPayment {
  id: number;
  status: string; // approved | pending | in_process | rejected | cancelled | refunded | charged_back
  status_detail?: string;
  external_reference: string | null;
  payment_type_id: string | null; // credit_card | debit_card | account_money | bank_transfer (pix)
  payment_method_id: string | null; // visa | master | pix | ...
  installments: number | null;
  transaction_amount: number | null;
}

/** Cria a preferência e devolve o id + a URL do checkout. */
export async function createPreference(
  input: PreferenceInput,
): Promise<{ id: string; initPoint: string }> {
  const body: Record<string, unknown> = {
    items: [
      {
        id: "ingresso-imersao",
        title: input.title,
        quantity: 1,
        currency_id: "BRL",
        unit_price: input.amountCents / 100,
      },
    ],
    payer: { name: input.payer.name, email: input.payer.email },
    payment_methods: {
      // Até N parcelas no cartão; boleto fora (evento com prazo curto). Pix fica
      // habilitado (depende de estar ativo na conta do Mercado Pago).
      installments: input.maxInstallments,
      excluded_payment_types: [{ id: "ticket" }],
    },
    external_reference: input.registrationId,
    metadata: { registration_id: input.registrationId },
    statement_descriptor: "NAVECON",
    back_urls: {
      success: `${config.publicBaseUrl}/pagamento/sucesso`,
      pending: `${config.publicBaseUrl}/pagamento/pendente`,
      failure: `${config.publicBaseUrl}/pagamento/erro`,
    },
  };

  // auto_return e notification_url exigem URL pública (o MP rejeita localhost no
  // auto_return e nunca alcança um host privado). Sem elas, o poller concilia.
  if (isPublicUrl) {
    body.auto_return = "approved";
    body.notification_url = `${config.publicBaseUrl}/api/mp/webhook`;
  }

  const data = await mpFetch<{ id: string; init_point: string }>(
    "/checkout/preferences",
    { method: "POST", body: JSON.stringify(body) },
  );
  return { id: data.id, initPoint: data.init_point };
}

/** Busca um pagamento pelo id (usado pelo webhook e pelo retorno do checkout). */
export function getPayment(paymentId: string): Promise<MpPayment> {
  return mpFetch<MpPayment>(`/v1/payments/${encodeURIComponent(paymentId)}`);
}

/** Lista pagamentos por external_reference (usado pelo poller). */
export async function searchPaymentsByReference(
  reference: string,
): Promise<MpPayment[]> {
  const data = await mpFetch<{ results: MpPayment[] }>(
    `/v1/payments/search?sort=date_created&criteria=desc&external_reference=${encodeURIComponent(reference)}`,
  );
  return data.results ?? [];
}
