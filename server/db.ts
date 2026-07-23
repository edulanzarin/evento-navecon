/**
 * Pool de conexões Postgres. Lê a configuração do ambiente: `DATABASE_URL` se
 * presente, senão as variáveis padrão do node-postgres (PGHOST, PGPORT, PGUSER,
 * PGPASSWORD, PGDATABASE) — que o compose injeta apontando para o serviço `db`.
 */
import pg from "pg";

const connectionString = process.env.DATABASE_URL;

export const pool = new pg.Pool(
  connectionString ? { connectionString } : {},
);

// Um erro num cliente ocioso não deve derrubar o processo silenciosamente.
pool.on("error", (err) => {
  console.error("[db] erro inesperado no pool:", err);
});

/** Açúcar tipado para queries. */
export function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<pg.QueryResult<T>> {
  return pool.query<T>(text, params);
}
