/**
 * Envio de e-mail via SMTP do Gmail (senha de app). Duas mensagens:
 *  - aviso interno de nova inscrição, para a responsável (NOTIFY_EMAIL);
 *  - confirmação de pagamento, para o inscrito (com cópia para a responsável).
 *
 * Falha de e-mail nunca deve derrubar o fluxo de inscrição/pagamento — os
 * chamadores tratam o erro (best-effort) e seguem.
 */
import nodemailer, { type Transporter } from "nodemailer";
import { config } from "./config";
import { formatBRL, type RegistrationRow } from "./types";

let transporter: Transporter | null = null;

function getTransport(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465, // 465 = SSL; 587 = STARTTLS
      auth: { user: config.smtp.user, pass: config.smtp.pass },
    });
  }
  return transporter;
}

function row(label: string, value: string): string {
  return `<tr><td style="padding:4px 12px 4px 0;color:#64748b">${label}</td><td style="padding:4px 0;font-weight:600">${value}</td></tr>`;
}

/** Aviso interno: uma nova pessoa se inscreveu (pagamento ainda pendente). */
export async function sendNewRegistrationNotice(
  reg: Pick<RegistrationRow, "full_name" | "email" | "phone" | "company" | "amount_cents">,
): Promise<void> {
  const html = `
    <div style="font-family:system-ui,Arial,sans-serif;color:#0f172a">
      <h2 style="margin:0 0 12px">Nova inscrição na imersão</h2>
      <table style="border-collapse:collapse">
        ${row("Nome", reg.full_name)}
        ${row("E-mail", reg.email)}
        ${row("Telefone", reg.phone)}
        ${row("Empresa", reg.company || "—")}
        ${row("Valor", formatBRL(reg.amount_cents))}
        ${row("Pagamento", "Pendente (aguardando checkout)")}
      </table>
      <p style="color:#64748b;margin-top:16px">O status do pagamento atualiza sozinho quando o Mercado Pago confirmar.</p>
    </div>`;
  await getTransport().sendMail({
    from: config.smtp.from,
    to: config.smtp.notify,
    subject: `Nova inscrição — ${reg.full_name}`,
    html,
  });
}

/** Confirmação de pagamento aprovado, para o inscrito (cópia para a responsável). */
export async function sendPaymentConfirmed(
  reg: Pick<
    RegistrationRow,
    "full_name" | "email" | "payment_method" | "installments" | "paid_amount_cents" | "amount_cents"
  >,
): Promise<void> {
  const amount = reg.paid_amount_cents ?? reg.amount_cents;
  const method =
    reg.payment_method === "pix"
      ? "Pix"
      : reg.installments && reg.installments > 1
        ? `Cartão em ${reg.installments}x`
        : "Cartão à vista";
  const html = `
    <div style="font-family:system-ui,Arial,sans-serif;color:#0f172a">
      <h2 style="margin:0 0 12px">Pagamento confirmado 🎉</h2>
      <p>Olá, ${reg.full_name}! Recebemos seu pagamento e sua vaga na imersão está garantida.</p>
      <table style="border-collapse:collapse;margin-top:8px">
        ${row("Valor", formatBRL(amount))}
        ${row("Forma", method)}
      </table>
      <p style="margin-top:16px">Em breve enviaremos os detalhes do evento. Qualquer dúvida, é só responder este e-mail.</p>
      <p style="color:#64748b">Navecon Contabilidade</p>
    </div>`;
  await getTransport().sendMail({
    from: config.smtp.from,
    to: reg.email,
    cc: config.smtp.notify,
    subject: "Pagamento confirmado — Imersão Navecon",
    html,
  });
}
