/**
 * POST /api/register — recebe a inscrição, grava no Postgres (status pending),
 * cria a cobrança no Mercado Pago e devolve o link de checkout. O aviso por
 * e-mail é best-effort (não segura a resposta).
 */
import { Router } from "express";
import { config } from "../config";
import { query } from "../db";
import { sendNewRegistrationNotice } from "../email";
import { createPreference } from "../mercadopago";

export const registerRouter = Router();

interface ParsedRegistration {
  fullName: string;
  email: string;
  phone: string;
  company: string | null;
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

  const errors: Record<string, string> = {};
  if (fullName.length < 2 || fullName.length > 100)
    errors.fullName = "Informe seu nome completo.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)
    errors.email = "E-mail inválido.";
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 11)
    errors.phone = "Telefone inválido.";
  if (company.length > 100) errors.company = "Nome da empresa muito longo.";

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, value: { fullName, email, phone, company: company || null } };
}

registerRouter.post("/register", async (req, res) => {
  const parsed = parse(req.body);
  if (!parsed.ok) {
    return res.status(400).json({ error: "validation", fields: parsed.errors });
  }
  const { fullName, email, phone, company } = parsed.value;
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
