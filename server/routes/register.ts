/**
 * POST /api/register — recebe a inscrição, grava no Postgres (status pending),
 * cria a cobrança no Mercado Pago e devolve o link de checkout. O aviso por
 * e-mail é best-effort (não segura a resposta).
 *
 * Cortesia: se vier um `couponCode` válido (100% de desconto), o pagamento é
 * dispensado — o Mercado Pago não aceita cobrança de R$ 0. A inscrição já nasce
 * 'paid' com method 'cortesia', o cupom é resgatado (uso único) e a resposta
 * aponta direto para a tela de sucesso, sem checkout.
 */
import { Router } from "express";
import { config } from "../config";
import { query } from "../db";
import { normalizeCode, redeemCoupon } from "../coupons";
import { sendNewRegistrationNotice, sendPaymentConfirmed } from "../email";
import { createPreference } from "../mercadopago";
import type { RegistrationRow } from "../types";

export const registerRouter = Router();

interface ParsedRegistration {
  fullName: string;
  email: string;
  phone: string;
  company: string | null;
  couponCode: string | null;
}

type ParseResult =
  | { ok: true; value: ParsedRegistration }
  | { ok: false; errors: Record<string, string> };

function parse(body: unknown): ParseResult {
  const b = (body ?? {}) as Record<string, unknown>;
  const fullName = String(b.fullName ?? "").trim();
  const email = String(b.email ?? "").trim();
  // O frontend envia `phoneDigits` (só dígitos); aceita `phone` também.
  const phone = String(b.phone ?? b.phoneDigits ?? "").trim();
  const company = String(b.company ?? "").trim();
  const couponCode = String(b.couponCode ?? "").trim();

  const errors: Record<string, string> = {};
  if (fullName.length < 2 || fullName.length > 100)
    errors.fullName = "Informe seu nome completo.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)
    errors.email = "E-mail inválido.";
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 11)
    errors.phone = "Telefone inválido.";
  if (company.length > 100) errors.company = "Nome da empresa muito longo.";
  if (couponCode.length > 40) errors.coupon = "Cupom inválido.";

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: {
      fullName,
      email,
      phone,
      company: company || null,
      couponCode: couponCode ? normalizeCode(couponCode) : null,
    },
  };
}

registerRouter.post("/register", async (req, res) => {
  const parsed = parse(req.body);
  if (!parsed.ok) {
    return res.status(400).json({ error: "validation", fields: parsed.errors });
  }
  const { fullName, email, phone, company, couponCode } = parsed.value;

  // ── Caminho de cortesia (cupom 100%) ─────────────────────────────────────
  // Não passa pelo Mercado Pago: cria a inscrição já paga e resgata o cupom de
  // forma atômica. Se o cupom não estiver livre, desfaz a inscrição órfã.
  if (couponCode) {
    let registrationId: string;
    try {
      const { rows } = await query<{ id: string }>(
        `INSERT INTO registrations (full_name, email, phone, company, amount_cents, coupon_code)
         VALUES ($1, $2, $3, $4, 0, $5) RETURNING id`,
        [fullName, email, phone, company, couponCode],
      );
      registrationId = rows[0].id;
    } catch (err) {
      console.error("[register] insert (cortesia) falhou:", err);
      return res.status(500).json({ error: "db" });
    }

    const redeemed = await redeemCoupon(couponCode, registrationId).catch(
      (err) => {
        console.error("[register] resgate de cupom falhou:", err);
        return false;
      },
    );
    if (!redeemed) {
      // Cupom inexistente ou já usado: remove a inscrição recém-criada e avisa.
      await query(`DELETE FROM registrations WHERE id = $1`, [
        registrationId,
      ]).catch(() => {});
      return res.status(400).json({
        error: "validation",
        fields: { coupon: "Cupom inválido ou já utilizado." },
      });
    }

    // Cupom válido: marca a inscrição como paga (cortesia). notified_paid = true
    // porque nós mesmos enviamos a confirmação abaixo — o poller nunca varre
    // cortesias (status 'paid', sem mp_preference_id).
    let reg: RegistrationRow;
    try {
      const { rows } = await query<RegistrationRow>(
        `UPDATE registrations
            SET status = 'paid', payment_method = 'cortesia',
                paid_amount_cents = 0, paid_at = now(),
                notified_paid = true, updated_at = now()
          WHERE id = $1
          RETURNING *`,
        [registrationId],
      );
      reg = rows[0];
    } catch (err) {
      console.error("[register] confirmação de cortesia falhou:", err);
      return res.status(500).json({ error: "db" });
    }

    // Best-effort: confirmação para o inscrito (cópia para a equipe).
    sendPaymentConfirmed(reg).catch((err) =>
      console.error("[register] e-mail de cortesia falhou:", err),
    );

    return res.json({
      registrationId,
      checkoutUrl: `${config.publicBaseUrl}/pagamento/sucesso?external_reference=${registrationId}`,
    });
  }

  // ── Caminho normal (pagamento pelo Mercado Pago) ─────────────────────────
  const amountCents = config.ticket.priceCents;

  let registrationId: string;
  try {
    const { rows } = await query<{ id: string }>(
      `INSERT INTO registrations (full_name, email, phone, company, amount_cents)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [fullName, email, phone, company, amountCents],
    );
    registrationId = rows[0].id;
  } catch (err) {
    console.error("[register] insert falhou:", err);
    return res.status(500).json({ error: "db" });
  }

  try {
    const pref = await createPreference({
      registrationId,
      title: config.ticket.title,
      amountCents,
      maxInstallments: config.ticket.maxInstallments,
      payer: { name: fullName, email },
    });
    await query(
      `UPDATE registrations SET mp_preference_id = $2, updated_at = now() WHERE id = $1`,
      [registrationId, pref.id],
    );

    // Best-effort: avisar a responsável não pode travar o checkout.
    sendNewRegistrationNotice({
      full_name: fullName,
      email,
      phone,
      company,
      amount_cents: amountCents,
    }).catch((err) => console.error("[register] aviso por e-mail falhou:", err));

    return res.json({ registrationId, checkoutUrl: pref.initPoint });
  } catch (err) {
    console.error("[register] preferência do Mercado Pago falhou:", err);
    return res.status(502).json({ error: "payment_init_failed", registrationId });
  }
});
