/**
 * Conciliação de pagamento — a lição de [[Polling substitui webhook quando não
 * há IP público]] aplicada ao Mercado Pago: o trabalho vive numa função
 * idempotente e ganha dois gatilhos.
 *
 *   - reconcileByPaymentId(id)   → webhook e retorno do checkout (instantâneo)
 *   - reconcileByReference(id)   → poller por cron (funciona sem IP público;
 *                                   essencial pro pix, pago depois)
 *
 * `applyPayment` é idempotente: guarda o e-mail de confirmação pelo estado
 * final (`notified_paid`), nunca pelo evento, então os dois gatilhos podem
 * chegar na mesma inscrição sem reenviar e-mail nem rebaixar um 'paid'.
 */
import { config } from "./config";
import { query } from "./db";
import { sendPaymentConfirmed } from "./email";
import {
  getPayment,
  searchPaymentsByReference,
  type MpPayment,
} from "./mercadopago";
import type { RegistrationRow } from "./types";

/** Mapeia o status do Mercado Pago para o nosso vocabulário. */
function mapStatus(mp: string): string {
  switch (mp) {
    case "approved":
      return "paid";
    case "authorized":
    case "in_process":
      return "in_process";
    case "pending":
      return "pending";
    case "rejected":
      return "rejected";
    case "cancelled":
      return "cancelled";
    case "refunded":
    case "charged_back":
      return "refunded";
    default:
      return "pending";
  }
}

/**
 * Aplica um pagamento do MP na inscrição correspondente (external_reference).
 * Idempotente. Devolve o id da inscrição tocada (ou null se não achou).
 */
async function applyPayment(payment: MpPayment): Promise<string | null> {
  const ref = payment.external_reference;
  if (!ref) return null;

  const status = mapStatus(payment.status);
  const method = payment.payment_method_id ?? payment.payment_type_id ?? null;
  const installments = payment.installments ?? null;
  const paidAmountCents =
    payment.transaction_amount != null
      ? Math.round(payment.transaction_amount * 100)
      : null;
  const paidAt = status === "paid" ? new Date() : null;

  // Nunca rebaixa um 'paid' (a não ser estorno/cancelamento); paid_at é sticky.
  const { rows } = await query<RegistrationRow>(
    `UPDATE registrations
        SET status = CASE
              WHEN status = 'paid' AND $2 NOT IN ('refunded','cancelled') THEN 'paid'
              ELSE $2 END,
            mp_payment_id     = $3,
            payment_method    = COALESCE($4, payment_method),
            installments      = COALESCE($5, installments),
            paid_amount_cents = COALESCE($6, paid_amount_cents),
            paid_at           = COALESCE(paid_at, $7),
            updated_at        = now()
      WHERE id = $1
      RETURNING *`,
    [ref, status, String(payment.id), method, installments, paidAmountCents, paidAt],
  );
  if (rows.length === 0) return null;

  const reg = rows[0];
  // E-mail de confirmação só quando vira 'paid' e ainda não foi enviado. A
  // marcação acontece ANTES do envio (claim atômico) para não duplicar.
  if (reg.status === "paid" && !reg.notified_paid) {
    const claim = await query<{ id: string }>(
      `UPDATE registrations SET notified_paid = true
        WHERE id = $1 AND notified_paid = false
        RETURNING id`,
      [ref],
    );
    if (claim.rows.length > 0) {
      try {
        await sendPaymentConfirmed(reg);
      } catch (err) {
        console.error("[reconcile] e-mail de confirmação falhou:", err);
      }
    }
  }
  return ref;
}

/** Gatilho instantâneo: temos o id do pagamento (webhook / retorno do checkout). */
export async function reconcileByPaymentId(
  paymentId: string,
): Promise<string | null> {
  const payment = await getPayment(paymentId);
  return applyPayment(payment);
}

/** Gatilho por varredura: só temos a inscrição; procura o pagamento no MP. */
export async function reconcileByReference(
  registrationId: string,
): Promise<string | null> {
  const payments = await searchPaymentsByReference(registrationId);
  if (payments.length === 0) return null;
  // Prefere o aprovado; senão o mais recente (a busca já vem desc por data).
  const chosen = payments.find((p) => p.status === "approved") ?? payments[0];
  return applyPayment(chosen);
}

/**
 * Poller: a cada intervalo, varre as inscrições ainda em aberto e concilia.
 * Filtra pelo conjunto pendente (pequeno) e ignora inscrições antigas.
 */
export function startPoller(): void {
  const tick = async (): Promise<void> => {
    try {
      const { rows } = await query<{ id: string }>(
        `SELECT id FROM registrations
          WHERE status IN ('pending','in_process')
            AND mp_preference_id IS NOT NULL
            AND created_at > now() - interval '30 days'`,
      );
      for (const r of rows) {
        try {
          await reconcileByReference(r.id);
        } catch (err) {
          console.error("[poll] conciliação falhou para", r.id, err);
        }
      }
    } catch (err) {
      console.error("[poll] erro na varredura:", err);
    }
  };

  setInterval(tick, config.pollIntervalMs);
  setTimeout(tick, 10_000); // primeira passada logo após o boot
  console.log(`[poll] ativo a cada ${config.pollIntervalMs}ms`);
}
