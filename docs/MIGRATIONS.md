# Database migrations (Neon PostgreSQL)

Production (Netlify + Neon) uses **PostgreSQL**. Local PHP dev often uses **MySQL** (`public/api/schema.sql`). Do not run MySQL-only files against Neon.

## Inventory

| File | Target | In runner | Notes |
|------|--------|-----------|--------|
| `neon_netlify_schema.sql` | PostgreSQL | yes (1) | Base tables: users, products, orders, suppliers |
| `neon_netlify_alter.sql` | PostgreSQL | yes (2) | Extra product columns; orders/suppliers if missing |
| `add_manufacturer.pg.sql` | PostgreSQL | yes (3) | `products.manufacturer` + index |
| `add_biometric.pg.sql` | PostgreSQL | yes (4) | WebAuthn columns on `users` |
| `add_cms.pg.sql` | PostgreSQL | yes (5) | `cms_content` table |
| `seed_med_products.pg.sql` | PostgreSQL | yes (6) | `import_key` + Med-products seed |
| `neon_app_tables.pg.sql` | PostgreSQL | yes (7) | order_items, sales, profiles, POs, settings, notifications, PIN columns |
| `add_manufacturer.sql` | MySQL only | no | Used by PHP import / MySQL |
| `add_biometric.sql` | MySQL only | no | PHP WebAuthn on MySQL |
| `add_cms.sql` | MySQL only | no | PHP CMS on MySQL |
| `public/api/schema.sql` | MySQL bootstrap | no | Full local MySQL schema |
| `NEON_DB_MIGRATION.sql` | MySQL (roadmap) | no | Future features doc; not Postgres |
| `public/api/seed-admin.php` | seed | no | Create admin user (MySQL/PHP) |
| `scripts/seed-admin-neon.mjs` | seed | no | Admin/staff on Neon (`npm run seed:admin:neon`) |
| `public/api/seed-products.php` | seed | no | Sample products |

State is tracked in **`schema_migrations`** (`name`, `applied_at`).

## Apply order (dependencies)

1. `neon_netlify_schema.sql` — creates core tables (FK: orders → users)
2. `neon_netlify_alter.sql` — alters `products`; creates orders/suppliers if needed
3. `add_manufacturer.pg.sql` — requires `products`
4. `add_biometric.pg.sql` — requires `users`
5. `add_cms.pg.sql` — optional FK `author_id` → `users`
6. `seed_med_products.pg.sql` — `import_key` column; runs seed with repo-root `Med-products.xlsx` on first apply (`--if-empty`)
7. `neon_app_tables.pg.sql` — checkout/POS/admin tables (order_items, sales, profiles, etc.)

All SQL uses `IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS` where possible so re-runs are safe; the runner still records each migration once in `schema_migrations`.

## Commands (before deploy)

```bash
cp .env.example .env
# Edit .env: set DATABASE_URL (Neon pooled URL, sslmode=require)

# Connection + table list
node scripts/neon-db-check.mjs

# Show pending vs applied
node scripts/run-migrations.mjs --status

# Apply all pending migrations
npm run migrate
# or: node scripts/run-migrations.mjs

# Manual alternative (single file)
psql "$DATABASE_URL" -f public/api/migrations/neon_netlify_schema.sql
```

## Netlify production checklist

1. Create Neon project; copy **pooled** connection string.
2. In Netlify → Site settings → Environment variables:
   - `DATABASE_URL` = `postgresql://…?sslmode=require`
   - `JWT_SECRET` = long random string
   - `VITE_API_URL` = `/.netlify/functions/api`
3. From your machine (with `.env` pointing at production Neon), run **once**:
   ```bash
   npm run migrate
   ```
4. Redeploy the site after env changes.
5. If `products` is empty after schema-only setup:
   ```bash
   npm run seed:products:neon -- ./Med-products.xlsx
   npm run seed:admin:neon -- admin@eMed.com 'YourSecurePass'
   ```
   Default XLSX path is `./Med-products.xlsx` at repo root. Re-run seed with upsert anytime (safe).
   Use `--replace` only when you intend to wipe the catalog (empty DB or full reset).

   MySQL (local PHP): `npm run import:products -- /path/to/Med-products.xlsx`

## MySQL (PHP host)

```bash
mysql -u USER -p DBNAME < public/api/schema.sql
mysql -u USER -p DBNAME < public/api/migrations/add_cms.sql
mysql -u USER -p DBNAME < public/api/migrations/add_biometric.sql
mysql -u USER -p DBNAME < public/api/migrations/add_manufacturer.sql
php public/api/seed-admin.php admin@example.com 'YourSecurePass'
```

## Smoke test (Netlify API)

After `netlify dev` or deploy:

```bash
node scripts/smoke-netlify-api.mjs
SMOKE_EMAIL=admin@eMed.com SMOKE_PASSWORD=… node scripts/smoke-netlify-api.mjs
```

## Deploy (Netlify)

1. Set `DATABASE_URL`, `JWT_SECRET`, `VITE_API_URL=/.netlify/functions/api` in Netlify UI.
2. From your machine with production `.env`: `npm run migrate`, seed products + admin.
3. `netlify deploy --prod` (requires Netlify CLI login).

## Troubleshooting

- **SSL warning from `pg`**: Neon URLs with `sslmode=require` are expected; optional: use `sslmode=verify-full` per driver docs.
- **Migration failed mid-way**: fix SQL/DB issue, then re-run; each migration runs in a transaction.
- **Already applied manually**: run `npm run migrate` — idempotent SQL is safe; only new names are inserted into `schema_migrations`. If you applied SQL without the runner, insert rows into `schema_migrations` or use `--status` and apply missing files with `psql`.
