-- 002_coupons — cupons de cortesia (100% de desconto) para convidados.
--
-- Cada cupom é de USO ÚNICO: uma linha por código, resgatada no máximo uma vez.
-- O resgate é um UPDATE atômico condicionado a `redeemed_at IS NULL`, então dois
-- pedidos simultâneos com o mesmo código nunca liberam duas vagas — só um vence.
--
-- Cupom de cortesia NÃO passa pelo Mercado Pago (o MP não aceita cobrança de
-- R$ 0). A inscrição correspondente é marcada direto como 'paid' com
-- payment_method = 'cortesia'. `registrations.coupon_code` guarda qual código
-- foi usado, para auditoria.

CREATE TABLE IF NOT EXISTS coupons (
    code         text PRIMARY KEY,   -- normalizado em MAIÚSCULAS (ex.: NAVE-7K2Q)
    note         text,               -- para quem / observação livre
    redeemed_by  uuid REFERENCES registrations (id),
    redeemed_at  timestamptz,
    created_at   timestamptz NOT NULL DEFAULT now()
);

-- Auditoria: qual cupom liberou esta inscrição (NULL para inscrições pagas).
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS coupon_code text;
