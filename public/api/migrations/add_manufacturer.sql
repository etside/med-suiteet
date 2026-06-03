-- Optional: run once to enable manufacturer grouping on Medicine Companies page
ALTER TABLE products ADD COLUMN manufacturer VARCHAR(255) DEFAULT NULL AFTER generic_name;
CREATE INDEX idx_products_manufacturer ON products (manufacturer);
