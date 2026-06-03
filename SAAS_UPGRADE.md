# Medsuite-eT SaaS Upgrade (v2.1)

## What changed

### PWA & mobile
- Single manifest (`public/manifest.json`) with SVG icons — no missing PNG assets
- API requests use **NetworkOnly** in the service worker (no stale auth/data cache)
- Accessible viewport (`viewport-fit=cover`, zoom allowed)
- Offline banner when the network drops
- Apple touch icon + favicon use `/logo.svg`

### Security & routing
- **Role-based routes**: staff/admin pages redirect customers to `/dashboard`
- Netlify login uses **bcrypt** (legacy plaintext auto-upgrades on login)
- Security headers on Netlify (`X-Frame-Options`, `Referrer-Policy`, etc.)
- Removed hardcoded demo password from the login form

### API unification
- Netlify functions accept `auth_login`, `auth_signup`, `auth_me` (same as PHP client)
- Health check shape aligned with PHP
- MySQL `cms_content` endpoint + migration (`public/api/migrations/add_cms.sql`)
- JWT `verify_token` / UUID user IDs fixed for MySQL

### Biometric (WebAuthn) on MySQL
- Run `public/api/migrations/add_biometric.sql`
- Enroll in **Profile → Biometric Authentication** (admin only)
- Sign in via **Biometric** tab on `/auth`

### Configuration
- See `.env.example` for `DATABASE_URL`, `VITE_API_URL`, `VITE_API_BASE`, etc.
- **Local**: copy `.env.example` → `.env` (gitignored); set Neon `DATABASE_URL` for `node scripts/neon-db-check.mjs`
- **PHP local dev** still uses `public/api/config.php` (MySQL) — not Neon

## Recommended production setup

### Option A — Netlify + Neon (serverless API)

1. **Frontend**: Netlify (`npm run build`)
2. **Database**: [Neon](https://neon.tech) PostgreSQL — copy pooled connection string
3. **Netlify env** (Site settings → Environment variables):
   - `DATABASE_URL` = `postgresql://USER:PASSWORD@ep-….neon.tech/neondb?sslmode=require`
   - `JWT_SECRET` = long random string (`openssl rand -base64 32`)
   - `VITE_API_URL` = `/.netlify/functions/api`
4. **Migrations** (once per Neon project — see `docs/MIGRATIONS.md`):
   ```bash
   cp .env.example .env   # set DATABASE_URL locally only
   npm run migrate
   node scripts/run-migrations.mjs --status   # optional verify
   ```
5. If the catalog is empty: `npm run import:products -- /path/to/Med-products.xlsx` (omit `--replace` unless resetting)
6. Redeploy Netlify after env changes

### Option B — PHP + MySQL (full features, biometric, CMS)

1. **Frontend**: Netlify or static host
2. **API**: Host `public/api/` on PHP 8 + MySQL 8
3. Set `VITE_API_BASE=https://your-api.example.com/api/index.php` in Netlify env
4. Run migrations: `add_cms.sql` if using CMS
5. Seed admin: `php public/api/seed-admin.php you@pharmacy.com SecurePass123`

## Local dev

```bash
npm run dev
# App: http://localhost:8080
# API: proxied to PHP :8090
```

## Bulk product import (Excel)

```bash
# Replace catalog from Med-products.xlsx (clears existing products + order line items)
npm run import:products -- /path/to/Med-products.xlsx --replace

# Append without clearing (default)
npm run import:products -- /path/to/Med-products.xlsx
```

Applies `add_manufacturer.sql` automatically when needed. Maps strength, dosage form, drug class, and indication into `description`.
