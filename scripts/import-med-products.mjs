#!/usr/bin/env node
/**
 * Bulk-import products from Med-products.xlsx into MySQL (CLI).
 * Usage: node scripts/import-med-products.mjs [/path/to/file.xlsx] [--replace]
 */
import { readFileSync, existsSync } from "fs";
import { createRequire } from "module";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const require = createRequire(import.meta.url);
const XLSX = require("xlsx");

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const defaultXlsx = "/home/tjms/Downloads/Med-products.xlsx";

const args = process.argv.slice(2);
const replace = args.includes("--replace");
const xlsxPath = args.find((a) => !a.startsWith("--")) || defaultXlsx;

if (!existsSync(xlsxPath)) {
  console.error("File not found:", xlsxPath);
  process.exit(1);
}

function parsePhpConfig() {
  const configPath = join(root, "public/api/config.php");
  const src = readFileSync(configPath, "utf8");
  const pick = (key) => {
    const m = src.match(new RegExp(`'${key}'\\s*=>\\s*'([^']*)'`));
    return m ? m[1] : "";
  };
  return {
    db_host: pick("db_host") || "127.0.0.1",
    db_port: pick("db_port") || "3306",
    db_name: pick("db_name") || "medsuite",
    db_user: pick("db_user"),
    db_pass: pick("db_pass"),
  };
}

function buildDescription(row) {
  const parts = [];
  if (row.strength) parts.push(`Strength: ${row.strength}`);
  if (row.dosage_form) parts.push(`Form: ${row.dosage_form}`);
  if (row.drug_class) parts.push(`Class: ${row.drug_class}`);
  if (row.indication) parts.push(`Indication: ${row.indication}`);
  if (row.pieces_per_box && Number(row.pieces_per_box) !== 1) {
    parts.push(`Pieces/box: ${row.pieces_per_box}`);
  }
  if (row.pieces_per_leaf && Number(row.pieces_per_leaf) !== 1) {
    parts.push(`Pieces/leaf: ${row.pieces_per_leaf}`);
  }
  const base = row.description ? String(row.description).trim() : "";
  if (base && parts.length) return `${base} | ${parts.join(" | ")}`;
  if (base) return base;
  return parts.length ? parts.join(" | ") : null;
}

function normalizeExpiry(val) {
  if (!val) return null;
  if (val instanceof Date) {
    return val.toISOString().slice(0, 10);
  }
  const s = String(val).trim();
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const n = Number(s);
  if (!Number.isNaN(n) && n > 30000) {
    const epoch = new Date(Date.UTC(1899, 11, 30));
    epoch.setUTCDate(epoch.getUTCDate() + n);
    return epoch.toISOString().slice(0, 10);
  }
  return s.slice(0, 10);
}

function uuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const wb = XLSX.readFile(xlsxPath);
const sheet = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

const products = [];
let skippedNoName = 0;
for (const row of rows) {
  const name = String(row.name ?? "").trim();
  if (!name) {
    skippedNoName++;
    continue;
  }
  const rx = row.requires_prescription;
  const requires =
    rx === true ||
    rx === 1 ||
    String(rx).toLowerCase() === "true" ||
    String(rx).toLowerCase() === "yes";
  products.push({
    id: uuid(),
    name,
    name_bn: String(row.name_bn ?? "").trim() || null,
    generic_name: String(row.generic_name ?? "").trim() || null,
    manufacturer: String(row.manufacturer ?? "").trim() || null,
    category: String(row.category ?? "").trim() || null,
    price: Number(row.price) || 0,
    stock: Number(row.stock) || 0,
    min_stock: Number(row.min_stock) || 10,
    batch_number: String(row.batch_number ?? "").trim() || null,
    expiry_date: normalizeExpiry(row.expiry_date),
    requires_prescription: requires ? 1 : 0,
    description: buildDescription(row),
  });
}

console.log(`Parsed ${products.length} products (${skippedNoName} rows without name)`);

const payload = JSON.stringify({ replace, products });
const phpScript = join(root, "public/api/import-products-cli.php");
const result = spawnSync("php", [phpScript], {
  input: payload,
  encoding: "utf8",
  maxBuffer: 64 * 1024 * 1024,
});

if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
process.exit(result.status ?? 1);
