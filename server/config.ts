/**
 * Configuração vinda do ambiente (nunca do código). Leitura tolerante: nada
 * lança na importação, para o container de `migrate` (que só precisa do banco)
 * subir sem exigir MP/SMTP. O caminho do app valida o que usa via
 * {@link assertAppConfig}.
 */
import "dotenv/config";

function str(name: string, fallback = ""): string {
  const v = process.env[name];
  return v && v.trim() !== "" ? v.trim() : fallback;
}

function int(name: string, fallback: number): number {
  const n = Number(process.env[name]);
  return Number.isFinite(n) ? n : fallback;
}

const smtpUser = str("SMTP_USER");

export const config = {
  nodeEnv: str("NODE_ENV", "development"),
  port: int("PORT", 3000),
  // URL pública usada nos back_urls e no notification_url do Mercado Pago.
  publicBaseUrl: str("PUBLIC_BASE_URL", `http://localhost:${int("APP_PORT", 4099)}`),

  ticket: {
    priceCents: int("TICKET_PRICE_CENTS", 189900),
    maxInstallments: int("MAX_INSTALLMENTS", 6),
    title: str("TICKET_TITLE", "Imersão Navecon"),
  },

  mp: {
    accessToken: str("MP_ACCESS_TOKEN"),
    publicKey: str("MP_PUBLIC_KEY"),
  },

  smtp: {
    host: str("SMTP_HOST", "smtp.gmail.com"),
    port: int("SMTP_PORT", 465),
    user: smtpUser,
    pass: str("SMTP_PASS"),
    from: str("MAIL_FROM", smtpUser),
    notify: str("NOTIFY_EMAIL", smtpUser),
  },

  pollIntervalMs: int("POLL_INTERVAL_MS", 120_000),
} as const;

/**
 * Falha cedo e claro se o app subir sem os segredos que ele realmente usa
 * (MP e SMTP). Chamada só no boot do servidor — não no migrate.
 */
export function assertAppConfig(): void {
  const missing: string[] = [];
  if (!config.mp.accessToken) missing.push("MP_ACCESS_TOKEN");
  if (!config.smtp.user) missing.push("SMTP_USER");
  if (!config.smtp.pass) missing.push("SMTP_PASS");
  if (missing.length > 0) {
    throw new Error(
      `Variáveis de ambiente obrigatórias ausentes: ${missing.join(", ")}. ` +
        "Preencha o .env (veja .env.example).",
    );
  }
}
