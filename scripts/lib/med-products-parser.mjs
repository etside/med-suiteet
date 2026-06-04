/**
 * Parse Med-products.xlsx rows into product records (MySQL + Neon compatible).
 */
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const XLSX = require("xlsx");

export function buildDescription(row) {
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

export function normalizeExpiry(val) {
  if (!val) return null;
  if (val instanceof Date) {
    if (Number.isNaN(val.getTime())) return null;
    return val.toISOString().slice(0, 10);
  }
  const s = String(val).trim();
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return isValidDateParts(s) ? s : null;
  }
  const n = Number(s);
  if (!Number.isNaN(n) && n > 30000 && n < 80000) {
    const epoch = new Date(Date.UTC(1899, 11, 30));
    epoch.setUTCDate(epoch.getUTCDate() + n);
    if (Number.isNaN(epoch.getTime())) return null;
    const iso = epoch.toISOString().slice(0, 10);
    return isValidDateParts(iso) ? iso : null;
  }
  const sliced = s.slice(0, 10);
  return isValidDateParts(sliced) ? sliced : null;
}

function isValidDateParts(iso) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const [y, m, d] = iso.split("-").map(Number);
  if (y < 1990 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return false;
  const dt = new Date(`${iso}T00:00:00Z`);
  return !Number.isNaN(dt.getTime()) && dt.toISOString().slice(0, 10) === iso;
}

export function importKey(name, manufacturer, genericName, batchNumber) {
  return [
    String(name).trim().toLowerCase(),
    String(manufacturer || "").trim().toLowerCase(),
    String(genericName || "").trim().toLowerCase(),
    String(batchNumber || "").trim().toLowerCase(),
  ].join("|");
}

export function parseMedProductsXlsx(xlsxPath) {
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
    const manufacturer = String(row.manufacturer ?? "").trim() || null;

    products.push({
      name,
      name_bn: String(row.name_bn ?? "").trim() || null,
      generic_name: String(row.generic_name ?? "").trim() || null,
      manufacturer,
      category: String(row.category ?? "").trim() || null,
      price: Number(row.price) || 0,
      stock: Number(row.stock) || 0,
      min_stock: Number(row.min_stock) || 10,
      batch_number: String(row.batch_number ?? "").trim() || null,
      expiry_date: normalizeExpiry(row.expiry_date),
      requires_prescription: requires,
      description: buildDescription(row),
      import_key: importKey(name, manufacturer, row.generic_name, row.batch_number),
    });
  }

  return { products, skippedNoName, sheetName: wb.SheetNames[0] };
}
