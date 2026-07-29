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
| `PUBLIC_BASE_URL` | URL pública do site (produção). Ex.: `https://imersao.navecon.net.br`. Usada nos `back_urls` e no webhook do MP. |
| `APP_BASE_PATH` | caminho base do **build** do frontend. `/` = raiz do domínio — é o valor certo pro subdomínio `imersao.navecon.net.br`. |
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

## Deploy em `imersao.navecon.net.br` (produção)

O site roda num **subdomínio próprio**, `imersao.navecon.net.br`, apontando
direto pro servidor deste repo. Não há subcaminho nem proxy externo: o app e o
banco publicam portas **só em loopback** e quem atende o mundo é o **Caddy**
(reverse proxy) do `docker-compose.prod.yml`, com **HTTPS automático**
(Let's Encrypt). Como é raiz de subdomínio, `APP_BASE_PATH` fica em `/`.

**1. DNS:** um registro **A/AAAA** de `imersao.navecon.net.br` apontando pro IP
do servidor. Portas **80 e 443** abertas no servidor.

**2. No `.env` do servidor:**

```bash
DOMAIN=imersao.navecon.net.br
PUBLIC_BASE_URL=https://imersao.navecon.net.br  # back_urls + webhook do MP
APP_BASE_PATH=/                                  # raiz do subdomínio
# + os segredos: MP_ACCESS_TOKEN, MP_PUBLIC_KEY, SMTP_USER/SMTP_PASS, POSTGRES_PASSWORD…
```

**3. Puxar as mídias do Git LFS ANTES de buildar.** Os vídeos e imagens
(`public/assets/**` — `.mp4/.png/.jpg/.jpeg`) são versionados via **Git LFS**
(ver `.gitattributes`). Num `git clone`/`git pull` sem LFS eles vêm como
**ponteiros de ~130 bytes**, e o `Dockerfile` (`COPY . .`) leva esses ponteiros
pra imagem — resultado: **a landing sobe mas as mídias não carregam**. No
servidor, uma vez:

```bash
git lfs install     # habilita o LFS pra este usuário/repo (idempotente)
git lfs pull         # baixa os binários reais das mídias
# confirme: du -h public/assets/video/background.mp4  → deve dar alguns MB, não ~130 bytes
```

**4. Subir com o Caddy:**

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

O Caddy emite e renova o certificado sozinho e faz proxy pra `app:3000`.

**5. No painel do Mercado Pago:** o webhook é
`https://imersao.navecon.net.br/api/mp/webhook` (o app monta sozinho a partir do
`PUBLIC_BASE_URL`).

**Checklist pós-deploy:**

- `https://imersao.navecon.net.br/` abre a landing **com as mídias** (vídeos e
  imagens; assets vêm de `/assets/...`).
- `https://imersao.navecon.net.br/api/health` responde `{"ok":true,...}`.
- Uma inscrição vai pro checkout do MP e volta pra `/pagamento/...`.

> **Mídias sumiram depois de um deploy?** É quase sempre o LFS não puxado (passo
> 3). Refaça `git lfs pull` e **rebuilde** (`--build`) — puxar o LFS sem
> rebuildar não adianta, porque as mídias entram na imagem no `COPY . .`.

## Testar o pagamento sem gastar (modo de teste do MP)

O `MP_ACCESS_TOKEN` atual é de **produção** — cada inscrição cobra de verdade
(o checkout já foi validado assim). Pra exercitar o fluxo inteiro (checkout →
aprovação → e-mail → status `paid`) **sem dinheiro real**, use o **modo de teste**
do Mercado Pago:

1. No painel do MP → **Suas integrações → [sua aplicação] → Contas de teste**:
   crie duas contas de teste (uma **vendedora** e uma **compradora**).
2. Faça login com a conta **vendedora** de teste e copie o **access token de
   teste** dela (começa com `TEST-`). Coloque em `MP_ACCESS_TOKEN` no `.env` e
   **reinicie o backend**. (Guarde o token de produção pra depois.)
3. Rode a inscrição normal e, no checkout, pague com um **cartão de teste** do MP
   — nada real é movimentado. O **resultado é escolhido pelo NOME do titular**:

   | Nome do titular | Resultado |
   |---|---|
   | `APRO` | pagamento aprovado |
   | `CONT` | pagamento pendente |
   | `OTHE` | recusado (erro geral) |

   Cartões de teste (validade qualquer futura, ex. `11/30`; CPF `12345678909`):

   | Bandeira | Número | CVV |
   |---|---|---|
   | Mastercard | `5031 4332 1540 6351` | `123` |
   | Visa | `4235 6477 2802 5682` | `123` |

   - **Pix de teste:** o MP gera um pix simulado; o **poller** concilia em alguns
     minutos (ou o webhook, se houver URL pública). É o caminho pra validar o
     "pago depois".
   - Os números/nomes de teste podem mudar — confira a lista atual em
     **Mercado Pago → Documentação → Cartões de teste**.
4. Terminado o teste, volte o `MP_ACCESS_TOKEN` pro token de **produção** e
   reinicie o backend.

> Alternativa "fumaça" com dinheiro real mínimo: baixar `TICKET_PRICE_CENTS=100`
> (R$ 1,00) temporariamente, pagar com cartão real e estornar no painel. O modo
> de teste acima é preferível (não move dinheiro).

## Segurança

- **Segredos** só no `.env` (fora do git e fora da imagem Docker). Rotacione se vazarem.
- **Headers** via helmet: CSP, HSTS, X-Frame-Options, nosniff; sem `X-Powered-By`.
- **Rate limit** por IP: mais rígido no `/api/register` (15 / 10 min); o webhook fica de fora.
- **Banco nunca exposto**: publicado só em `127.0.0.1`; o app fala por rede interna.
- **Webhook confiável por design**: o handler não confia no payload — busca o
  pagamento real no Mercado Pago antes de marcar como pago. SQL parametrizado.
- **TLS** terminado no Caddy; o app roda atrás do proxy (`trust proxy`).

## No painel do Mercado Pago

- Ative **pix** e o **parcelamento até 6x** (as parcelas saem **com juros pro
  cliente**, que é o padrão — a loja recebe o valor cheio).
- Com domínio público, o webhook é `PUBLIC_BASE_URL/api/mp/webhook`. Sem domínio
  público não tem problema: o poller concilia mesmo assim (só demora alguns
  minutos, o intervalo é o `POLL_INTERVAL_MS`).

## Desenvolvimento local (sem Docker)

O `npm run dev` sobe **só o SPA** (Vite, porta 5173). O formulário chama
`/api/register`, que o Vite **encaminha pro backend na 4099** — logo o backend
precisa rodar junto, senão dá `ECONNREFUSED`. São **dois processos**:

```bash
npm install
# Postgres à mão (ex.: o container do compose: docker compose up -d db) e .env preenchido:
npm run migrate        # aplica as migrations (uma vez)

# terminal 1 — backend na 4099 (o PORT já vem do .env, casando com o proxy do Vite)
npm run server:dev     # backend com reload

# terminal 2 — SPA em http://localhost:5173
npm run dev
```

> O endpoint de inscrição deriva do caminho base (`/api/register` na raiz), então
> não precisa configurar nada pra bater no backend em dev.

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
