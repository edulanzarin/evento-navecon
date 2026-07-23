/**
 * Entrypoint do `evento-navecon-app`: um servidor Express que serve o SPA já
 * buildado (dist/) e a API em /api. Config vem toda do ambiente.
 *
 * Rotas:
 *   GET  /api/health          — sonda
 *   POST /api/register        — inscrição → cobrança → link de checkout
 *   POST /api/mp/webhook      — notificação do Mercado Pago (conciliação)
 *   GET  /api/payment/status  — estado do pagamento (página de retorno)
 *   *                         — fallback do SPA (index.html)
 */
import express from "express";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { assertAppConfig, config } from "./config";
import { registerRouter } from "./routes/register";
import { webhookRouter } from "./routes/webhook";
import { paymentRouter } from "./routes/payment";
import { startPoller } from "./reconcile";

assertAppConfig();

const app = express();
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});
app.use("/api", registerRouter);
app.use("/api", webhookRouter);
app.use("/api", paymentRouter);

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

app.listen(config.port, () => {
  console.log(`[app] ouvindo em :${config.port} (${config.nodeEnv})`);
  startPoller();
});
