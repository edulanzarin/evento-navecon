/**
 * Webhook do Mercado Pago. Handler fino: extrai o id do pagamento e delega para
 * a mesma função de conciliação que o poller usa. Responde 200 na hora — o MP
 * não deve esperar o processamento.
 */
import { Router } from "express";
import { reconcileByPaymentId } from "../reconcile";

export const webhookRouter = Router();

// O MP às vezes valida a URL com um GET.
webhookRouter.get("/mp/webhook", (_req, res) => res.sendStatus(200));

webhookRouter.post("/mp/webhook", (req, res) => {
  res.sendStatus(200); // responde já; processa em background
  void handle(req.body, req.query);
});

async function handle(
  body: Record<string, unknown> | undefined,
  q: Record<string, unknown>,
): Promise<void> {
  try {
    const type = body?.type ?? body?.topic ?? q.type ?? q.topic;
    const data = body?.data as { id?: unknown } | undefined;
    const id = data?.id ?? q["data.id"] ?? body?.id ?? q.id;
    if (id && String(type).includes("payment")) {
      await reconcileByPaymentId(String(id));
    }
  } catch (err) {
    console.error("[webhook] erro ao processar:", err);
  }
}
