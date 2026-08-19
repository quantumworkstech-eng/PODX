/**
 * Run a SQL migration file against Postgres (local or Supabase).
 *
 * Usage:
 *   npm run db:migrate-<name>                       (loads .env.local for you)
 *   node --env-file=.env.local scripts/run-sql-file.mjs src/db/coupon_migration.sql
 *
 * Requires DATABASE_URL (Supabase: Project Settings → Database → URI, use port 5432
 * direct connection for DDL, not the transaction pooler on 6543), or DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function getConfig() {
  const url = process.env.DATABASE_URL?.trim();
  if (url) {
    return {
      connectionString: url,
      ssl: url.includes("supabase") || process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : undefined,
    };
  }

  // Without DATABASE_URL the defaults below point at a local Postgres that most
  // machines don't run, and pg then reports `role "postgres" does not exist` —
  // which reads like a permissions problem rather than missing config. Say what
  // is actually wrong instead.
  if (!process.env.DB_HOST) {
    console.error(
      [
        "No database connection configured.",
        "",
        "Set DATABASE_URL in .env.local, then re-run. For Supabase:",
        "  Project Settings -> Database -> Connection string -> URI",
        "  Use the direct connection on port 5432 (DDL does not work over the",
        "  transaction pooler on 6543).",
        "",
        '  DATABASE_URL=postgresql://postgres:<password>@db.<ref>.supabase.co:5432/postgres',
        "",
        "Or set DB_HOST / DB_PORT / DB_NAME / DB_USER / DB_PASSWORD for a local database.",
      ].join("\n")
    );
    process.exit(1);
  }

  const password = process.env.DB_PASSWORD ?? "";
  return {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432", 10),
    database: process.env.DB_NAME || "podx",
    user: process.env.DB_USER || "postgres",
    password,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  };
}

const sqlPath = process.argv[2];
if (!sqlPath) {
  console.error("Usage: node scripts/run-sql-file.mjs <path-to.sql>");
  process.exit(1);
}

const absolute = path.isAbsolute(sqlPath) ? sqlPath : path.join(process.cwd(), sqlPath);
if (!fs.existsSync(absolute)) {
  console.error("File not found:", absolute);
  process.exit(1);
}

const sql = fs.readFileSync(absolute, "utf8");
const client = new pg.Client(getConfig());

try {
  await client.connect();
  await client.query(sql);
  console.log("OK:", absolute);
} catch (e) {
  console.error(e.message || e);
  process.exit(1);
} finally {
  await client.end().catch(() => {});
}
