#!/usr/bin/env node
/**
 * Bulk-import products from Med-products.xlsx.
 * - Neon/PostgreSQL when DATABASE_URL is set in .env (import_key upsert)
 * - MySQL via PHP CLI when DATABASE_URL is unset and public/api/config.php exists
 *
 * Usage:
 *   node scripts/import-med-products.mjs [/path/to/file.xlsx] [--replace] [--mysql]
 */
import { readFileSync, existsSync } from "fs";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import pg from "pg";
import { parseMedProductsXlsx } from "./lib/med-products-parser.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const defaultXlsx = join(root, "Med-products.xlsx");

const args = process.argv.slice(2);
const replace = args.includes("--replace");
const forceMysql = args.includes("--mysql");
const xlsxPath = args.find((a) => !a.startsWith("--")) || defaultXlsx;

if (!existsSync(xlsxPath)) {
  console.error("File not found:", xlsxPath);
  process.exit(1);
}

function loadEnv() {
  const envPath = join(root, ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m || m[1].startsWith("#")) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!process.env[m[1]]) process.env[m[1]] = v;
  }
}

const { products, skippedNoName } = parseMedProductsXlsx(xlsxPath);
console.log(`Parsed ${products.length} products (${skippedNoName} rows without name)`);

loadEnv();

async function importToNeon() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL not set in .env");
    process.exit(1);
  }

  const pool = new pg.Pool({ connectionString: url, max: 1 });
  const client = await pool.connect();
  const BATCH = 100;
  const COLS = 13;
  const upsertHead = `
    INSERT INTO products (
      name, name_bn, generic_name, manufacturer, category, price,
      quantity, min_quantity, batch_number, expiry_date,
      requires_prescription, description, import_key
    ) VALUES `;
  const upsertTail = `
    ON CONFLICT (import_key) DO UPDATE SET
      name_bn = EXCLUDED.name_bn,
      generic_name = EXCLUDED.generic_name,
      manufacturer = EXCLUDED.manufacturer,
      category = EXCLUDED.category,
      price = EXCLUDED.price,
      quantity = EXCLUDED.quantity,
      min_quantity = EXCLUDED.min_quantity,
      batch_number = EXCLUDED.batch_number,
      expiry_date = EXCLUDED.expiry_date,
      requires_prescription = EXCLUDED.requires_prescription,
      description = EXCLUDED.description,
      updated_at = NOW()
  `;

  try {
    await client.query("BEGIN");
    if (replace) {
      await client.query("DELETE FROM products");
      console.log("✓ Cleared products table");
    }

    let imported = 0;
    for (let i = 0; i < products.length; i += BATCH) {
      const batch = products.slice(i, i + BATCH);
      const params = [];
      const tuples = batch.map((p, rowIdx) => {
        const offset = rowIdx * COLS;
        params.push(
          p.name,
          p.name_bn,
          p.generic_name,
          p.manufacturer,
          p.category,
          p.price,
          p.stock,
          p.min_stock,
          p.batch_number,
          p.expiry_date,
          p.requires_prescription,
          p.description,
          p.import_key
        );
        const ph = Array.from({ length: COLS }, (_, c) => `$${offset + c + 1}`);
        return `(${ph.join(", ")})`;
      });
      await client.query(`${upsertHead}${tuples.join(", ")}${upsertTail}`, params);
      imported += batch.length;
      if (imported % 1500 === 0 || imported === products.length) {
        console.log(`  … ${imported} / ${products.length}`);
      }
    }
    await client.query("COMMIT");
    const total = await pool.query("SELECT COUNT(*)::int AS n FROM products");
    console.log(`✓ Upserted ${imported} rows into Neon PostgreSQL`);
    console.log(`✓ Total products in database: ${total.rows[0].n}`);
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("Import failed:", e.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

if (!forceMysql && process.env.DATABASE_URL) {
  await importToNeon();
  process.exit(0);
}

const configPhp = join(root, "public/api/config.php");
if (!existsSync(configPhp)) {
  console.error(
    "No DATABASE_URL in .env and no public/api/config.php — set Neon URL or copy config.example.php"
  );
  process.exit(1);
}

function uuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const payload = JSON.stringify({
  replace,
  products: products.map((p) => ({
    id: uuid(),
    ...p,
    requires_prescription: p.requires_prescription ? 1 : 0,
  })),
});
const phpScript = join(root, "public/api/import-products-cli.php");
const result = spawnSync("php", [phpScript], {
  input: payload,
  encoding: "utf8",
  maxBuffer: 64 * 1024 * 1024,
});

if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
process.exit(result.status ?? 1);
