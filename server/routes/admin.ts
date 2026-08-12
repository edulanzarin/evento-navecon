/**
 * Painel /admin — server-rendered, protegido por sessão (ver ./admin/auth).
 * Montado em `/admin`, então os caminhos aqui são relativos a ele.
 *
 *   GET  /admin/login                         tela de login
 *   POST /admin/login                         valida credenciais → cookie
 *   POST /admin/logout                        encerra a sessão
 *   GET  /admin                               dashboard (filtro por status + busca)
 *   GET  /admin/export.csv                    exporta a lista filtrada
 *   POST /admin/registrations/:id/mark-paid   confirma pagamento manualmente
 *   POST /admin/registrations/:id/resend-link recria a cobrança e reenvia o link
 *
 * Sem ADMIN_USER/ADMIN_PASSWORD o painel inteiro responde 404.
 */
import { Router } from "express";
import { config, isAdminEnabled } from "../config";
import { query } from "../db";
import { sendPaymentConfirmed, sendPaymentLink } from "../email";
import { createPreference } from "../mercadopago";
import { formatBRL, type RegistrationRow } from "../types";
import {
  checkCredentials,
  clearSessionCookie,
  isAuthenticated,
  issueToken,
  requireAdmin,
  setSessionCookie,
} from "../admin/auth";
import {
  dashboardPage,
  loginPage,
  methodLabel,
  type Summary,
} from "../admin/html";

export const adminRouter = Router();

// Painel desligado quando não há credenciais: nem existe.
adminRouter.use((_req, res, next) => {
  if (!isAdminEnabled()) {
    res.status(404).send("Painel não configurado.");
    return;
  }
  next();
});

// ── Autenticação ───────────────────────────────────────────────────────────
adminRouter.get("/login", (req, res) => {
  if (isAuthenticated(req)) return res.redirect("/admin");
  res.type("html").send(loginPage());
});

adminRouter.post("/login", (req, res) => {
  const user = String(req.body?.user ?? "");
  const password = String(req.body?.password ?? "");
  if (!checkCredentials(user, password)) {
    return res.status(401).type("html").send(loginPage("Usuário ou senha inválidos."));
  }
  setSessionCookie(res, issueToken());
  res.redirect("/admin");
});

adminRouter.post("/logout", (_req, res) => {
  clearSessionCookie(res);
  res.redirect("/admin/login");
});

// Tudo abaixo exige sessão.
adminRouter.use(requireAdmin);

// ── Mensagens de flash (código → texto, para não confiar em texto da URL) ────
const FLASH: Record<string, { msg?: string; err?: string }> = {
  marked: { msg: "Inscrição marcada como paga." },
  resent: { msg: "Link de pagamento reenviado por e-mail." },
  already_paid: { err: "Essa inscrição já estava paga." },
  not_found: { err: "Inscrição não encontrada." },
  no_link: { err: "Não é possível gerar link de pagamento para esta inscrição." },
  action: { err: "Não foi possível concluir a ação. Tente novamente." },
};

const ALLOWED_STATUS = new Set([
  "paid",
  "pending",
  "in_process",
  "rejected",
  "cancelled",
  "refunded",
]);

/** Lê e sanitiza os filtros da query string. */
function parseFilter(req: import("express").Request): { status: string; q: string } {
  const rawStatus = typeof req.query.status === "string" ? req.query.status : "";
  const status = ALLOWED_STATUS.has(rawStatus) ? rawStatus : "";
  const q = (typeof req.query.q === "string" ? req.query.q : "").slice(0, 100).trim();
  return { status, q };
}

async function loadRows(filter: {
  status: string;
  q: string;
}): Promise<RegistrationRow[]> {
  const { rows } = await query<RegistrationRow>(
    `SELECT * FROM registrations
      WHERE ($1 = '' OR status = $1)
        AND ($2 = '' OR full_name ILIKE '%' || $2 || '%' OR email ILIKE '%' || $2 || '%')
      ORDER BY created_at DESC
      LIMIT 1000`,
    [filter.status, filter.q],
  );
  return rows;
}

async function loadSummary(): Promise<Summary> {
  const { rows } = await query<{
    total: number;
    paid: number;
    pending: number;
    courtesy: number;
    revenue_cents: number;
  }>(
    `SELECT
       count(*)::int AS total,
       count(*) FILTER (WHERE status = 'paid')::int AS paid,
       count(*) FILTER (WHERE status IN ('pending','in_process'))::int AS pending,
       count(*) FILTER (WHERE coupon_code IS NOT NULL)::int AS courtesy,
       COALESCE(sum(paid_amount_cents) FILTER (WHERE status = 'paid'), 0)::int AS revenue_cents
     FROM registrations`,
  );
  const r = rows[0];
  return {
    total: r.total,
    paid: r.paid,
    pending: r.pending,
    courtesy: r.courtesy,
    revenueCents: r.revenue_cents,
  };
}

// ── Dashboard ────────────────────────────────────────────────────────────────
adminRouter.get("/", async (req, res) => {
  const filter = parseFilter(req);
  const flashKey = typeof req.query.flash === "string" ? req.query.flash : "";
  try {
    const [rows, summary] = await Promise.all([loadRows(filter), loadSummary()]);
    res
      .type("html")
      .send(dashboardPage({ rows, summary, filter, flash: FLASH[flashKey] }));
  } catch (err) {
    console.error("[admin] dashboard falhou:", err);
    res.status(500).send("Erro ao carregar o painel.");
  }
});

// ── Exportar CSV ─────────────────────────────────────────────────────────────
function csvCell(value: unknown): string {
  const s = String(value ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

adminRouter.get("/export.csv", async (req, res) => {
  const filter = parseFilter(req);
  try {
    const rows = await loadRows(filter);
    const header = [
      "data",
      "nome",
      "email",
      "telefone",
      "empresa",
      "status",
      "forma",
      "valor",
      "cupom",
    ];
    const lines = rows.map((r) =>
      [
        r.created_at,
        r.full_name,
        r.email,
        r.phone,
        r.company ?? "",
        r.status,
        methodLabel(r.payment_method, r.installments),
        formatBRL(r.paid_amount_cents ?? r.amount_cents),
        r.coupon_code ?? "",
      ]
        .map(csvCell)
        .join(","),
    );
    const csv = "﻿" + [header.join(","), ...lines].join("\r\n"); // BOM p/ Excel
    res
      .type("text/csv; charset=utf-8")
      .set("Content-Disposition", 'attachment; filename="inscricoes.csv"')
      .send(csv);
  } catch (err) {
    console.error("[admin] export falhou:", err);
    res.status(500).send("Erro ao exportar.");
  }
});

// ── Ação: marcar pago manualmente ────────────────────────────────────────────
adminRouter.post("/registrations/:id/mark-paid", async (req, res) => {
  const id = req.params.id;
  try {
    const { rows } = await query<RegistrationRow>(
      `UPDATE registrations
          SET status = 'paid', payment_method = 'manual',
              paid_amount_cents = COALESCE(paid_amount_cents, amount_cents),
              paid_at = COALESCE(paid_at, now()),
              notified_paid = true, updated_at = now()
        WHERE id = $1 AND status <> 'paid'
        RETURNING *`,
      [id],
    );
    if (rows.length === 0) {
      // Já paga, ou id inexistente — distingue com uma checagem barata.
      const exists = await query(`SELECT 1 FROM registrations WHERE id = $1`, [id]);
      return res.redirect(
        `/admin?flash=${exists.rows.length ? "already_paid" : "not_found"}`,
      );
    }
    sendPaymentConfirmed(rows[0]).catch((e) =>
      console.error("[admin] e-mail de confirmação manual falhou:", e),
    );
    res.redirect("/admin?flash=marked");
  } catch (err) {
    console.error("[admin] mark-paid falhou:", err);
    res.redirect("/admin?flash=action");
  }
});

// ── Ação: reenviar link de pagamento ─────────────────────────────────────────
adminRouter.post("/registrations/:id/resend-link", async (req, res) => {
  const id = req.params.id;
  try {
    const { rows } = await query<RegistrationRow>(
      `SELECT * FROM registrations WHERE id = $1`,
      [id],
    );
    if (rows.length === 0) return res.redirect("/admin?flash=not_found");
    const reg = rows[0];
    if (reg.status === "paid") return res.redirect("/admin?flash=already_paid");
    if (reg.amount_cents <= 0) return res.redirect("/admin?flash=no_link");

    const pref = await createPreference({
      registrationId: reg.id,
      title: config.ticket.title,
      amountCents: reg.amount_cents,
      maxInstallments: config.ticket.maxInstallments,
      payer: { name: reg.full_name, email: reg.email },
    });
    await query(
      `UPDATE registrations SET mp_preference_id = $2, updated_at = now() WHERE id = $1`,
      [reg.id, pref.id],
    );
    await sendPaymentLink(reg, pref.initPoint);
    res.redirect("/admin?flash=resent");
  } catch (err) {
    console.error("[admin] resend-link falhou:", err);
    res.redirect("/admin?flash=action");
  }
});

// Rota /admin desconhecida não deve cair no fallback do SPA.
adminRouter.use((_req, res) => res.status(404).send("Não encontrado."));
