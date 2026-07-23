/**
 * Runner de migrations — roda no container `evento-navecon-migrate`, uma vez,
 * antes do app subir. Aplica os arquivos .sql de db/migrations/ em ordem,
 * registrando cada um em `_migrations` para não reaplicar. Cada migration roda
 * dentro de uma transação; falha → rollback → processo sai com código 1.
 */
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "./db";

const migrationsDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "db",
  "migrations",
);

async function run(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        name       text PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    const applied = new Set(
      (await client.query<{ name: string }>("SELECT name FROM _migrations")).rows.map(
        (r) => r.name,
      ),
    );

    const files = readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    for (const file of files) {
      if (applied.has(file)) {
        console.log(`[migrate] pulando ${file} (já aplicada)`);
        continue;
      }
      const sql = readFileSync(join(migrationsDir, file), "utf8");
      console.log(`[migrate] aplicando ${file}...`);
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query("INSERT INTO _migrations (name) VALUES ($1)", [file]);
        await client.query("COMMIT");
        console.log(`[migrate] ok ${file}`);
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      }
    }
  } finally {
    client.release();
    await pool.end();
  }
}

run()
  .then(() => {
    console.log("[migrate] concluído");
    process.exit(0);
  })
  .catch((err) => {
    console.error("[migrate] falhou:", err);
    process.exit(1);
  });
