-- 003_coupons_multiuse — o cupom de cortesia deixa de ser código aleatório de uso
-- único e passa a ser código escolhido no painel com N usos.
--
-- O código continua sendo a PK (ex.: NAVECON100). O limite vira um contador
-- `uses < max_uses`, incrementado de forma atômica no resgate. "Quem usou" não
-- mora mais aqui: vem de registrations.coupon_code (uma linha por resgate).

ALTER TABLE coupons
    ADD COLUMN IF NOT EXISTS max_uses integer NOT NULL DEFAULT 1  CHECK (max_uses >= 1),
    ADD COLUMN IF NOT EXISTS uses     integer NOT NULL DEFAULT 0  CHECK (uses >= 0),
    ADD COLUMN IF NOT EXISTS active   boolean NOT NULL DEFAULT true;

-- Colunas do modelo de uso único, agora obsoletas: o vínculo é
-- registrations.coupon_code e o resgate é o contador `uses`.
ALTER TABLE coupons DROP COLUMN IF EXISTS redeemed_by;
ALTER TABLE coupons DROP COLUMN IF EXISTS redeemed_at;
