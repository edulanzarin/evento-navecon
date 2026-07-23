/**
 * Entrypoint do `evento-navecon-app`: um servidor Express que serve o SPA já
 * buildado (dist/) e a API em /api. Config vem toda do ambiente.
 *
 * Endurecido para produção (o site vai pro ar num domínio):
 *   - helmet (security headers + CSP calibrada pro SPA e pro mapa MapLibre);
 *   - rate limiting (mais rígido no /api/register, que cria linha + cobrança);
 *   - trust proxy (atrás do reverse proxy que termina TLS);
 *   - sem X-Powered-By; handler de erro global sem vazar stack.
 *
 * Rotas:
 *   GET  /api/health          — sonda
 *   POST /api/register        — inscrição → cobrança → link de checkout
 *   POST /api/mp/webhook      — notificação do Mercado Pago (conciliação)
 *   GET  /api/payment/status  — estado do pagamento (página de retorno)
 *   *                         — fallback do SPA (index.html)
 */
import express, { type NextFunction, type Request, type Response } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { assertAppConfig, config } from "./config";
import { registerRouter } from "./routes/register";
import { webhookRouter } from "./routes/webhook";
import { paymentRouter } from "./routes/payment";
import { startPoller } from "./reconcile";

assertAppConfig();

const isProd = config.nodeEnv === "production";
const app = express();

// Atrás de um reverse proxy (Caddy/Nginx) que termina TLS: confia no 1º hop
// para o IP real (rate limit) e para o esquema https.
app.set("trust proxy", 1);
app.disable("x-powered-by");

// Security headers + CSP. A CSP libera o que o MapLibre precisa (tiles do
// OpenFreeMap, workers em blob:, estilos inline do React). upgrade-insecure só
// em produção (em http local ele quebraria os assets).
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        "script-src": ["'self'"],
        "style-src": ["'self'", "'unsafe-inline'"],
        "img-src": ["'self'", "data:", "blob:", "https://*.openfreemap.org"],
        "connect-src": ["'self'", "https://*.openfreemap.org"],
        "worker-src": ["'self'", "blob:"],
        "font-src": ["'self'", "data:"],
        "media-src": ["'self'"],
        "object-src": ["'none'"],
        "base-uri": ["'self'"],
        "form-action": ["'self'"],
        "frame-ancestors": ["'self'"],
        "upgrade-insecure-requests": isProd ? [] : null,
      },
    },
    // HSTS só faz sentido sob HTTPS; o browser ignora em http local.
    hsts: isProd,
    crossOriginEmbedderPolicy: false, // não embutimos recursos cross-origin isolados
  }),
);

app.use(express.json({ limit: "64kb" }));
app.use(express.urlencoded({ extended: true, limit: "64kb" }));

// Rate limits (por IP). O webhook do MP fica de fora (pode vir em rajada, e o
// handler já revalida tudo no MP). draft-7 = headers RateLimit padronizados.
const registerLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 15,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "rate_limited" },
});
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "rate_limited" },
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});
app.use("/api/register", registerLimiter);
app.use("/api/payment", apiLimiter);
app.use("/api", registerRouter);
app.use("/api", webhookRouter);
app.use("/api", paymentRouter);

// 404 JSON para rotas de API desconhecidas (não cai no fallback do SPA).
app.use("/api", (_req, res) => res.status(404).json({ error: "not_found" }));

// SPA estático + fallback para rotas de cliente (tudo que não começa com /api/).
const distDir = join(dirname(fileURLToPath(import.meta.url)), "..", "dist");
app.use(
  express.static(distDir, {
    setHeaders(res, filePath) {
      if (filePath.endsWith("index.html")) {
        res.setHeader("Cache-Control", "no-cache");
      }
    },
  }),
);
app.get(/^\/(?!api\/).*/, (_req, res) => {
  res.sendFile(join(distDir, "index.html"));
});

// Handler de erro global: loga o detalhe, devolve genérico (sem vazar stack).
app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
  console.error("[error]", err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: "internal" });
});

app.listen(config.port, () => {
  console.log(`[app] ouvindo em :${config.port} (${config.nodeEnv})`);
  startPoller();
});
