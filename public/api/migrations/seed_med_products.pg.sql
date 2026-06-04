-- Med-products.xlsx catalog seed (Neon / PostgreSQL)
-- Data is loaded by: npm run seed:products:neon
-- Idempotent upsert key for re-runs (name + manufacturer).

ALTER TABLE products ADD COLUMN IF NOT EXISTS import_key TEXT;

UPDATE products
SET import_key = LOWER(TRIM(name)) || '|' || COALESCE(LOWER(TRIM(manufacturer)), '') || '|' || COALESCE(LOWER(TRIM(generic_name)), '') || '|' || COALESCE(LOWER(TRIM(batch_number)), '')
WHERE import_key IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_import_key ON products (import_key);
