/**
 * Run a SQL migration file against Postgres (local or Supabase).
 *
 * Usage:
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
