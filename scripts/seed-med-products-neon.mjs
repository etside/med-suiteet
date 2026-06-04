#!/usr/bin/env node
/**
 * Seed Med-products.xlsx into Neon/PostgreSQL (Netlify production).
 *
 * Usage:
 *   node scripts/seed-med-products-neon.mjs [/path/to/Med-products.xlsx]
 *   node scripts/seed-med-products-neon.mjs --if-empty   # skip when catalog already seeded
 *   node scripts/seed-med-products-neon.mjs --replace    # wipe products first (destructive)
 *
 * Reads DATABASE_URL from project root .env
 */
import { existsSync, readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import { parseMedProductsXlsx } from "./lib/med-products-parser.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const defaultXlsx = join(root, "Med-products.xlsx");

const args = process.argv.slice(2);
const replace = args.includes("--replace");
const ifEmpty = args.includes("--if-empty");
const xlsxPath = args.find((a) => !a.startsWith("--")) || defaultXlsx;

function loadEnv() {
  const envPath = join(root, ".env");
  if (!existsSync(envPath)) {
    console.error("Missing .env — copy .env.example and set DATABASE_URL");
    process.exit(1);
  }
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

if (!existsSync(xlsxPath)) {
  console.error("File not found:", xlsxPath);
  process.exit(1);
}

loadEnv();
const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL not set in .env");
  process.exit(1);
}

const { products, skippedNoName } = parseMedProductsXlsx(xlsxPath);
console.log(`Parsed ${products.length} products (${skippedNoName} rows without name)`);
const deduped = [];
const seenKeys = new Map();
for (const p of products) seenKeys.set(p.import_key, p);
for (const p of seenKeys.values()) deduped.push(p);
if (deduped.length !== products.length) {
  console.log(`Deduped ${products.length - deduped.length} rows with duplicate import_key`);
}
products.length = 0;
products.push(...deduped);

const pool = new pg.Pool({ connectionString: url, max: 1 });
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

function rowValues(p, offset) {
  return [
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
    p.import_key,
  ].map((_, i) => `$${offset + i + 1}`);
}

try {
  const client = await pool.connect();
  try {
    const countRes = await client.query("SELECT COUNT(*)::int AS n FROM products");
    const existing = Number(countRes.rows[0]?.n || 0);

    if (ifEmpty && existing > 5000) {
      console.log(`Skip: products table already has ${existing} rows (use --replace to reset)`);
      process.exit(0);
    }

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
        return `(${rowValues(p, offset).join(", ")})`;
      });
      await client.query(`${upsertHead}${tuples.join(", ")}${upsertTail}`, params);
      imported += batch.length;
      process.stdout.write(`\r  ${Math.min(i + BATCH, products.length)}/${products.length}`);
    }
    process.stdout.write("\n");

    await client.query("COMMIT");

    const total = await client.query("SELECT COUNT(*)::int AS n FROM products");
    console.log(`✓ Upserted ${imported} products`);
    console.log(`✓ Total products in database: ${total.rows[0].n}`);
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
} catch (e) {
  console.error("FAIL:", e.message);
  process.exit(1);
} finally {
  await pool.end();
}
