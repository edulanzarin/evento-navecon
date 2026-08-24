/**
 * Views do painel /admin — HTML renderizado no servidor, sem framework nem JS no
 * cliente (a CSP do site só permite script 'self', e o painel não precisa de
 * nenhum). Estilo inline seguindo a paleta do site. Todo dado dinâmico passa por
 * {@link esc} antes de entrar no HTML — a defesa contra XSS.
 */
import { formatBRL, type RegistrationRow } from "../types";
import type { CouponRow, CouponUse } from "../coupons";

/** Escapa texto para inserção segura em HTML. */
export function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const STYLE = `
  :root{--bg:#0a1430;--surface:#0f1d3d;--fg:#f4f6fb;--muted:#a8b6d2;
    --accent:#d4af37;--accent2:#c8a23c;--ok:#34d39a;--warn:#e6c463;--err:#ff8585;
    --line:rgba(168,182,210,.18)}
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--fg);
    font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;font-size:15px}
  a{color:var(--accent)}
  .wrap{max-width:1200px;margin:0 auto;padding:1.5rem clamp(1rem,3vw,2rem)}
  .topbar{display:flex;align-items:center;justify-content:space-between;gap:1rem;
    padding-bottom:1.1rem;border-bottom:1px solid var(--line);margin-bottom:1.5rem}
  .brand{font-weight:700;letter-spacing:.03em}
  .brand span{color:var(--accent)}
  .btn{display:inline-block;border:1px solid var(--line);background:rgba(255,255,255,.04);
    color:var(--fg);padding:.5rem .85rem;border-radius:10px;font:inherit;cursor:pointer;
    text-decoration:none;line-height:1.2}
  .btn:hover{border-color:var(--accent)}
  .btn-primary{background:linear-gradient(135deg,var(--warn),var(--accent2));
    color:#0a1430;font-weight:600;border:none}
  .btn-sm{padding:.3rem .55rem;font-size:.8rem;border-radius:8px}
  .cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:.9rem;
    margin-bottom:1.5rem}
  .card{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:1rem 1.1rem}
  .card .k{font-size:.72rem;text-transform:uppercase;letter-spacing:.06em;color:var(--muted)}
  .card .v{font-size:1.5rem;font-weight:700;margin-top:.25rem}
  .filters{display:flex;flex-wrap:wrap;gap:.6rem;align-items:center;margin-bottom:1rem}
  .filters select,.filters input{background:rgba(255,255,255,.04);border:1px solid var(--line);
    color:var(--fg);border-radius:10px;padding:.5rem .7rem;font:inherit;min-height:40px}
  .filters input{min-width:220px}
  .flash{padding:.7rem 1rem;border-radius:10px;margin-bottom:1rem;font-weight:600}
  .flash-ok{background:rgba(52,211,154,.12);border:1px solid rgba(52,211,154,.4);color:var(--ok)}
  .flash-err{background:rgba(255,107,107,.1);border:1px solid rgba(255,107,107,.35);color:var(--err)}
  .table-scroll{overflow-x:auto;border:1px solid var(--line);border-radius:14px}
  table{border-collapse:collapse;width:100%;min-width:820px}
  th,td{text-align:left;padding:.7rem .8rem;border-bottom:1px solid var(--line);
    vertical-align:top;white-space:nowrap}
  th{font-size:.72rem;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);
    background:rgba(255,255,255,.02)}
  tr:last-child td{border-bottom:none}
  td .sub{color:var(--muted);font-size:.82rem}
  .pill{display:inline-block;padding:.15rem .5rem;border-radius:999px;font-size:.72rem;
    font-weight:700;text-transform:uppercase;letter-spacing:.04em}
  .p-paid{color:var(--ok);background:rgba(52,211,154,.12);border:1px solid rgba(52,211,154,.4)}
  .p-pending{color:var(--warn);background:rgba(200,162,60,.12);border:1px solid rgba(200,162,60,.4)}
  .p-dead{color:var(--err);background:rgba(255,107,107,.1);border:1px solid rgba(255,107,107,.35)}
  .actions{display:flex;gap:.4rem;flex-wrap:wrap}
  .muted{color:var(--muted)}
  .empty{padding:2.5rem;text-align:center;color:var(--muted)}
  .login{max-width:360px;margin:12vh auto 0}
  .login .card{padding:1.6rem}
  .login h1{margin:.2rem 0 1.2rem;font-size:1.25rem}
  .login label{display:block;font-size:.8rem;color:var(--muted);margin:.8rem 0 .3rem}
  .login input{width:100%;background:rgba(255,255,255,.04);border:1px solid var(--line);
    color:var(--fg);border-radius:10px;padding:.6rem .8rem;font:inherit;min-height:44px}
  .login .btn-primary{width:100%;margin-top:1.2rem;min-height:44px}
  .nav{display:flex;align-items:center;gap:.4rem}
  .navlink{padding:.5rem .8rem;border-radius:10px;text-decoration:none;color:var(--muted);
    font-weight:600}
  .navlink:hover{color:var(--fg)}
  .navlink--on{color:var(--accent);background:rgba(200,162,60,.12)}
  .panel{background:var(--surface);border:1px solid var(--line);border-radius:14px;
    padding:1.1rem 1.25rem;margin-bottom:1.5rem}
  .panel h2{margin:0 0 .9rem;font-size:1rem}
  .cform{display:flex;flex-wrap:wrap;gap:.7rem;align-items:flex-end}
  .cform .fld{display:flex;flex-direction:column;gap:.3rem}
  .cform label{font-size:.72rem;text-transform:uppercase;letter-spacing:.05em;color:var(--muted)}
  .cform input{background:rgba(255,255,255,.04);border:1px solid var(--line);color:var(--fg);
    border-radius:10px;padding:.55rem .7rem;font:inherit;min-height:42px}
  .cform input[name=code]{text-transform:uppercase}
  .uses{font-variant-numeric:tabular-nums}
  .bar{height:6px;border-radius:999px;background:rgba(255,255,255,.08);margin-top:.3rem;overflow:hidden}
  .bar > i{display:block;height:100%;background:linear-gradient(90deg,var(--warn),var(--accent2))}
  .tag{display:inline-block;padding:.15rem .5rem;border-radius:999px;font-size:.72rem;font-weight:700}
  .tag-on{color:var(--ok);background:rgba(52,211,154,.12);border:1px solid rgba(52,211,154,.4)}
  .tag-off{color:var(--muted);background:rgba(168,182,210,.1);border:1px solid var(--line)}
`;

/** Barra superior com navegação entre Inscrições e Cupons. */
function topbar(active: "inscricoes" | "cupons"): string {
  const link = (href: string, id: string, label: string): string =>
    `<a class="navlink${active === id ? " navlink--on" : ""}" href="${href}">${label}</a>`;
  return `<div class="topbar">
    <div class="brand">Imersão <span>Navecon</span> · Painel</div>
    <nav class="nav">
      ${link("/admin", "inscricoes", "Inscrições")}
      ${link("/admin/coupons", "cupons", "Cupons")}
      <form method="post" action="/admin/logout"><button class="btn" type="submit">Sair</button></form>
    </nav>
  </div>`;
}

function layout(title: string, body: string): string {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>${esc(title)}</title><style>${STYLE}</style></head><body>${body}</body></html>`;
}

/** Tela de login. `error` mostra a mensagem de credencial inválida. */
export function loginPage(error?: string): string {
  const alert = error
    ? `<p class="flash flash-err">${esc(error)}</p>`
    : "";
  return layout(
    "Entrar — Painel Navecon",
    `<div class="wrap"><div class="login"><div class="card">
      <div class="brand">Imersão <span>Navecon</span></div>
      <h1>Painel administrativo</h1>
      ${alert}
      <form method="post" action="/admin/login">
        <label for="u">Usuário</label>
        <input id="u" name="user" autocomplete="username" autofocus required>
        <label for="p">Senha</label>
        <input id="p" name="password" type="password" autocomplete="current-password" required>
        <button class="btn btn-primary" type="submit">Entrar</button>
      </form>
    </div></div></div>`,
  );
}

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendente",
  in_process: "Processando",
  paid: "Pago",
  rejected: "Recusado",
  cancelled: "Cancelado",
  refunded: "Estornado",
};

function statusPill(status: string): string {
  const label = STATUS_LABEL[status] ?? status;
  const cls =
    status === "paid"
      ? "p-paid"
      : status === "pending" || status === "in_process"
        ? "p-pending"
        : "p-dead";
  return `<span class="pill ${cls}">${esc(label)}</span>`;
}

/** Rótulo pt-BR da forma de pagamento. */
export function methodLabel(
  method: string | null,
  installments: number | null,
): string {
  if (!method) return "—";
  if (method === "cortesia") return "Cortesia";
  if (method === "manual") return "Externo";
  if (method === "pix") return "Pix";
  if (installments && installments > 1) return `Cartão ${installments}x`;
  return "Cartão";
}

const dateFmt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Sao_Paulo",
});

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : dateFmt.format(d);
}

export interface Summary {
  total: number;
  paid: number;
  pending: number;
  courtesy: number;
  revenueCents: number;
}

export interface DashboardData {
  rows: RegistrationRow[];
  summary: Summary;
  filter: { status: string; q: string };
  flash?: { msg?: string; err?: string };
}

function rowActions(r: RegistrationRow): string {
  if (r.status === "paid") return '<span class="muted">—</span>';
  const markPaid = `<form method="post" action="/admin/registrations/${esc(r.id)}/mark-paid">
      <button class="btn btn-sm" type="submit">Marcar pago</button></form>`;
  // Reenviar link só faz sentido no fluxo do MP (tem preferência), não em cortesia.
  const resend = r.mp_preference_id
    ? `<form method="post" action="/admin/registrations/${esc(r.id)}/resend-link">
        <button class="btn btn-sm" type="submit">Reenviar link</button></form>`
    : "";
  return `<div class="actions">${markPaid}${resend}</div>`;
}

function tableRow(r: RegistrationRow): string {
  const amount = formatBRL(r.paid_amount_cents ?? r.amount_cents);
  const company = r.company ? esc(r.company) : '<span class="muted">—</span>';
  const coupon = r.coupon_code
    ? esc(r.coupon_code)
    : '<span class="muted">—</span>';
  return `<tr>
    <td>${esc(formatDate(r.created_at))}</td>
    <td>${esc(r.full_name)}</td>
    <td>${esc(r.email)}<div class="sub">${esc(r.phone)}</div></td>
    <td>${company}</td>
    <td>${statusPill(r.status)}</td>
    <td>${esc(methodLabel(r.payment_method, r.installments))}</td>
    <td>${esc(amount)}</td>
    <td>${coupon}</td>
    <td>${rowActions(r)}</td>
  </tr>`;
}

function statusOptions(selected: string): string {
  const opts = [
    ["", "Todos os status"],
    ["paid", "Pago"],
    ["pending", "Pendente"],
    ["in_process", "Processando"],
    ["rejected", "Recusado"],
    ["cancelled", "Cancelado"],
    ["refunded", "Estornado"],
  ];
  return opts
    .map(
      ([v, label]) =>
        `<option value="${esc(v)}"${v === selected ? " selected" : ""}>${esc(label)}</option>`,
    )
    .join("");
}

/** Dashboard completo: resumo, filtros, tabela e ações. */
export function dashboardPage(data: DashboardData): string {
  const { summary, rows, filter, flash } = data;

  const flashHtml = flash?.msg
    ? `<p class="flash flash-ok">${esc(flash.msg)}</p>`
    : flash?.err
      ? `<p class="flash flash-err">${esc(flash.err)}</p>`
      : "";

  const cards = `<div class="cards">
    <div class="card"><div class="k">Inscrições</div><div class="v">${summary.total}</div></div>
    <div class="card"><div class="k">Pagas</div><div class="v">${summary.paid}</div></div>
    <div class="card"><div class="k">Pendentes</div><div class="v">${summary.pending}</div></div>
    <div class="card"><div class="k">Cortesias</div><div class="v">${summary.courtesy}</div></div>
    <div class="card"><div class="k">Receita confirmada</div><div class="v">${esc(formatBRL(summary.revenueCents))}</div></div>
  </div>`;

  const exportQs = new URLSearchParams();
  if (filter.status) exportQs.set("status", filter.status);
  if (filter.q) exportQs.set("q", filter.q);

  const filters = `<form class="filters" method="get" action="/admin">
    <select name="status" aria-label="Filtrar por status">${statusOptions(filter.status)}</select>
    <input type="search" name="q" value="${esc(filter.q)}" placeholder="Buscar por nome ou e-mail">
    <button class="btn" type="submit">Filtrar</button>
    <a class="btn" href="/admin/export.csv?${exportQs.toString()}">Exportar CSV</a>
  </form>`;

  const table =
    rows.length === 0
      ? '<div class="empty">Nenhuma inscrição para este filtro.</div>'
      : `<div class="table-scroll"><table>
          <thead><tr>
            <th>Data</th><th>Nome</th><th>Contato</th><th>Empresa</th>
            <th>Status</th><th>Forma</th><th>Valor</th><th>Cupom</th><th>Ações</th>
          </tr></thead>
          <tbody>${rows.map(tableRow).join("")}</tbody>
        </table></div>`;

  return layout(
    "Painel — Imersão Navecon",
    `<div class="wrap">
      ${topbar("inscricoes")}
      ${flashHtml}
      ${cards}
      ${filters}
      ${table}
    </div>`,
  );
}

// ── Cupons ───────────────────────────────────────────────────────────────────

const COUPON_FLASH: Record<string, { msg?: string; err?: string }> = {
  created: { msg: "Cupom criado." },
  exists: { err: "Já existe um cupom com esse código." },
  invalid: { err: "Código, desconto ou nº de usos inválido." },
  updated: { msg: "Cupom atualizado." },
  deleted: { msg: "Cupom excluído." },
};

/** Rótulo do desconto: 100% é a cortesia; o resto é só a porcentagem. */
function discountLabel(percent: number): string {
  return percent >= 100 ? "Cortesia (100%)" : `${percent}%`;
}

function couponRow(c: CouponRow): string {
  const pct = c.max_uses > 0 ? Math.min(100, Math.round((c.uses / c.max_uses) * 100)) : 0;
  const status = c.active
    ? '<span class="tag tag-on">Ativo</span>'
    : '<span class="tag tag-off">Inativo</span>';
  const toggleLabel = c.active ? "Desativar" : "Ativar";
  return `<tr>
    <td><a href="/admin/coupons/${encodeURIComponent(c.code)}"><strong>${esc(c.code)}</strong></a></td>
    <td>${discountLabel(c.discount_percent)}</td>
    <td class="uses">${c.uses}/${c.max_uses}<div class="bar"><i style="width:${pct}%"></i></div></td>
    <td>${status}</td>
    <td>${c.note ? esc(c.note) : '<span class="muted">—</span>'}</td>
    <td><div class="actions">
      <a class="btn btn-sm" href="/admin/coupons/${encodeURIComponent(c.code)}">Quem usou</a>
      <form method="post" action="/admin/coupons/${encodeURIComponent(c.code)}/toggle"><button class="btn btn-sm" type="submit">${toggleLabel}</button></form>
      <form method="post" action="/admin/coupons/${encodeURIComponent(c.code)}/delete"><button class="btn btn-sm" type="submit">Excluir</button></form>
    </div></td>
  </tr>`;
}

/**
 * Página de cupons: formulário de criação + tabela com desconto, uso e ações.
 * 100% é cortesia (dispensa o checkout); abaixo disso o cupom só abate o valor.
 */
export function couponsPage(
  coupons: CouponRow[],
  flashKey?: string,
): string {
  const flash = flashKey ? COUPON_FLASH[flashKey] : undefined;
  const flashHtml = flash?.msg
    ? `<p class="flash flash-ok">${esc(flash.msg)}</p>`
    : flash?.err
      ? `<p class="flash flash-err">${esc(flash.err)}</p>`
      : "";

  const form = `<div class="panel">
    <h2>Novo cupom</h2>
    <form class="cform" method="post" action="/admin/coupons">
      <div class="fld"><label for="c-code">Código</label>
        <input id="c-code" name="code" placeholder="NAVECON15" autocapitalize="characters" required></div>
      <div class="fld"><label for="c-pct">Desconto (%)</label>
        <input id="c-pct" name="discount_percent" type="number" min="1" max="100" value="100" required style="width:110px"></div>
      <div class="fld"><label for="c-max">Usos</label>
        <input id="c-max" name="max_uses" type="number" min="1" max="100000" value="1" required style="width:90px"></div>
      <div class="fld" style="flex:1;min-width:180px"><label for="c-note">Nota (pra quem)</label>
        <input id="c-note" name="note" placeholder="Ex.: Convidados VIP" maxlength="120"></div>
      <button class="btn btn-primary" type="submit">Criar cupom</button>
    </form>
  </div>`;

  const table =
    coupons.length === 0
      ? '<div class="empty">Nenhum cupom ainda. Crie o primeiro acima.</div>'
      : `<div class="table-scroll"><table>
          <thead><tr>
            <th>Código</th><th>Desconto</th><th>Usos</th><th>Status</th><th>Nota</th><th>Ações</th>
          </tr></thead>
          <tbody>${coupons.map(couponRow).join("")}</tbody>
        </table></div>`;

  return layout(
    "Cupons — Imersão Navecon",
    `<div class="wrap">${topbar("cupons")}${flashHtml}${form}${table}</div>`,
  );
}

/** Página de detalhe de um cupom: quem já o usou. */
export function couponUsesPage(code: string, uses: CouponUse[]): string {
  const rows = uses
    .map(
      (u) => `<tr>
        <td>${esc(formatDate(u.created_at))}</td>
        <td>${esc(u.full_name)}</td>
        <td>${esc(u.email)}<div class="sub">${esc(u.phone)}</div></td>
        <td>${statusPill(u.status)}</td>
      </tr>`,
    )
    .join("");
  const table =
    uses.length === 0
      ? '<div class="empty">Este cupom ainda não foi usado.</div>'
      : `<div class="table-scroll"><table>
          <thead><tr><th>Data</th><th>Nome</th><th>Contato</th><th>Status</th></tr></thead>
          <tbody>${rows}</tbody></table></div>`;

  return layout(
    `Cupom ${code} — Imersão Navecon`,
    `<div class="wrap">${topbar("cupons")}
      <p style="margin:.2rem 0 1.2rem"><a href="/admin/coupons">← Voltar aos cupons</a></p>
      <h1 style="font-size:1.3rem;margin:0 0 1rem">Quem usou <span style="color:var(--accent)">${esc(code)}</span> — ${uses.length}</h1>
      ${table}
    </div>`,
  );
}
