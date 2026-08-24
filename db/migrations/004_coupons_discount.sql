-- 004_coupons_discount — o cupom deixa de ser só cortesia e passa a carregar a
-- porcentagem de desconto.
--
-- `discount_percent` é a fonte da verdade do desconto: 100 é a cortesia de
-- sempre (não passa pelo Mercado Pago, inscrição já nasce paga); 1–99 abate o
-- valor do ingresso e o restante segue pelo checkout normal. Os cupons que já
-- existiam eram todos cortesia, então o DEFAULT 100 os mantém como estavam.

ALTER TABLE coupons
    ADD COLUMN IF NOT EXISTS discount_percent smallint NOT NULL DEFAULT 100
        CHECK (discount_percent BETWEEN 1 AND 100);
