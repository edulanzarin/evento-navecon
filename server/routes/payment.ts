/**
 * GET /api/payment/status — usado pela página de retorno do checkout. Força uma
 * conciliação na hora (pelo payment_id que o MP anexa na volta, ou pela
 * referência) e devolve o estado atual da inscrição. Não retorna dados pessoais.
 */
import { Router } from "express";
import { query } from "../db";
import { reconcileByPaymentId, reconcileByReference } from "../reconcile";
import { formatBRL, type RegistrationRow } from "../types";

export const paymentRouter = Router();

paymentRouter.get("/payment/status", async (req, res) => {
  const paymentId =
    typeof req.query.payment_id === "string" ? req.query.payment_id : undefined;
  const refFromQuery =
    typeof req.query.external_reference === "string"
      ? req.query.external_reference
      : typeof req.query.ref === "string"
        ? req.query.ref
        : undefined;

  let ref: string | null = refFromQuery ?? null;
  try {
    if (paymentId) ref = (await reconcileByPaymentId(paymentId)) ?? ref;
    else if (ref) await reconcileByReference(ref);
  } catch (err) {
    console.error("[payment/status] conciliação falhou:", err);
  }

  if (!ref) return res.status(400).json({ error: "missing_reference" });

  const { rows } = await query<RegistrationRow>(
    `SELECT * FROM registrations WHERE id = $1`,
    [ref],
  );
  if (rows.length === 0) return res.status(404).json({ error: "not_found" });

  const r = rows[0];
  return res.json({
    status: r.status,
    method: r.payment_method,
    installments: r.installments,
    amount: formatBRL(r.paid_amount_cents ?? r.amount_cents),
  });
});
