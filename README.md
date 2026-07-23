# evento-navecon

Landing page da imersão da Navecon com **inscrição + pagamento pelo Mercado
Pago**. Full-stack Dockerizado: um app Node (Express) serve o SPA (React/Vite) e
a API; **Postgres** guarda as inscrições; **e-mail** via SMTP do Gmail.

- **Fluxo:** o visitante preenche o formulário → a inscrição é gravada como
  `pending` e o Mercado Pago gera a cobrança (R$ 1.899, até 6x, pix) → o
  visitante paga no checkout → a inscrição vira `paid` (com método e nº de
  parcelas) e sai o e-mail de confirmação.
- **Conciliação:** o estado do pagamento é resolvido por uma função idempotente
  com dois gatilhos — o **webhook** do MP (instantâneo, quando há IP público) e
  um **poller** que consulta o MP periodicamente (funciona sempre; essencial pro
  pix, que é pago depois). Ver `server/reconcile.ts`.

## Pré-requisitos

- Docker + Docker Compose.
- Conta no Mercado Pago (com **pix** e **parcelamento** ativos no painel).
- Conta Gmail com **senha de app** (a `noreply.navecon`).

## Configuração

```bash
cp .env.example .env
```

Preencha o `.env` (ele **nunca** vai pro git). Valores que importam:

| Variável | O que é |
|---|---|
| `POSTGRES_PASSWORD` | senha forte do banco |
| `PUBLIC_BASE_URL` | URL pública do site (produção). Ex.: `https://imersao.navecon.com.br`. Usada nos `back_urls` e no webhook do MP. |
| `MP_ACCESS_TOKEN` | **secreto** — access token de produção do Mercado Pago |
| `MP_PUBLIC_KEY` | public key (não usada no Checkout Pro por redirect; fica de reserva) |
| `TICKET_PRICE_CENTS` | preço em centavos (`189900` = R$ 1.899,00) |
| `MAX_INSTALLMENTS` | nº máximo de parcelas (`6`) |
| `SMTP_USER` / `SMTP_PASS` | e-mail e **senha de app** do Gmail |
| `NOTIFY_EMAIL` | quem recebe o aviso de cada nova inscrição |

> Segredos (`MP_ACCESS_TOKEN`, `SMTP_PASS`) só vivem no `.env`. Se algum vazar,
> revogue/gere outro no painel correspondente.

## Subir

```bash
docker compose up -d --build
```

- App: **http://localhost:4099** (porta interna 3000).
- Banco: **localhost:5099** (interno 5432).
- A migration roda sozinha (container `evento-navecon-migrate`) antes do app.

Ver inscrições:

```bash
docker exec -it evento-navecon-db psql -U evento -d evento_navecon \
  -c "select full_name, email, status, payment_method, installments, paid_at from registrations order by created_at desc;"
```

## No painel do Mercado Pago

- Ative **pix** e o **parcelamento até 6x** (as parcelas saem **com juros pro
  cliente**, que é o padrão — a loja recebe o valor cheio).
- Com domínio público, o webhook é `PUBLIC_BASE_URL/api/mp/webhook`. Sem domínio
  público não tem problema: o poller concilia mesmo assim (só demora alguns
  minutos, o intervalo é o `POLL_INTERVAL_MS`).

## Desenvolvimento local (sem Docker)

```bash
npm install
npm run dev            # SPA em modo dev (usa o submitter placeholder, sem backend)

# Para exercitar a API de verdade, com um Postgres à mão e o .env preenchido:
npm run migrate        # aplica as migrations
npm run server:dev     # sobe o backend com reload
```

## Scripts

| Script | O que faz |
|---|---|
| `npm run dev` | SPA em modo dev (Vite) |
| `npm run build` | build do SPA (`dist/`) |
| `npm test` | testes do frontend (Vitest) |
| `npm run typecheck` / `typecheck:server` | checagem de tipos do front / do backend |
| `npm run server` / `server:dev` | backend (uma vez / com reload) |
| `npm run migrate` | aplica as migrations |

## Estrutura

```
server/            backend Express + TS (rodado com tsx)
  index.ts         entrypoint: serve o SPA + monta /api, inicia o poller
  routes/          register, webhook, payment
  mercadopago.ts   cliente do MP (Checkout Pro)
  reconcile.ts     conciliação idempotente (webhook + poller)
  email.ts         e-mail via SMTP do Gmail
db/migrations/     SQL versionado (runner em server/migrate.ts)
src/               SPA React/Vite (landing + PaymentResult)
```

> O deploy antigo em GitHub Pages (`scripts/deploy-pages.sh`, `--mode ghpages`)
> serve só a landing **estática** — sem inscrição/pagamento, que exigem o backend.
