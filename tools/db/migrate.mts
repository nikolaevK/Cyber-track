/**
 * Applies db/schema.sql to the configured database. Idempotent (IF NOT EXISTS everywhere).
 *
 *   npm run db:migrate                       # local: .data/spots.db
 *   TURSO_DATABASE_URL=libsql://... TURSO_AUTH_TOKEN=... npm run db:migrate   # Turso
 *
 * Reads `.env.local` when present. The app also runs this schema on first use, so the script is
 * for provisioning a fresh Turso database up front and for checking the connection.
 */
import { readFileSync } from "node:fs";
import { createClient } from "@libsql/client";

try {
  process.loadEnvFile(".env.local");
} catch {
  // No .env.local: rely on the environment.
}

const url = process.env.TURSO_DATABASE_URL ?? "file:.data/spots.db";
const authToken = process.env.TURSO_AUTH_TOKEN;
if (url.startsWith("file:")) {
  const { mkdirSync } = await import("node:fs");
  mkdirSync(".data", { recursive: true });
}

const client = createClient({ url, authToken });
// Strip comments first, then split: a semicolon inside a comment must not end a statement.
const statements = readFileSync("db/schema.sql", "utf8")
  .replace(/--.*$/gm, "")
  .split(";")
  .map((s) => s.trim())
  .filter(Boolean);

await client.batch(statements, "write");
const { rows } = await client.execute("SELECT status, COUNT(*) AS n FROM spot_states GROUP BY status");
console.log(`Schema applied to ${url.replace(/\?.*$/, "")}`);
console.log(rows.length ? rows.map((r) => `  ${r.status}: ${r.n}`).join("\n") : "  (no rows yet)");
client.close();
