-- 001_init — inscrições do evento + rastreio de pagamento (Mercado Pago).
--
-- Uma linha por inscrição. O pagamento é conciliado de forma idempotente
-- (webhook e/ou poller) para dentro desta mesma linha: status, método, nº de
-- parcelas e valor pago. `notified_paid` evita reenvio do e-mail de confirmação.

CREATE TABLE IF NOT EXISTS registrations (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name         text NOT NULL,
    email             text NOT NULL,
    phone             text NOT NULL,
    company           text,
    amount_cents      integer NOT NULL,

    -- Espelha os status do Mercado Pago (mais 'pending' inicial).
    status            text NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending','in_process','paid','rejected','cancelled','refunded')),

    mp_preference_id  text,
    mp_payment_id     text,
    payment_method    text,      -- credit_card | pix | ...
    installments      integer,
    paid_amount_cents integer,
    paid_at           timestamptz,

    -- Guarda de idempotência do e-mail de confirmação (não do estado do pagamento).
    notified_paid     boolean NOT NULL DEFAULT false,

    created_at        timestamptz NOT NULL DEFAULT now(),
    updated_at        timestamptz NOT NULL DEFAULT now()
);

-- O poller varre só o conjunto pendente; índice mantém isso barato.
CREATE INDEX IF NOT EXISTS registrations_status_idx ON registrations (status);
CREATE INDEX IF NOT EXISTS registrations_mp_payment_idx ON registrations (mp_payment_id);
CREATE UNIQUE INDEX IF NOT EXISTS registrations_mp_preference_idx
    ON registrations (mp_preference_id) WHERE mp_preference_id IS NOT NULL;
