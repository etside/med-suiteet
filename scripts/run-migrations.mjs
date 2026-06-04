#!/usr/bin/env node
/**
 * Apply pending PostgreSQL migrations (Neon / Netlify production).
 *
 * Usage:
 *   node scripts/run-migrations.mjs          # apply pending
 *   node scripts/run-migrations.mjs --status   # list applied / pending
 *   node scripts/run-migrations.mjs --dry-run  # show what would run
 *
 * Reads DATABASE_URL from project root .env (gitignored).
 */
import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const migrationsDir = join(root, 'public/api/migrations');

/** Ordered migrations for Neon/PostgreSQL (idempotent SQL). */
const MIGRATIONS = [
  { name: 'neon_netlify_schema', file: 'neon_netlify_schema.sql' },
  { name: 'neon_netlify_alter', file: 'neon_netlify_alter.sql' },
  { name: 'add_manufacturer', file: 'add_manufacturer.pg.sql' },
  { name: 'add_biometric', file: 'add_biometric.pg.sql' },
  { name: 'add_cms', file: 'add_cms.pg.sql' },
  { name: 'seed_med_products', file: 'seed_med_products.pg.sql', seedScript: 'scripts/seed-med-products-neon.mjs' },
  { name: 'neon_app_tables', file: 'neon_app_tables.pg.sql' },
];

const defaultMedProductsXlsx = join(root, 'Med-products.xlsx');

function loadEnv() {
  const envPath = join(root, '.env');
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

const dryRun = process.argv.includes('--dry-run');
const statusOnly = process.argv.includes('--status');

loadEnv();
const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL not set in .env');
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: url, max: 1 });

async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function appliedNames(client) {
  const res = await client.query('SELECT name FROM schema_migrations ORDER BY name');
  return new Set(res.rows.map((r) => r.name));
}

async function verify(client) {
  const checks = [
    { label: 'products.manufacturer', sql: `SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='manufacturer'` },
    { label: 'users.biometric_enrolled', sql: `SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='biometric_enrolled'` },
    { label: 'cms_content table', sql: `SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='cms_content'` },
    { label: 'order_items table', sql: `SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='order_items'` },
    { label: 'sales table', sql: `SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='sales'` },
    { label: 'profiles table', sql: `SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='profiles'` },
  ];
  console.log('\nVerification:');
  for (const c of checks) {
    const r = await client.query(c.sql);
    console.log(`  ${c.label}: ${r.rowCount > 0 ? 'OK' : 'MISSING'}`);
  }
  const tables = await client.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);
  console.log('  tables:', tables.rows.map((r) => r.table_name).join(', '));
  const count = await client.query(
    `SELECT COUNT(*)::int AS n FROM information_schema.tables WHERE table_schema='public' AND table_name='products'`
  );
  if (Number(count.rows[0]?.n) > 0) {
    const products = await client.query('SELECT COUNT(*)::int AS n FROM products');
    console.log('  product rows:', products.rows[0].n);
  }
}

try {
  const client = await pool.connect();
  try {
    await ensureMigrationsTable(client);
    const applied = await appliedNames(client);

    if (statusOnly || dryRun) {
      console.log('Migration status:');
      for (const m of MIGRATIONS) {
        const done = applied.has(m.name);
        console.log(`  ${done ? 'applied' : 'pending'}  ${m.file} (${m.name})`);
      }
      if (dryRun) {
        const pending = MIGRATIONS.filter((m) => !applied.has(m.name));
        if (pending.length) {
          console.log('\nWould apply:', pending.map((m) => m.file).join(', '));
        } else {
          console.log('\nNothing pending.');
        }
      }
      if (statusOnly) await verify(client);
      process.exit(0);
    }

    let ran = 0;
    for (const m of MIGRATIONS) {
      if (applied.has(m.name)) {
        console.log('skip', m.name);
        continue;
      }
      const path = join(migrationsDir, m.file);
      if (!existsSync(path)) {
        throw new Error(`Migration file missing: ${path}`);
      }
      const sql = readFileSync(path, 'utf8');
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [m.name]);
        await client.query('COMMIT');
        console.log('applied', m.name, `(${m.file})`);
        ran++;

        if (m.seedScript) {
          const scriptPath = join(root, m.seedScript);
          if (!existsSync(scriptPath)) {
            throw new Error(`Seed script missing: ${scriptPath}`);
          }
          console.log('running seed', m.seedScript);
          const seedArgs = ['--if-empty', defaultMedProductsXlsx];
          const seed = spawnSync('node', [scriptPath, ...seedArgs], {
            cwd: root,
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'pipe'],
          });
          if (seed.stdout) process.stdout.write(seed.stdout);
          if (seed.stderr) process.stderr.write(seed.stderr);
          if (seed.status !== 0) {
            console.error('WARN: Seed script failed — re-run manually: npm run seed:products:neon');
          }
        }
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      }
    }

    if (ran === 0) console.log('All migrations already applied.');
    await verify(client);
  } finally {
    client.release();
  }
} catch (e) {
  console.error('FAIL:', e.message);
  process.exit(1);
} finally {
  await pool.end();
}
