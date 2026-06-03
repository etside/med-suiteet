-- PostgreSQL: manufacturer column for Medicine Companies grouping
ALTER TABLE products ADD COLUMN IF NOT EXISTS manufacturer VARCHAR(255) DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_products_manufacturer ON products (manufacturer);
