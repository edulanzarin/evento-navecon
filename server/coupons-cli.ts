/**
 * CLI de cupons de cortesia — sem painel admin, a gestão é pelo terminal.
 *
 *   npm run coupons -- gen 20 "Convidados VIP"   cria 20 cupons e imprime a lista
 *   npm run coupons -- list                        mostra todos, com status
 *
 * Usa o mesmo acesso ao banco do app (DATABASE_URL ou PG*). Em produção, rode
 * dentro do container do app:
 *   docker compose -f docker-compose.prod.yml exec app npm run coupons -- gen 20 "..."
 */
import { randomInt } from "node:crypto";
import { pool, query } from "./db";
import { normalizeCode } from "./coupons";

// Alfabeto sem caracteres ambíguos (0/O, 1/I/L) — códigos ditados sem erro.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function randomCode(): string {
  let suffix = "";
  for (let i = 0; i < 4; i++) suffix += ALPHABET[randomInt(ALPHABET.length)];
  return `NAVE-${suffix}`;
}

/** Insere um código único, reencontrando outro em caso de colisão (raro). */
async function insertUnique(note: string | null): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt++) {
    const code = randomCode();
    const { rows } = await query<{ code: string }>(
      `INSERT INTO coupons (code, note) VALUES ($1, $2)
         ON CONFLICT (code) DO NOTHING RETURNING code`,
      [code, note],
    );
    if (rows.length > 0) return rows[0].code;
  }
  throw new Error("Não consegui gerar um código único — tente de novo.");
}

async function gen(count: number, note: string | null): Promise<void> {
  if (!Number.isInteger(count) || count < 1 || count > 500) {
    throw new Error("Quantidade inválida (use um número de 1 a 500).");
  }
  const codes: string[] = [];
  for (let i = 0; i < count; i++) codes.push(await insertUnique(note));
  console.log(`\n${count} cupom(ns) de cortesia criado(s)${note ? ` — ${note}` : ""}:\n`);
  for (const code of codes) console.log(`  ${code}`);
  console.log("\nEntregue um código por pessoa. Cada um vale uma única inscrição.\n");
}

async function list(): Promise<void> {
  const { rows } = await query<{
    code: string;
    note: string | null;
    redeemed_at: Date | null;
  }>(`SELECT code, note, redeemed_at FROM coupons ORDER BY created_at, code`);

  if (rows.length === 0) {
    console.log("Nenhum cupom cadastrado. Crie com: npm run coupons -- gen 20");
    return;
  }
  const used = rows.filter((r) => r.redeemed_at).length;
  console.log(`\n${rows.length} cupom(ns) — ${used} usado(s), ${rows.length - used} livre(s):\n`);
  for (const r of rows) {
    const status = r.redeemed_at ? "USADO " : "LIVRE ";
    console.log(`  ${r.code}  ${status}  ${r.note ?? ""}`.trimEnd());
  }
  console.log("");
}

async function main(): Promise<void> {
  const [cmd, ...rest] = process.argv.slice(2);
  if (cmd === "gen") {
    const count = Number(rest[0] ?? "0");
    const note = rest.slice(1).join(" ").trim() || null;
    await gen(count, note);
  } else if (cmd === "list") {
    await list();
  } else if (cmd === "revoke") {
    // Remove um cupom ainda não usado (ex.: gerado por engano).
    const code = normalizeCode(rest[0] ?? "");
    const { rowCount } = await query(
      `DELETE FROM coupons WHERE code = $1 AND redeemed_at IS NULL`,
      [code],
    );
    console.log(rowCount ? `Cupom ${code} removido.` : `Nada removido (${code} não existe ou já foi usado).`);
  } else {
    console.log(
      "Uso:\n" +
        "  npm run coupons -- gen <quantidade> [nota]   cria cupons de cortesia\n" +
        "  npm run coupons -- list                        lista todos com status\n" +
        "  npm run coupons -- revoke <CÓDIGO>             remove um cupom não usado",
    );
  }
}

main()
  .catch((err) => {
    console.error("[coupons]", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
