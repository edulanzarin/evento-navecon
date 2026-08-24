/**
 * Cupons de desconto com código escolhido, porcentagem e N usos.
 *
 * A porcentagem manda no fluxo: 100% é cortesia (dispensa o Mercado Pago, que
 * não cobra R$ 0) e 1–99% apenas abate o valor do ingresso — o checkout segue
 * normal, só mais barato.
 *
 * - normalizeCode: deixa o código canônico (trim + MAIÚSCULAS) para bater sem
 *   sensibilidade a caixa.
 * - redeemCoupon: resgate ATÔMICO por limite. O UPDATE só incrementa se o cupom
 *   está ativo E ainda tem uso (`uses < max_uses`); duas pessoas disputando o
 *   último uso competem no banco e só uma leva. É o que garante o limite sem
 *   trava de aplicação nem condição de corrida. Devolve a porcentagem resgatada
 *   na mesma ida ao banco.
 * - o restante são as operações do painel /admin (criar, listar, resgates,
 *   ativar/desativar, excluir).
 *
 * "Quem usou" não é guardado aqui: vem de registrations.coupon_code.
 */
import { query } from "./db";

/** Deixa o código canônico: sem espaços nas pontas, tudo em maiúsculas. */
export function normalizeCode(raw: string): string {
  return raw.trim().toUpperCase();
}

// 3–40 chars, letras/números e hífen no meio (ex.: NAVECON100, VIP-2026).
const CODE_RE = /^[A-Z0-9](?:[A-Z0-9-]{1,38}[A-Z0-9])$/;

/** Um código é sintaticamente aceitável (antes de ir ao banco). */
export function isValidCode(raw: string): boolean {
  return CODE_RE.test(normalizeCode(raw));
}

/** Uma linha da tabela `coupons` como lida do banco. */
export interface CouponRow {
  code: string;
  note: string | null;
  discount_percent: number;
  max_uses: number;
  uses: number;
  active: boolean;
  created_at: string;
}

/** Um desconto é uma porcentagem inteira de 1 a 100. */
export function isValidPercent(percent: number): boolean {
  return Number.isInteger(percent) && percent >= 1 && percent <= 100;
}

/**
 * O que sobra do ingresso depois do desconto, em centavos. 100% zera (cortesia);
 * o arredondamento é para o centavo mais próximo.
 */
export function discountedCents(priceCents: number, percent: number): number {
  if (percent >= 100) return 0;
  return Math.max(0, Math.round((priceCents * (100 - percent)) / 100));
}

/**
 * Resgata um uso do cupom. Devolve a porcentagem de desconto só quando ele
 * existe, está ativo e ainda tinha uso livre — nesse caso o contador sobe em um.
 * Qualquer outra situação (inexistente, inativo, esgotado) devolve `null`.
 */
export async function redeemCoupon(code: string): Promise<number | null> {
  const { rows } = await query<{ discount_percent: number }>(
    `UPDATE coupons SET uses = uses + 1
      WHERE code = $1 AND active = true AND uses < max_uses
      RETURNING discount_percent`,
    [normalizeCode(code)],
  );
  return rows.length > 0 ? rows[0].discount_percent : null;
}

/**
 * Devolve um uso ao cupom — compensação para quando o resgate deu certo mas a
 * inscrição não chegou a ser gravada. Nunca deixa o contador abaixo de zero.
 */
export async function releaseCoupon(code: string): Promise<void> {
  await query(
    `UPDATE coupons SET uses = uses - 1 WHERE code = $1 AND uses > 0`,
    [normalizeCode(code)],
  );
}

// ── Operações do painel /admin ───────────────────────────────────────────────

export type CreateResult = "ok" | "exists" | "invalid";

/** Cria um cupom com código escolhido, porcentagem de desconto e limite de usos. */
export async function createCoupon(
  rawCode: string,
  maxUses: number,
  discountPercent: number,
  note: string | null,
): Promise<CreateResult> {
  if (!isValidCode(rawCode)) return "invalid";
  if (!Number.isInteger(maxUses) || maxUses < 1 || maxUses > 100_000)
    return "invalid";
  if (!isValidPercent(discountPercent)) return "invalid";
  const { rowCount } = await query(
    `INSERT INTO coupons (code, note, max_uses, discount_percent)
     VALUES ($1, $2, $3, $4) ON CONFLICT (code) DO NOTHING`,
    [normalizeCode(rawCode), note?.trim() || null, maxUses, discountPercent],
  );
  return rowCount ? "ok" : "exists";
}

/** Todos os cupons, mais recentes primeiro. */
export async function listCoupons(): Promise<CouponRow[]> {
  const { rows } = await query<CouponRow>(
    `SELECT code, note, discount_percent, max_uses, uses, active, created_at
       FROM coupons ORDER BY created_at DESC, code`,
  );
  return rows;
}

/** Uma linha da lista "quem usou este cupom". */
export interface CouponUse {
  full_name: string;
  email: string;
  phone: string;
  status: string;
  created_at: string;
}

/** As inscrições que resgataram um cupom (o histórico de uso). */
export async function couponUses(code: string): Promise<CouponUse[]> {
  const { rows } = await query<CouponUse>(
    `SELECT full_name, email, phone, status, created_at
       FROM registrations WHERE coupon_code = $1
      ORDER BY created_at DESC`,
    [normalizeCode(code)],
  );
  return rows;
}

/** Liga/desliga um cupom (desligado não resgata mais). */
export async function setCouponActive(
  code: string,
  active: boolean,
): Promise<void> {
  await query(`UPDATE coupons SET active = $2 WHERE code = $1`, [
    normalizeCode(code),
    active,
  ]);
}

/** Remove um cupom (as inscrições que já o usaram continuam intactas). */
export async function deleteCoupon(code: string): Promise<void> {
  await query(`DELETE FROM coupons WHERE code = $1`, [normalizeCode(code)]);
}
