#!/usr/bin/env node
/**
 * Test Neon connection and optionally apply netlify schema.
 * Usage: node scripts/neon-db-check.mjs [--apply]
 * Reads DATABASE_URL from project root .env
 */
import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const envPath = join(root, '.env');

function loadEnv() {
  if (!existsSync(envPath)) {
    console.error('Missing .env — copy .env.example and set DATABASE_URL');
    process.exit(1);
  }
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m || m[1].startsWith('#')) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!process.env[m[1]]) process.env[m[1]] = v;
  }
}

const apply = process.argv.includes('--apply');

loadEnv();
const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL not set in .env');
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: url, max: 1 });

try {
  const ping = await pool.query('SELECT current_database() AS db, version() AS version');
  console.log('OK connected:', ping.rows[0].db);

  const tables = await pool.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);
  console.log('Tables:', tables.rows.map((r) => r.table_name).join(', ') || '(none)');

  if (apply) {
    for (const file of ['neon_netlify_schema.sql', 'neon_netlify_alter.sql']) {
      const sqlPath = join(root, 'public/api/migrations', file);
      if (!existsSync(sqlPath)) continue;
      await pool.query(readFileSync(sqlPath, 'utf8'));
      console.log('Applied:', sqlPath);
    }
  }

  const products = await pool.query(
    `SELECT COUNT(*)::int AS n FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = 'products'`
  );
  if (Number(products.rows[0]?.n) > 0) {
    const count = await pool.query('SELECT COUNT(*)::int AS n FROM products');
    console.log('Product rows:', count.rows[0].n);
  } else {
    console.log('Product rows: (products table missing)');
  }
} catch (e) {
  console.error('FAIL:', e.message);
  process.exit(1);
} finally {
  await pool.end();
}
