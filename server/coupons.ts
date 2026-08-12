/**
 * Cupons de cortesia (100% de desconto). Uso único, um código por convidado.
 *
 * - normalizeCode: deixa o código canônico (trim + MAIÚSCULAS) para o que a
 *   pessoa digita bater com o que está no banco, sem sensibilidade a caixa.
 * - redeemCoupon: resgate ATÔMICO. O UPDATE só afeta a linha se ela ainda estiver
 *   livre (`redeemed_at IS NULL`); dois pedidos com o mesmo código competem no
 *   banco e apenas um recebe a linha de volta. Isso é o que garante o uso único
 *   sem trava de aplicação nem condição de corrida.
 */
import { query } from "./db";

/** Deixa o código canônico: sem espaços nas pontas, tudo em maiúsculas. */
export function normalizeCode(raw: string): string {
  return raw.trim().toUpperCase();
}

/** Um código é sintaticamente aceitável antes mesmo de ir ao banco. */
export function looksLikeCoupon(raw: string): boolean {
  const code = normalizeCode(raw);
  return code.length >= 3 && code.length <= 40;
}

/**
 * Tenta resgatar o cupom em nome de uma inscrição. Devolve `true` só quando o
 * código existe E ainda não tinha sido usado — nesse caso a linha passa a
 * apontar para a inscrição. Qualquer outra situação (inexistente ou já usado)
 * devolve `false`, e o chamador trata como cupom inválido.
 */
export async function redeemCoupon(
  code: string,
  registrationId: string,
): Promise<boolean> {
  const { rowCount } = await query(
    `UPDATE coupons
        SET redeemed_by = $2, redeemed_at = now()
      WHERE code = $1 AND redeemed_at IS NULL`,
    [normalizeCode(code), registrationId],
  );
  return (rowCount ?? 0) > 0;
}
